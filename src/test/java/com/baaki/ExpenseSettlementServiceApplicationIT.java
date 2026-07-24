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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/**
 * End-to-end happy path against a real Postgres (no H2) - create a user,
 * create a group (creator is auto-added as a member), add a second member.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class ExpenseSettlementServiceApplicationIT {

	@Container
	@ServiceConnection
	static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18-alpine");

	@LocalServerPort
	private int port;

	@Autowired
	private BalanceCacheRepository balanceCacheRepository;

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
