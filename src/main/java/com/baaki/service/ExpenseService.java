package com.baaki.service;

import com.baaki.algorithm.Split;
import com.baaki.algorithm.SplitCalculator;
import com.baaki.entity.Expense;
import com.baaki.entity.ExpenseSplit;
import com.baaki.entity.Group;
import com.baaki.entity.SplitType;
import com.baaki.entity.User;
import com.baaki.exception.BusinessRuleViolationException;
import com.baaki.exception.ResourceNotFoundException;
import com.baaki.repository.ExpenseRepository;
import com.baaki.repository.ExpenseSplitRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
public class ExpenseService {

	private final ExpenseRepository expenseRepository;
	private final ExpenseSplitRepository expenseSplitRepository;
	private final GroupMemberService groupMemberService;
	private final GroupService groupService;
	private final UserService userService;
	private final ApplicationEventPublisher eventPublisher;

	public ExpenseService(ExpenseRepository expenseRepository, ExpenseSplitRepository expenseSplitRepository,
			GroupMemberService groupMemberService, GroupService groupService, UserService userService,
			ApplicationEventPublisher eventPublisher) {
		this.expenseRepository = expenseRepository;
		this.expenseSplitRepository = expenseSplitRepository;
		this.groupMemberService = groupMemberService;
		this.groupService = groupService;
		this.userService = userService;
		this.eventPublisher = eventPublisher;
	}

	/**
	 * Computes splits via {@link SplitCalculator} and persists the expense and
	 * its expense_splits rows together - sum(splits) == totalAmount is
	 * guaranteed by the calculator, not re-derived here.
	 */
	@Transactional
	public Expense createExpense(Long groupId, Long paidByUserId, String description, long totalAmount,
			String currency, SplitType splitType, List<ExpenseParticipant> participants, Long createdByUserId) {
		Group group = groupService.getGroup(groupId);
		User paidBy = groupMemberService.requireGroupMember(groupId, paidByUserId);
		User createdBy = userService.getUser(createdByUserId);

		Map<Long, User> participantsById = new LinkedHashMap<>();
		for (ExpenseParticipant participant : participants) {
			participantsById.put(participant.userId(),
					groupMemberService.requireGroupMember(groupId, participant.userId()));
		}

		List<Split> splits = calculateSplits(splitType, totalAmount, participants);

		Expense expense = expenseRepository.save(
				new Expense(group, paidBy, description, totalAmount, currency, splitType, createdBy));

		List<ExpenseSplit> expenseSplits = splits.stream()
				.map(split -> new ExpenseSplit(expense, participantsById.get(split.userId()), split.amount()))
				.toList();
		expenseSplitRepository.saveAll(expenseSplits);

		eventPublisher.publishEvent(new GroupActivityChangedEvent(groupId));
		return expense;
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

	@Transactional(readOnly = true)
	public List<ExpenseSplit> getSplitsForExpense(Long expenseId) {
		return expenseSplitRepository.findByExpense_Id(expenseId);
	}

	/**
	 * Soft-delete only - see CLAUDE.md: expenses are append-only, never
	 * hard-deleted. There is no update endpoint on top of this entity at all.
	 */
	@Transactional
	public void deleteExpense(Long groupId, Long expenseId) {
		Expense expense = getExpense(groupId, expenseId);
		expense.softDelete();
		eventPublisher.publishEvent(new GroupActivityChangedEvent(groupId));
	}

	private List<Split> calculateSplits(SplitType splitType, long totalAmount, List<ExpenseParticipant> participants) {
		return switch (splitType) {
			case EQUAL -> SplitCalculator.splitEqually(totalAmount,
					participants.stream().map(ExpenseParticipant::userId).toList());
			case EXACT -> SplitCalculator.splitExact(totalAmount,
					toMap(participants, ExpenseParticipant::amount, "amount"));
			case PERCENTAGE -> SplitCalculator.splitByPercentage(totalAmount,
					toMap(participants, ExpenseParticipant::percentage, "percentage"));
			case SHARES -> SplitCalculator.splitByShares(totalAmount,
					toMap(participants, ExpenseParticipant::shares, "shares"));
		};
	}

	private static <T> Map<Long, T> toMap(List<ExpenseParticipant> participants,
			Function<ExpenseParticipant, T> extractor, String fieldName) {
		Map<Long, T> map = new LinkedHashMap<>();
		for (ExpenseParticipant participant : participants) {
			T value = extractor.apply(participant);
			if (value == null) {
				throw new BusinessRuleViolationException(
						fieldName + " is required for user " + participant.userId() + " with this splitType");
			}
			map.put(participant.userId(), value);
		}
		return map;
	}
}
