package com.baaki.controller;

import com.baaki.dto.group.CreateGroupRequest;
import com.baaki.dto.group.GroupResponse;
import com.baaki.dto.group.UpdateGroupRequest;
import com.baaki.entity.Group;
import com.baaki.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@RestController
@RequestMapping("/groups")
public class GroupController {

	private final GroupService groupService;

	public GroupController(GroupService groupService) {
		this.groupService = groupService;
	}

	@PostMapping
	public ResponseEntity<GroupResponse> createGroup(@Valid @RequestBody CreateGroupRequest request,
			UriComponentsBuilder uriBuilder) {
		Group group = groupService.createGroup(request.name(), request.createdByUserId());
		var location = uriBuilder.path("/groups/{id}").buildAndExpand(group.getId()).toUri();
		return ResponseEntity.created(location).body(GroupResponse.from(group));
	}

	@GetMapping("/{id}")
	public GroupResponse getGroup(@PathVariable Long id) {
		return GroupResponse.from(groupService.getGroup(id));
	}

	@GetMapping
	public List<GroupResponse> listGroups() {
		return groupService.listGroups().stream().map(GroupResponse::from).toList();
	}

	@PutMapping("/{id}")
	public GroupResponse updateGroup(@PathVariable Long id, @Valid @RequestBody UpdateGroupRequest request) {
		return GroupResponse.from(groupService.updateGroup(id, request.name()));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
		groupService.deleteGroup(id);
		return ResponseEntity.noContent().build();
	}
}
