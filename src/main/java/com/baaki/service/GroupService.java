package com.baaki.service;

import com.baaki.entity.Group;
import com.baaki.entity.GroupMember;
import com.baaki.entity.User;
import com.baaki.exception.ResourceNotFoundException;
import com.baaki.repository.GroupMemberRepository;
import com.baaki.repository.GroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GroupService {

	private final GroupRepository groupRepository;
	private final GroupMemberRepository groupMemberRepository;
	private final UserService userService;

	public GroupService(GroupRepository groupRepository, GroupMemberRepository groupMemberRepository,
			UserService userService) {
		this.groupRepository = groupRepository;
		this.groupMemberRepository = groupMemberRepository;
		this.userService = userService;
	}

	@Transactional
	public Group createGroup(String name, Long createdByUserId) {
		User createdBy = userService.getUser(createdByUserId);
		Group group = new Group(name, createdBy);
		group = groupRepository.save(group);
		// creator is automatically a member of their own group
		groupMemberRepository.save(new GroupMember(group, createdBy));
		return group;
	}

	@Transactional(readOnly = true)
	public Group getGroup(Long id) {
		return groupRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Group not found: " + id));
	}

	@Transactional(readOnly = true)
	public List<Group> listGroups() {
		return groupRepository.findAll();
	}

	@Transactional
	public Group updateGroup(Long id, String name) {
		Group group = getGroup(id);
		group.setName(name);
		return group;
	}

	@Transactional
	public void deleteGroup(Long id) {
		if (!groupRepository.existsById(id)) {
			throw new ResourceNotFoundException("Group not found: " + id);
		}
		groupRepository.deleteById(id);
	}
}
