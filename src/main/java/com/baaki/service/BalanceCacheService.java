package com.baaki.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Service
public class BalanceCacheService {

	private static final Logger log = LoggerFactory.getLogger(BalanceCacheService.class);
	private static final int MAX_ATTEMPTS = 3;

	private final BalanceCacheWriter balanceCacheWriter;

	public BalanceCacheService(BalanceCacheWriter balanceCacheWriter) {
		this.balanceCacheWriter = balanceCacheWriter;
	}

	/**
	 * Runs after the expense/settlement transaction that triggered it has
	 * already committed - a cache-refresh failure here must never roll back
	 * the primary write, and reading live balances needs the write visible
	 * first anyway.
	 */
	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void onGroupActivityChanged(GroupActivityChangedEvent event) {
		refreshCache(event.groupId());
	}

	/**
	 * Recomputes and upserts balance_cache for every member of a group.
	 * Optimistic-lock conflicts (concurrent refreshes racing on the same row)
	 * are retried with fresh state rather than surfaced as an error - per
	 * spec Section 6: "recompute and retry".
	 */
	public void refreshCache(Long groupId) {
		for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			try {
				balanceCacheWriter.writeOnce(groupId);
				return;
			} catch (ObjectOptimisticLockingFailureException conflict) {
				if (attempt == MAX_ATTEMPTS) {
					throw conflict;
				}
				log.debug("Optimistic lock conflict refreshing balance_cache for group {} (attempt {}/{}), retrying",
						groupId, attempt, MAX_ATTEMPTS);
			}
		}
	}
}
