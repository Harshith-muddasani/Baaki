package com.baaki;

import com.baaki.dto.balance.BalanceResponse;
import com.baaki.dto.expense.CreateExpenseRequest;
import com.baaki.dto.expense.ExpenseResponse;
import com.baaki.dto.expense.ExpenseSplitResponse;
import com.baaki.dto.expense.SplitParticipantRequest;
import com.baaki.dto.group.CreateGroupRequest;
import com.baaki.dto.group.GroupResponse;
import com.baaki.dto.groupmember.AddGroupMemberRequest;
import com.baaki.dto.groupmember.GroupMemberResponse;
import com.baaki.dto.settlement.CreateSettlementRequest;
import com.baaki.dto.settlement.SettlementResponse;
import com.baaki.dto.settlement.SettlementSuggestionResponse;
import com.baaki.dto.user.CreateUserRequest;
import com.baaki.dto.user.UserResponse;
import com.baaki.entity.BalanceCacheId;
import com.baaki.entity.SplitType;
import com.baaki.repository.BalanceCacheRepository;
import com.baaki.repository.SettlementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/**
 * End-to-end happy path against a real Postgres (no H2) - create a user,
 * create a group (creator is auto-added as a member), add a second member.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
// db/loadtest (V4, 650k synthetic rows for benchmarking - see
// docs/benchmarks.md) is excluded here on purpose: this test spins up a
// fresh Postgres every run, and paying to insert 650k rows on every single
// test run would make the whole suite miserable for zero benefit to
// correctness testing.
@TestPropertySource(properties = "spring.flyway.locations=classpath:db/migration")
class ExpenseSettlementServiceApplicationIT {

	@Container
	@ServiceConnection
	static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18-alpine");

	@LocalServerPort
	private int port;

	@Autowired
	private BalanceCacheRepository balanceCacheRepository;

	@Autowired
	private SettlementRepository settlementRepository;

	private RestTestClient restTestClient;

	@BeforeEach
	void setUp() {
		restTestClient = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
	}

	@Test
	void createsUserGroupAndAddsMember() {
		Long ownerId = createUser("Ada Lovelace", "ada@example.com").id();

		GroupResponse group = restTestClient.post().uri("/groups")
				.body(new CreateGroupRequest("Goa Trip", ownerId))
				.exchange()
				.expectStatus().isCreated()
				.expectBody(GroupResponse.class)
				.returnResult()
				.getResponseBody();
		Long groupId = group.id();

		Long secondUserId = createUser("Grace Hopper", "grace@example.com").id();

		restTestClient.post().uri("/groups/{groupId}/members", groupId)
				.body(new AddGroupMemberRequest(secondUserId))
				.exchange()
				.expectStatus().isCreated()
				.expectBody(GroupMemberResponse.class);

		GroupMemberResponse[] members = restTestClient.get().uri("/groups/{groupId}/members", groupId)
				.exchange()
				.expectStatus().isOk()
				.expectBody(GroupMemberResponse[].class)
				.returnResult()
				.getResponseBody();

		assertThat(members).hasSize(2);
	}

	@Test
	void createsExpenseWithEqualSplitAndComputesBalances() {
		Long userA = createUser("Alice", "alice@example.com").id();
		Long userB = createUser("Bob", "bob@example.com").id();
		Long userC = createUser("Carol", "carol@example.com").id();

		GroupResponse group = restTestClient.post().uri("/groups")
				.body(new CreateGroupRequest("Trip", userA))
				.exchange()
				.expectStatus().isCreated()
				.expectBody(GroupResponse.class)
				.returnResult()
				.getResponseBody();
		Long groupId = group.id();

		addMember(groupId, userB);
		addMember(groupId, userC);

		CreateExpenseRequest expenseRequest = new CreateExpenseRequest(
				userA, "Dinner", 300L, "INR", SplitType.EQUAL,
				List.of(new SplitParticipantRequest(userA, null, null, null),
						new SplitParticipantRequest(userB, null, null, null),
						new SplitParticipantRequest(userC, null, null, null)),
				userA);

		ExpenseResponse expense = restTestClient.post().uri("/groups/{groupId}/expenses", groupId)
				.body(expenseRequest)
				.exchange()
				.expectStatus().isCreated()
				.expectBody(ExpenseResponse.class)
				.returnResult()
				.getResponseBody();

		assertThat(expense.splits()).hasSize(3);
		assertThat(expense.splits().stream().mapToLong(ExpenseSplitResponse::shareAmount).sum()).isEqualTo(300L);

		BalanceResponse[] balances = restTestClient.get().uri("/groups/{groupId}/balances", groupId)
				.exchange()
				.expectStatus().isOk()
				.expectBody(BalanceResponse[].class)
				.returnResult()
				.getResponseBody();

		Map<Long, Long> balanceByUser = Arrays.stream(balances)
				.collect(Collectors.toMap(BalanceResponse::userId, BalanceResponse::netBalance));

		// A paid 300, owes self 100 -> net +200; B and C each owe 100
		assertThat(balanceByUser.get(userA)).isEqualTo(200L);
		assertThat(balanceByUser.get(userB)).isEqualTo(-100L);
		assertThat(balanceByUser.get(userC)).isEqualTo(-100L);

		SettlementSuggestionResponse[] suggestions = restTestClient.get()
				.uri("/groups/{groupId}/settlements/suggestions", groupId)
				.exchange()
				.expectStatus().isOk()
				.expectBody(SettlementSuggestionResponse[].class)
				.returnResult()
				.getResponseBody();

		// B and C each owe A 100 - two transactions, both settling to A
		assertThat(suggestions).hasSize(2);
		assertThat(suggestions).allMatch(s -> s.toUserId().equals(userA) && s.amount() == 100L);
		assertThat(Arrays.stream(suggestions).map(SettlementSuggestionResponse::fromUserId).toList())
				.containsExactlyInAnyOrder(userB, userC);
	}

	@Test
	void recordsSettlementIdempotently() {
		Long userA = createUser("Dave", "dave@example.com").id();
		Long userB = createUser("Erin", "erin@example.com").id();

		GroupResponse group = restTestClient.post().uri("/groups")
				.body(new CreateGroupRequest("Settle Up", userA))
				.exchange()
				.expectStatus().isCreated()
				.expectBody(GroupResponse.class)
				.returnResult()
				.getResponseBody();
		Long groupId = group.id();
		addMember(groupId, userB);

		String idempotencyKey = UUID.randomUUID().toString();
		CreateSettlementRequest request = new CreateSettlementRequest(userB, userA, 500L);

		SettlementResponse first = restTestClient.post().uri("/groups/{groupId}/settlements", groupId)
				.header("Idempotency-Key", idempotencyKey)
				.body(request)
				.exchange()
				.expectStatus().isCreated()
				.expectBody(SettlementResponse.class)
				.returnResult()
				.getResponseBody();

		// retry with the SAME key - must return the original, not a new row, and 200 not 201
		SettlementResponse retry = restTestClient.post().uri("/groups/{groupId}/settlements", groupId)
				.header("Idempotency-Key", idempotencyKey)
				.body(request)
				.exchange()
				.expectStatus().isOk()
				.expectBody(SettlementResponse.class)
				.returnResult()
				.getResponseBody();

		assertThat(retry.id()).isEqualTo(first.id());

		// a DIFFERENT key creates a genuinely new settlement
		SettlementResponse second = restTestClient.post().uri("/groups/{groupId}/settlements", groupId)
				.header("Idempotency-Key", UUID.randomUUID().toString())
				.body(new CreateSettlementRequest(userB, userA, 100L))
				.exchange()
				.expectStatus().isCreated()
				.expectBody(SettlementResponse.class)
				.returnResult()
				.getResponseBody();

		assertThat(second.id()).isNotEqualTo(first.id());
	}

	@Test
	void settlingAFullDebtBringsBothBalancesToZero() {
		Long userA = createUser("Mallory", "mallory@example.com").id();
		Long userB = createUser("Niaj", "niaj@example.com").id();

		GroupResponse group = restTestClient.post().uri("/groups")
				.body(new CreateGroupRequest("Full Settle", userA))
				.exchange().expectStatus().isCreated().expectBody(GroupResponse.class).returnResult().getResponseBody();
		Long groupId = group.id();
		addMember(groupId, userB);

		// A fronts 1000, split equally -> A is owed 500 by B
		restTestClient.post().uri("/groups/{groupId}/expenses", groupId)
				.body(new CreateExpenseRequest(userA, "Big one", 1000L, "INR", SplitType.EQUAL,
						List.of(new SplitParticipantRequest(userA, null, null, null),
								new SplitParticipantRequest(userB, null, null, null)),
						userA))
				.exchange()
				.expectStatus().isCreated();

		// B pays A 500 in cash to settle up - paidByUserId is whoever hands over
		// the cash (B), paidToUserId is whoever receives it (A), matching plain
		// English and matching expenses.paid_by's semantics.
		restTestClient.post().uri("/groups/{groupId}/settlements", groupId)
				.header("Idempotency-Key", UUID.randomUUID().toString())
				.body(new CreateSettlementRequest(userB, userA, 500L))
				.exchange()
				.expectStatus().isCreated();

		BalanceResponse[] balances = restTestClient.get().uri("/groups/{groupId}/balances", groupId)
				.exchange()
				.expectStatus().isOk()
				.expectBody(BalanceResponse[].class)
				.returnResult()
				.getResponseBody();
		Map<Long, Long> balanceByUser = Arrays.stream(balances)
				.collect(Collectors.toMap(BalanceResponse::userId, BalanceResponse::netBalance));

		assertThat(balanceByUser.get(userA)).isEqualTo(0L);
		assertThat(balanceByUser.get(userB)).isEqualTo(0L);

		SettlementSuggestionResponse[] suggestions = restTestClient.get()
				.uri("/groups/{groupId}/settlements/suggestions", groupId)
				.exchange()
				.expectStatus().isOk()
				.expectBody(SettlementSuggestionResponse[].class)
				.returnResult()
				.getResponseBody();
		assertThat(suggestions).isEmpty();
	}

	@Test
	void rejectsSettlementWithoutIdempotencyKeyHeader() {
		Long userA = createUser("Frank", "frank@example.com").id();
		Long userB = createUser("Grace", "grace2@example.com").id();
		GroupResponse group = restTestClient.post().uri("/groups")
				.body(new CreateGroupRequest("No Header", userA))
				.exchange().expectStatus().isCreated().expectBody(GroupResponse.class).returnResult().getResponseBody();
		addMember(group.id(), userB);

		restTestClient.post().uri("/groups/{groupId}/settlements", group.id())
				.body(new CreateSettlementRequest(userB, userA, 100L))
				.exchange()
				.expectStatus().isBadRequest();
	}

	@Test
	void rejectsSettlementWithInvalidIdempotencyKey() {
		Long userA = createUser("Heidi", "heidi@example.com").id();
		Long userB = createUser("Ivan", "ivan@example.com").id();
		GroupResponse group = restTestClient.post().uri("/groups")
				.body(new CreateGroupRequest("Bad Key", userA))
				.exchange().expectStatus().isCreated().expectBody(GroupResponse.class).returnResult().getResponseBody();
		addMember(group.id(), userB);

		restTestClient.post().uri("/groups/{groupId}/settlements", group.id())
				.header("Idempotency-Key", "not-a-uuid")
				.body(new CreateSettlementRequest(userB, userA, 100L))
				.exchange()
				.expectStatus().isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
	}

	@Test
	void rejectsSettlementToSelf() {
		Long userA = createUser("Judy", "judy@example.com").id();
		GroupResponse group = restTestClient.post().uri("/groups")
				.body(new CreateGroupRequest("Self Pay", userA))
				.exchange().expectStatus().isCreated().expectBody(GroupResponse.class).returnResult().getResponseBody();

		restTestClient.post().uri("/groups/{groupId}/settlements", group.id())
				.header("Idempotency-Key", UUID.randomUUID().toString())
				.body(new CreateSettlementRequest(userA, userA, 100L))
				.exchange()
				.expectStatus().isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
	}

	@Test
	void refreshesBalanceCacheAfterExpenseCreated() {
		Long userA = createUser("Kevin", "kevin@example.com").id();
		Long userB = createUser("Laura", "laura@example.com").id();

		GroupResponse group = restTestClient.post().uri("/groups")
				.body(new CreateGroupRequest("Cache Test", userA))
				.exchange().expectStatus().isCreated().expectBody(GroupResponse.class).returnResult().getResponseBody();
		Long groupId = group.id();
		addMember(groupId, userB);

		restTestClient.post().uri("/groups/{groupId}/expenses", groupId)
				.body(new CreateExpenseRequest(userA, "Cache seed", 200L, "INR", SplitType.EQUAL,
						List.of(new SplitParticipantRequest(userA, null, null, null),
								new SplitParticipantRequest(userB, null, null, null)),
						userA))
				.exchange()
				.expectStatus().isCreated();

		await().atMost(Duration.ofSeconds(5)).untilAsserted(() -> {
			var cacheA = balanceCacheRepository.findById(new BalanceCacheId(groupId, userA));
			var cacheB = balanceCacheRepository.findById(new BalanceCacheId(groupId, userB));
			assertThat(cacheA).isPresent();
			assertThat(cacheB).isPresent();
			assertThat(cacheA.get().getNetBalance()).isEqualTo(100L);
			assertThat(cacheB.get().getNetBalance()).isEqualTo(-100L);
		});
	}

	// ============================================================
	// Split-type coverage - EQUAL is covered above; the other three
	// (EXACT/PERCENTAGE/SHARES) were previously only unit-tested at the
	// SplitCalculator level, never exercised through the real HTTP API.
	// ============================================================

	@Test
	void createsExpenseWithExactSplit_arbitraryUnevenAmounts() {
		Long userA = createUser("Nora", "nora@example.com").id();
		Long userB = createUser("Oscar", "oscar@example.com").id();
		Long userC = createUser("Priyanka", "priyanka-it@example.com").id();

		Long groupId = createGroup("Exact Split Trip", userA).id();
		addMember(groupId, userB);
		addMember(groupId, userC);

		ExpenseResponse expense = postExpense(groupId, new CreateExpenseRequest(
				userA, "Groceries", 10000L, "INR", SplitType.EXACT,
				List.of(new SplitParticipantRequest(userA, 5000L, null, null),
						new SplitParticipantRequest(userB, 3000L, null, null),
						new SplitParticipantRequest(userC, 2000L, null, null)),
				userA));

		Map<Long, Long> shareByUser = shareByUser(expense);
		assertThat(shareByUser.get(userA)).isEqualTo(5000L);
		assertThat(shareByUser.get(userB)).isEqualTo(3000L);
		assertThat(shareByUser.get(userC)).isEqualTo(2000L);
	}

	@Test
	void createsExpenseWithPercentageSplit_computesSharesFromPercentages() {
		Long userA = createUser("Quinn", "quinn@example.com").id();
		Long userB = createUser("Rosa", "rosa@example.com").id();

		Long groupId = createGroup("Percentage Trip", userA).id();
		addMember(groupId, userB);

		ExpenseResponse expense = postExpense(groupId, new CreateExpenseRequest(
				userA, "Hotel", 10000L, "INR", SplitType.PERCENTAGE,
				List.of(new SplitParticipantRequest(userA, null, new BigDecimal("60"), null),
						new SplitParticipantRequest(userB, null, new BigDecimal("40"), null)),
				userA));

		Map<Long, Long> shareByUser = shareByUser(expense);
		assertThat(shareByUser.get(userA)).isEqualTo(6000L);
		assertThat(shareByUser.get(userB)).isEqualTo(4000L);
	}

	@Test
	void createsExpenseWithSharesSplit_weightedByShareCount() {
		Long userA = createUser("Sam", "sam@example.com").id();
		Long userB = createUser("Tara", "tara@example.com").id();

		Long groupId = createGroup("Shares Trip", userA).id();
		addMember(groupId, userB);

		ExpenseResponse expense = postExpense(groupId, new CreateExpenseRequest(
				userA, "Villa", 9000L, "INR", SplitType.SHARES,
				List.of(new SplitParticipantRequest(userA, null, null, 2L),
						new SplitParticipantRequest(userB, null, null, 1L)),
				userA));

		Map<Long, Long> shareByUser = shareByUser(expense);
		assertThat(shareByUser.get(userA)).isEqualTo(6000L);
		assertThat(shareByUser.get(userB)).isEqualTo(3000L);
	}

	// ============================================================
	// Breaking cases - invalid split data, only ever unit-tested against
	// SplitCalculator directly before; now verified through the full
	// controller -> service -> GlobalExceptionHandler path.
	// ============================================================

	@Test
	void rejectsExactSplitWhenAmountsDontSumToTotal() {
		Long userA = createUser("Uma", "uma@example.com").id();
		Long userB = createUser("Victor", "victor@example.com").id();
		Long groupId = createGroup("Bad Exact", userA).id();
		addMember(groupId, userB);

		restTestClient.post().uri("/groups/{groupId}/expenses", groupId)
				.body(new CreateExpenseRequest(userA, "Broken", 1000L, "INR", SplitType.EXACT,
						List.of(new SplitParticipantRequest(userA, 400L, null, null),
								new SplitParticipantRequest(userB, 400L, null, null)),
						userA))
				.exchange()
				.expectStatus().isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
	}

	@Test
	void rejectsPercentageSplitNotSummingTo100() {
		Long userA = createUser("Wendy", "wendy@example.com").id();
		Long userB = createUser("Xavier", "xavier@example.com").id();
		Long groupId = createGroup("Bad Percentage", userA).id();
		addMember(groupId, userB);

		restTestClient.post().uri("/groups/{groupId}/expenses", groupId)
				.body(new CreateExpenseRequest(userA, "Broken", 1000L, "INR", SplitType.PERCENTAGE,
						List.of(new SplitParticipantRequest(userA, null, new BigDecimal("50"), null),
								new SplitParticipantRequest(userB, null, new BigDecimal("40"), null)),
						userA))
				.exchange()
				.expectStatus().isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
	}

	@Test
	void rejectsSharesSplitWithAllZeroShares() {
		Long userA = createUser("Yara", "yara@example.com").id();
		Long userB = createUser("Zane", "zane@example.com").id();
		Long groupId = createGroup("Bad Shares", userA).id();
		addMember(groupId, userB);

		restTestClient.post().uri("/groups/{groupId}/expenses", groupId)
				.body(new CreateExpenseRequest(userA, "Broken", 1000L, "INR", SplitType.SHARES,
						List.of(new SplitParticipantRequest(userA, null, null, 0L),
								new SplitParticipantRequest(userB, null, null, 0L)),
						userA))
				.exchange()
				.expectStatus().isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
	}

	@Test
	void rejectsExpenseWithNonPositiveTotalAmount() {
		Long userA = createUser("Elena", "elena@example.com").id();
		Long groupId = createGroup("Zero Amount", userA).id();

		restTestClient.post().uri("/groups/{groupId}/expenses", groupId)
				.body(new CreateExpenseRequest(userA, "Free lunch", 0L, "INR", SplitType.EQUAL,
						List.of(new SplitParticipantRequest(userA, null, null, null)),
						userA))
				.exchange()
				.expectStatus().isBadRequest();
	}

	// ============================================================
	// Breaking cases - membership boundaries. Nothing previously verified
	// that a payer/participant/settler actually has to belong to the group.
	// ============================================================

	@Test
	void rejectsExpenseWhenPayerIsNotAGroupMember() {
		Long groupOwner = createUser("Amir", "amir@example.com").id();
		Long outsider = createUser("Bianca", "bianca@example.com").id();
		Long groupId = createGroup("Members Only", groupOwner).id();

		restTestClient.post().uri("/groups/{groupId}/expenses", groupId)
				.body(new CreateExpenseRequest(outsider, "Sneaky", 1000L, "INR", SplitType.EQUAL,
						List.of(new SplitParticipantRequest(groupOwner, null, null, null)),
						groupOwner))
				.exchange()
				.expectStatus().isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
	}

	@Test
	void rejectsExpenseWhenAParticipantIsNotAGroupMember() {
		Long groupOwner = createUser("Carlos", "carlos@example.com").id();
		Long outsider = createUser("Diana", "diana@example.com").id();
		Long groupId = createGroup("Members Only 2", groupOwner).id();

		restTestClient.post().uri("/groups/{groupId}/expenses", groupId)
				.body(new CreateExpenseRequest(groupOwner, "Sneaky split", 1000L, "INR", SplitType.EQUAL,
						List.of(new SplitParticipantRequest(groupOwner, null, null, null),
								new SplitParticipantRequest(outsider, null, null, null)),
						groupOwner))
				.exchange()
				.expectStatus().isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
	}

	@Test
	void rejectsSettlementWhenPayerIsNotAGroupMember() {
		Long groupOwner = createUser("Felix", "felix@example.com").id();
		Long outsider = createUser("Gina", "gina@example.com").id();
		Long groupId = createGroup("Settle Members Only", groupOwner).id();

		restTestClient.post().uri("/groups/{groupId}/settlements", groupId)
				.header("Idempotency-Key", UUID.randomUUID().toString())
				.body(new CreateSettlementRequest(outsider, groupOwner, 100L))
				.exchange()
				.expectStatus().isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
	}

	@Test
	void rejectsAddingTheSameMemberTwice() {
		Long owner = createUser("Hugo", "hugo@example.com").id();
		Long member = createUser("Ines", "ines@example.com").id();
		Long groupId = createGroup("No Duplicates", owner).id();
		addMember(groupId, member);

		restTestClient.post().uri("/groups/{groupId}/members", groupId)
				.body(new AddGroupMemberRequest(member))
				.exchange()
				.expectStatus().isEqualTo(HttpStatus.CONFLICT);
	}

	// ============================================================
	// Idempotency-key edge cases beyond the simple retry-with-same-key case.
	// ============================================================

	@Test
	void reusingIdempotencyKeyAcrossDifferentGroups_isRejectedNotMisattributed() {
		Long owner1 = createUser("Jamal", "jamal@example.com").id();
		Long member1 = createUser("Layla", "layla@example.com").id();
		Long owner2 = createUser("Kira", "kira@example.com").id();
		Long member2 = createUser("Milo", "milo@example.com").id();

		Long group1Id = createGroup("Group One", owner1).id();
		addMember(group1Id, member1);
		Long group2Id = createGroup("Group Two", owner2).id();
		addMember(group2Id, member2);

		String sharedKey = UUID.randomUUID().toString();

		restTestClient.post().uri("/groups/{groupId}/settlements", group1Id)
				.header("Idempotency-Key", sharedKey)
				.body(new CreateSettlementRequest(member1, owner1, 100L))
				.exchange()
				.expectStatus().isCreated();

		// Same key reused for an unrelated group - must be rejected, not silently
		// hand back group1's settlement under group2's URL.
		restTestClient.post().uri("/groups/{groupId}/settlements", group2Id)
				.header("Idempotency-Key", sharedKey)
				.body(new CreateSettlementRequest(member2, owner2, 50L))
				.exchange()
				.expectStatus().isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
	}

	@Test
	void concurrentDuplicateSettlementRequests_onlyOneRowIsEverCreated() throws Exception {
		Long userA = createUser("Noah", "noah@example.com").id();
		Long userB = createUser("Olive", "olive@example.com").id();
		Long groupId = createGroup("Race Condition", userA).id();
		addMember(groupId, userB);

		String idempotencyKey = UUID.randomUUID().toString();
		int concurrentRequests = 8;
		ExecutorService pool = Executors.newFixedThreadPool(concurrentRequests);
		CountDownLatch ready = new CountDownLatch(concurrentRequests);
		CountDownLatch go = new CountDownLatch(1);
		List<Future<Integer>> futures = new ArrayList<>();

		try {
			for (int i = 0; i < concurrentRequests; i++) {
				futures.add(pool.submit(() -> {
					ready.countDown();
					go.await();
					return restTestClient.post().uri("/groups/{groupId}/settlements", groupId)
							.header("Idempotency-Key", idempotencyKey)
							.body(new CreateSettlementRequest(userB, userA, 500L))
							.exchange()
							.expectBody(SettlementResponse.class)
							.returnResult()
							.getStatus()
							.value();
				}));
			}

			ready.await();
			go.countDown();

			List<Integer> statusCodes = new ArrayList<>();
			for (Future<Integer> future : futures) {
				statusCodes.add(future.get(10, TimeUnit.SECONDS));
			}

			assertThat(statusCodes).filteredOn(status -> status == 201).hasSize(1);
			assertThat(statusCodes).filteredOn(status -> status == 200).hasSize(concurrentRequests - 1);
		} finally {
			pool.shutdown();
		}

		long matchingRows = settlementRepository.findAll().stream()
				.filter(s -> s.getIdempotencyKey().equals(UUID.fromString(idempotencyKey)))
				.count();
		assertThat(matchingRows).isEqualTo(1L);
	}

	// ============================================================
	// A realistic multi-expense group, verified end-to-end: balances sum to
	// zero, and the simplified suggestions replay back to those exact
	// balances - the algorithm-level test only covers DebtSimplifier in
	// isolation, never the real balances it's actually fed in production.
	// ============================================================

	@Test
	void multiExpenseGroupSimplifiesDebtsCorrectlyEndToEnd() {
		Long userA = createUser("Parker", "parker@example.com").id();
		Long userB = createUser("Quincy", "quincy@example.com").id();
		Long userC = createUser("Riley", "riley@example.com").id();
		Long userD = createUser("Sage", "sage@example.com").id();

		Long groupId = createGroup("Complex Group", userA).id();
		addMember(groupId, userB);
		addMember(groupId, userC);
		addMember(groupId, userD);

		// A fronts 4000 split equally among all four
		postExpense(groupId, new CreateExpenseRequest(userA, "Big dinner", 4000L, "INR", SplitType.EQUAL,
				List.of(new SplitParticipantRequest(userA, null, null, null),
						new SplitParticipantRequest(userB, null, null, null),
						new SplitParticipantRequest(userC, null, null, null),
						new SplitParticipantRequest(userD, null, null, null)),
				userA));

		// B fronts 900 split equally between just B and C
		postExpense(groupId, new CreateExpenseRequest(userB, "Cab", 900L, "INR", SplitType.EQUAL,
				List.of(new SplitParticipantRequest(userB, null, null, null),
						new SplitParticipantRequest(userC, null, null, null)),
				userB));

		// D fronts 300 split equally between just D and A
		postExpense(groupId, new CreateExpenseRequest(userD, "Snacks", 300L, "INR", SplitType.EQUAL,
				List.of(new SplitParticipantRequest(userD, null, null, null),
						new SplitParticipantRequest(userA, null, null, null)),
				userD));

		BalanceResponse[] balances = restTestClient.get().uri("/groups/{groupId}/balances", groupId)
				.exchange().expectStatus().isOk().expectBody(BalanceResponse[].class)
				.returnResult().getResponseBody();
		Map<Long, Long> balanceByUser = Arrays.stream(balances)
				.collect(Collectors.toMap(BalanceResponse::userId, BalanceResponse::netBalance));

		assertThat(balanceByUser.get(userA)).isEqualTo(2850L);
		assertThat(balanceByUser.get(userB)).isEqualTo(-550L);
		assertThat(balanceByUser.get(userC)).isEqualTo(-1450L);
		assertThat(balanceByUser.get(userD)).isEqualTo(-850L);

		SettlementSuggestionResponse[] suggestions = restTestClient.get()
				.uri("/groups/{groupId}/settlements/suggestions", groupId)
				.exchange().expectStatus().isOk().expectBody(SettlementSuggestionResponse[].class)
				.returnResult().getResponseBody();

		// at most n-1 transactions for 4 participants
		assertThat(suggestions.length).isLessThanOrEqualTo(3);

		Map<Long, Long> replayed = new HashMap<>();
		balanceByUser.keySet().forEach(id -> replayed.put(id, 0L));
		for (SettlementSuggestionResponse s : suggestions) {
			replayed.merge(s.fromUserId(), -s.amount(), Long::sum);
			replayed.merge(s.toUserId(), s.amount(), Long::sum);
		}
		assertThat(replayed).isEqualTo(balanceByUser);
	}

	private static Map<Long, Long> shareByUser(ExpenseResponse expense) {
		return expense.splits().stream()
				.collect(Collectors.toMap(ExpenseSplitResponse::userId, ExpenseSplitResponse::shareAmount));
	}

	private ExpenseResponse postExpense(Long groupId, CreateExpenseRequest request) {
		return restTestClient.post().uri("/groups/{groupId}/expenses", groupId)
				.body(request)
				.exchange()
				.expectStatus().isCreated()
				.expectBody(ExpenseResponse.class)
				.returnResult()
				.getResponseBody();
	}

	private GroupResponse createGroup(String name, Long ownerId) {
		return restTestClient.post().uri("/groups")
				.body(new CreateGroupRequest(name, ownerId))
				.exchange()
				.expectStatus().isCreated()
				.expectBody(GroupResponse.class)
				.returnResult()
				.getResponseBody();
	}

	private void addMember(Long groupId, Long userId) {
		restTestClient.post().uri("/groups/{groupId}/members", groupId)
				.body(new AddGroupMemberRequest(userId))
				.exchange()
				.expectStatus().isCreated();
	}

	private UserResponse createUser(String name, String email) {
		return restTestClient.post().uri("/users")
				.body(new CreateUserRequest(name, email, "supersecret1"))
				.exchange()
				.expectStatus().isCreated()
				.expectBody(UserResponse.class)
				.returnResult()
				.getResponseBody();
	}
}
