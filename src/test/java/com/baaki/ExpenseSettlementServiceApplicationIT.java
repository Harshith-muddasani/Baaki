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
import com.baaki.dto.settlement.SettlementSuggestionResponse;
import com.baaki.dto.user.CreateUserRequest;
import com.baaki.dto.user.UserResponse;
import com.baaki.entity.SplitType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

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
