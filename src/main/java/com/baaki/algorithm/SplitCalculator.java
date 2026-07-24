package com.baaki.algorithm;

import com.baaki.exception.BusinessRuleViolationException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.ToLongFunction;

/**
 * Rounding-safe split calculation for the four split types (spec Section 5.1).
 * Every method here returns splits that sum EXACTLY to totalAmount - any
 * leftover minor units from integer division are handed to the first N
 * participants ordered by userId ascending (a stable, reproducible order,
 * never insertion/hash order).
 */
public final class SplitCalculator {

	private SplitCalculator() {
	}

	public static List<Split> splitEqually(long totalAmount, List<Long> userIds) {
		requireNonEmpty(userIds, "userIds");
		int n = userIds.size();
		long baseShare = totalAmount / n;
		long remainder = totalAmount % n;

		List<Long> sortedIds = userIds.stream().sorted().toList();
		List<Split> splits = new ArrayList<>();
		for (int i = 0; i < n; i++) {
			long share = baseShare + (i < remainder ? 1 : 0);
			splits.add(new Split(sortedIds.get(i), share));
		}
		return splits;
	}

	public static List<Split> splitExact(long totalAmount, Map<Long, Long> exactAmounts) {
		requireNonEmpty(exactAmounts.keySet(), "exactAmounts");
		long sum = exactAmounts.values().stream().mapToLong(Long::longValue).sum();
		if (sum != totalAmount) {
			throw new BusinessRuleViolationException(
					"Exact split amounts sum to " + sum + " but totalAmount is " + totalAmount);
		}
		return exactAmounts.keySet().stream()
				.sorted()
				.map(userId -> new Split(userId, exactAmounts.get(userId)))
				.toList();
	}

	public static List<Split> splitByPercentage(long totalAmount, Map<Long, BigDecimal> percentages) {
		requireNonEmpty(percentages.keySet(), "percentages");
		BigDecimal sum = percentages.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
		if (sum.compareTo(BigDecimal.valueOf(100)) != 0) {
			throw new BusinessRuleViolationException("Percentages sum to " + sum + " but must sum to exactly 100");
		}
		List<Long> sortedIds = percentages.keySet().stream().sorted().toList();
		return distributeRemainder(totalAmount, sortedIds, userId -> percentages.get(userId)
				.multiply(BigDecimal.valueOf(totalAmount))
				.divide(BigDecimal.valueOf(100), 0, RoundingMode.FLOOR)
				.longValueExact());
	}

	public static List<Split> splitByShares(long totalAmount, Map<Long, Long> shares) {
		requireNonEmpty(shares.keySet(), "shares");
		long totalShares = shares.values().stream().mapToLong(Long::longValue).sum();
		if (totalShares <= 0) {
			throw new BusinessRuleViolationException("Total shares must be positive, got " + totalShares);
		}
		List<Long> sortedIds = shares.keySet().stream().sorted().toList();
		return distributeRemainder(totalAmount, sortedIds,
				userId -> Math.floorDiv(Math.multiplyExact(totalAmount, shares.get(userId)), totalShares));
	}

	private static List<Split> distributeRemainder(long totalAmount, List<Long> sortedIds,
			ToLongFunction<Long> baseShareFn) {
		long[] baseShares = new long[sortedIds.size()];
		long baseSum = 0;
		for (int i = 0; i < sortedIds.size(); i++) {
			baseShares[i] = baseShareFn.applyAsLong(sortedIds.get(i));
			baseSum += baseShares[i];
		}
		long remainder = totalAmount - baseSum;

		List<Split> splits = new ArrayList<>();
		for (int i = 0; i < sortedIds.size(); i++) {
			long share = baseShares[i] + (i < remainder ? 1 : 0);
			splits.add(new Split(sortedIds.get(i), share));
		}
		return splits;
	}

	private static void requireNonEmpty(java.util.Collection<?> values, String name) {
		if (values.isEmpty()) {
			throw new BusinessRuleViolationException(name + " must not be empty");
		}
	}
}
