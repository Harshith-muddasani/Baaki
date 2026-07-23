package com.baaki.service;

import com.baaki.entity.Group;
import com.baaki.entity.GroupMember;
import com.baaki.entity.GroupMemberId;
import com.baaki.entity.User;
import com.baaki.exception.DuplicateResourceException;
import com.baaki.exception.ResourceNotFoundException;
import com.baaki.repository.GroupMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GroupMemberService {

	private final GroupMemberRepository groupMemberRepository;
	private final GroupService groupService;
	private final UserService userService;

	public GroupMemberService(GroupMemberRepository groupMemberRepository, GroupService groupService,
			UserService userService) {
		this.groupMemberRepository = groupMemberRepository;
		this.groupService = groupService;
		this.userService = userService;
	}

	@Transactional
	public GroupMember addMember(Long groupId, Long userId) {
		if (groupMemberRepository.existsByGroup_IdAndUser_Id(groupId, userId)) {
			throw new DuplicateResourceException("User " + userId + " is already a member of group " + groupId);
		}
		Group group = groupService.getGroup(groupId);
		User user = userService.getUser(userId);
		return groupMemberRepository.save(new GroupMember(group, user));
	}

	@Transactional(readOnly = true)
	public List<GroupMember> listMembers(Long groupId) {
		groupService.getGroup(groupId); // 404 if the group itself doesn't exist
		return groupMemberRepository.findByGroup_Id(groupId);
	}

	@Transactional
	public void removeMember(Long groupId, Long userId) {
		GroupMemberId id = new GroupMemberId(groupId, userId);
		if (!groupMemberRepository.existsById(id)) {
			throw new ResourceNotFoundException("User " + userId + " is not a member of group " + groupId);
		}
		groupMemberRepository.deleteById(id);
	}
}
