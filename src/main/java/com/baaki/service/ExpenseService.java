package com.baaki.service;

import com.baaki.entity.Expense;
import com.baaki.entity.Group;
import com.baaki.entity.SplitType;
import com.baaki.entity.User;
import com.baaki.exception.BusinessRuleViolationException;
import com.baaki.exception.ResourceNotFoundException;
import com.baaki.repository.ExpenseRepository;
import com.baaki.repository.GroupMemberRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpenseService {

	private final ExpenseRepository expenseRepository;
	private final GroupMemberRepository groupMemberRepository;
	private final GroupService groupService;
	private final UserService userService;

	public ExpenseService(ExpenseRepository expenseRepository, GroupMemberRepository groupMemberRepository,
			GroupService groupService, UserService userService) {
		this.expenseRepository = expenseRepository;
		this.groupMemberRepository = groupMemberRepository;
		this.groupService = groupService;
		this.userService = userService;
	}

	/**
	 * Persists the raw ledger row only. Per-user expense_splits rows and the
	 * "sum(splits) == totalAmount" invariant are Week 2 work (§5.1) - not
	 * implemented here yet.
	 */
	@Transactional
	public Expense createExpense(Long groupId, Long paidByUserId, String description, long totalAmount,
			String currency, SplitType splitType, Long createdByUserId) {
		Group group = groupService.getGroup(groupId);
		User paidBy = requireGroupMember(groupId, paidByUserId);
		User createdBy = userService.getUser(createdByUserId);

		Expense expense = new Expense(group, paidBy, description, totalAmount, currency, splitType, createdBy);
		return expenseRepository.save(expense);
	}

	@Transactional(readOnly = true)
	public Page<Expense> listExpenses(Long groupId, Pageable pageable) {
		groupService.getGroup(groupId); // 404 if the group itself doesn't exist
		return expenseRepository.findByGroup_IdAndDeletedFalse(groupId, pageable);
	}

	@Transactional(readOnly = true)
	public Expense getExpense(Long groupId, Long expenseId) {
		return expenseRepository.findByIdAndGroup_Id(expenseId, groupId)
				.orElseThrow(() -> new ResourceNotFoundException(
						"Expense " + expenseId + " not found in group " + groupId));
	}

	/**
	 * Soft-delete only - see CLAUDE.md: expenses are append-only, never
	 * hard-deleted. There is no update endpoint on top of this entity at all.
	 */
	@Transactional
	public void deleteExpense(Long groupId, Long expenseId) {
		Expense expense = getExpense(groupId, expenseId);
		expense.softDelete();
	}

	private User requireGroupMember(Long groupId, Long userId) {
		User user = userService.getUser(userId);
		if (!groupMemberRepository.existsByGroup_IdAndUser_Id(groupId, userId)) {
			throw new BusinessRuleViolationException("User " + userId + " is not a member of group " + groupId);
		}
		return user;
	}
}
