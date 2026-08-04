package com.baaki.service;

import com.baaki.entity.BalanceCacheId;
import com.baaki.entity.Group;
import com.baaki.entity.GroupMember;
import com.baaki.entity.GroupMemberId;
import com.baaki.entity.User;
import com.baaki.exception.BusinessRuleViolationException;
import com.baaki.exception.DuplicateResourceException;
import com.baaki.exception.ResourceNotFoundException;
import com.baaki.repository.BalanceCacheRepository;
import com.baaki.repository.GroupMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GroupMemberService {

	private final GroupMemberRepository groupMemberRepository;
	private final BalanceCacheRepository balanceCacheRepository;
	private final GroupService groupService;
	private final UserService userService;

	public GroupMemberService(GroupMemberRepository groupMemberRepository, BalanceCacheRepository balanceCacheRepository,
			GroupService groupService, UserService userService) {
		this.groupMemberRepository = groupMemberRepository;
		this.balanceCacheRepository = balanceCacheRepository;
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
		// Keep balance_cache's row count in sync with real membership - otherwise
		// a leftover row for a removed member would permanently mismatch
		// BalanceService's cache-completeness check and force every future read
		// onto the live-compute fallback for this group.
		balanceCacheRepository.deleteById(new BalanceCacheId(groupId, userId));
	}

	/** Shared by ExpenseService and SettlementService - both need "is this user actually in the group". */
	@Transactional(readOnly = true)
	public User requireGroupMember(Long groupId, Long userId) {
		User user = userService.getUser(userId);
		if (!groupMemberRepository.existsByGroup_IdAndUser_Id(groupId, userId)) {
			throw new BusinessRuleViolationException("User " + userId + " is not a member of group " + groupId);
		}
		return user;
	}
}
