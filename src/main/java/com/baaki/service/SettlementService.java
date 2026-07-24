package com.baaki.service;

import com.baaki.entity.Group;
import com.baaki.entity.Settlement;
import com.baaki.entity.User;
import com.baaki.exception.BusinessRuleViolationException;
import com.baaki.exception.ResourceNotFoundException;
import com.baaki.repository.SettlementRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class SettlementService {

	private final SettlementRepository settlementRepository;
	private final GroupService groupService;
	private final GroupMemberService groupMemberService;
	private final ApplicationEventPublisher eventPublisher;

	public SettlementService(SettlementRepository settlementRepository, GroupService groupService,
			GroupMemberService groupMemberService, ApplicationEventPublisher eventPublisher) {
		this.settlementRepository = settlementRepository;
		this.groupService = groupService;
		this.groupMemberService = groupMemberService;
		this.eventPublisher = eventPublisher;
	}

	/**
	 * One attempt at recording a settlement. If two requests race on the same
	 * idempotency key, one of them can still hit the unique constraint on
	 * {@code settlements.idempotency_key} during save() - that's expected and
	 * is the caller's job to catch (see SettlementController): this method
	 * intentionally does NOT catch it itself, so the failed transaction rolls
	 * back cleanly instead of being left half-committed.
	 */
	@Transactional
	public SettlementOutcome createNewSettlement(Long groupId, Long paidByUserId, Long paidToUserId, long amount,
			UUID idempotencyKey) {
		var existing = settlementRepository.findByIdempotencyKey(idempotencyKey);
		if (existing.isPresent()) {
			return new SettlementOutcome(existing.get(), false);
		}

		if (paidByUserId.equals(paidToUserId)) {
			throw new BusinessRuleViolationException("paidByUserId and paidToUserId must be different users");
		}

		Group group = groupService.getGroup(groupId);
		User paidBy = groupMemberService.requireGroupMember(groupId, paidByUserId);
		User paidTo = groupMemberService.requireGroupMember(groupId, paidToUserId);

		Settlement settlement = settlementRepository.save(
				new Settlement(group, paidBy, paidTo, amount, idempotencyKey));

		eventPublisher.publishEvent(new GroupActivityChangedEvent(groupId));
		return new SettlementOutcome(settlement, true);
	}

	/**
	 * Called by the controller in a fresh transaction after catching a
	 * unique-constraint violation from createNewSettlement - the other,
	 * concurrent request won the race and already committed its row.
	 */
	@Transactional(readOnly = true)
	public Settlement getByIdempotencyKeyOrThrow(UUID idempotencyKey) {
		return settlementRepository.findByIdempotencyKey(idempotencyKey)
				.orElseThrow(() -> new ResourceNotFoundException(
						"No settlement found for idempotency key " + idempotencyKey + " after a conflicting write"));
	}
}
