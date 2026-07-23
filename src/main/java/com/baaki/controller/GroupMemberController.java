package com.baaki.controller;

import com.baaki.dto.groupmember.AddGroupMemberRequest;
import com.baaki.dto.groupmember.GroupMemberResponse;
import com.baaki.entity.GroupMember;
import com.baaki.service.GroupMemberService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@RestController
@RequestMapping("/groups/{groupId}/members")
public class GroupMemberController {

	private final GroupMemberService groupMemberService;

	public GroupMemberController(GroupMemberService groupMemberService) {
		this.groupMemberService = groupMemberService;
	}

	@PostMapping
	public ResponseEntity<GroupMemberResponse> addMember(@PathVariable Long groupId,
			@Valid @RequestBody AddGroupMemberRequest request, UriComponentsBuilder uriBuilder) {
		GroupMember member = groupMemberService.addMember(groupId, request.userId());
		var location = uriBuilder.path("/groups/{groupId}/members/{userId}")
				.buildAndExpand(groupId, request.userId()).toUri();
		return ResponseEntity.created(location).body(GroupMemberResponse.from(member));
	}

	@GetMapping
	public List<GroupMemberResponse> listMembers(@PathVariable Long groupId) {
		return groupMemberService.listMembers(groupId).stream().map(GroupMemberResponse::from).toList();
	}

	@DeleteMapping("/{userId}")
	public ResponseEntity<Void> removeMember(@PathVariable Long groupId, @PathVariable Long userId) {
		groupMemberService.removeMember(groupId, userId);
		return ResponseEntity.noContent().build();
	}
}
