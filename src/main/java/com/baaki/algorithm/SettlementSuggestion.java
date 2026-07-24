package com.baaki.algorithm;

/**
 * A suggested (not yet recorded) repayment from the greedy debt-simplification
 * algorithm. Distinct from the {@code settlements} table/entity - that's an
 * actual recorded repayment (Week 4); this is just a computed recommendation.
 */
public record SettlementSuggestion(Long fromUserId, Long toUserId, long amount) {
}
