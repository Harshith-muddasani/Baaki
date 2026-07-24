package com.baaki.algorithm;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DebtSimplifierTest {

	private static final Long A = 1L;
	private static final Long B = 2L;
	private static final Long C = 3L;
	private static final Long D = 4L;

	@Test
	void cycleOfDebt_nettedToZero_collapsesToNoTransactions() {
		// A owes B 100, B owes C 100, C owes A 100 -> everyone's net balance is 0
		Map<Long, Long> netBalances = Map.of(A, 0L, B, 0L, C, 0L);

		List<SettlementSuggestion> suggestions = DebtSimplifier.simplify(netBalances);

		assertThat(suggestions).isEmpty();
	}

	@Test
	void singleMegaDebtor_paysEachCreditorDirectly() {
		// A owes everyone: B 50, C 30, D 20
		Map<Long, Long> netBalances = Map.of(A, -100L, B, 50L, C, 30L, D, 20L);

		List<SettlementSuggestion> suggestions = DebtSimplifier.simplify(netBalances);

		assertThat(suggestions).hasSize(3);
		assertThat(suggestions).allMatch(s -> s.fromUserId().equals(A));
		assertNetsToOriginalBalances(suggestions, netBalances);
	}

	@Test
	void everyoneOwesEveryoneRoughlyEqually_staysWithinTransactionBound() {
		Map<Long, Long> netBalances = Map.of(A, 30L, B, 10L, C, -15L, D, -25L);

		List<SettlementSuggestion> suggestions = DebtSimplifier.simplify(netBalances);

		// at most n-1 transactions for n participants with non-zero balance
		assertThat(suggestions.size()).isLessThanOrEqualTo(3);
		assertNetsToOriginalBalances(suggestions, netBalances);
	}

	@Test
	void allZeroBalances_producesNoTransactions() {
		Map<Long, Long> netBalances = Map.of(A, 0L, B, 0L, C, 0L);

		assertThat(DebtSimplifier.simplify(netBalances)).isEmpty();
	}

	@Test
	void singleCreditorSingleDebtor_oneTransaction() {
		Map<Long, Long> netBalances = Map.of(A, -50L, B, 50L);

		List<SettlementSuggestion> suggestions = DebtSimplifier.simplify(netBalances);

		assertThat(suggestions).containsExactly(new SettlementSuggestion(A, B, 50L));
	}

	private static void assertNetsToOriginalBalances(List<SettlementSuggestion> suggestions,
			Map<Long, Long> expectedNetBalances) {
		Map<Long, Long> replayed = new HashMap<>();
		expectedNetBalances.keySet().forEach(userId -> replayed.put(userId, 0L));

		for (SettlementSuggestion s : suggestions) {
			replayed.merge(s.fromUserId(), -s.amount(), Long::sum);
			replayed.merge(s.toUserId(), s.amount(), Long::sum);
		}

		assertThat(replayed).isEqualTo(expectedNetBalances);
	}
}
