package com.baaki.algorithm;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

/**
 * Greedy two-heap debt simplification (spec Section 5.3). Minimizing the
 * exact number of settle-up transactions is NP-hard in general (it's a
 * set-partition-style problem); this greedy approximation is what real
 * Splitwise does, is O(n log n), and always produces at most n-1
 * transactions for n participants since every step fully zeroes out at
 * least one side.
 */
public final class DebtSimplifier {

	private DebtSimplifier() {
	}

	public static List<SettlementSuggestion> simplify(Map<Long, Long> netBalances) {
		PriorityQueue<Balance> creditors = new PriorityQueue<>(Comparator.comparingLong(Balance::amount).reversed());
		PriorityQueue<Balance> debtors = new PriorityQueue<>(Comparator.comparingLong(Balance::amount).reversed());

		netBalances.forEach((userId, balance) -> {
			if (balance > 0) creditors.add(new Balance(userId, balance));
			else if (balance < 0) debtors.add(new Balance(userId, -balance));
		});

		List<SettlementSuggestion> result = new ArrayList<>();
		while (!creditors.isEmpty() && !debtors.isEmpty()) {
			Balance creditor = creditors.poll();
			Balance debtor = debtors.poll();
			long settled = Math.min(creditor.amount(), debtor.amount());

			result.add(new SettlementSuggestion(debtor.userId(), creditor.userId(), settled));

			if (creditor.amount() > settled) {
				creditors.add(new Balance(creditor.userId(), creditor.amount() - settled));
			}
			if (debtor.amount() > settled) {
				debtors.add(new Balance(debtor.userId(), debtor.amount() - settled));
			}
		}
		return result;
	}

	private record Balance(Long userId, long amount) {
	}
}
