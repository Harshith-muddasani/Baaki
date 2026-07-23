package com.baaki;

import com.baaki.dto.group.CreateGroupRequest;
import com.baaki.dto.group.GroupResponse;
import com.baaki.dto.groupmember.AddGroupMemberRequest;
import com.baaki.dto.groupmember.GroupMemberResponse;
import com.baaki.dto.user.CreateUserRequest;
import com.baaki.dto.user.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

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
