package com.baaki.algorithm;

import com.baaki.exception.BusinessRuleViolationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SplitCalculatorTest {

	@Test
	void splitEqually_distributesRemainderToLowestUserIdsFirst() {
		// 100 / 3 = 33 remainder 1 -> user 1 (lowest id) absorbs the extra paisa
		List<Split> splits = SplitCalculator.splitEqually(100, List.of(3L, 1L, 2L));

		assertThat(splits).containsExactly(
				new Split(1L, 34L),
				new Split(2L, 33L),
				new Split(3L, 33L));
		assertSumsTo(splits, 100);
	}

	@Test
	void splitEqually_evenlyDivisible_noRemainder() {
		List<Split> splits = SplitCalculator.splitEqually(90, List.of(1L, 2L, 3L));

		assertThat(splits).containsExactly(
				new Split(1L, 30L),
				new Split(2L, 30L),
				new Split(3L, 30L));
	}

	@Test
	void splitEqually_singleUser_getsWholeAmount() {
		List<Split> splits = SplitCalculator.splitEqually(100, List.of(1L));

		assertThat(splits).containsExactly(new Split(1L, 100L));
	}

	@Test
	void splitExact_validAmounts_returnsSortedByUserId() {
		List<Split> splits = SplitCalculator.splitExact(100, Map.of(2L, 40L, 1L, 60L));

		assertThat(splits).containsExactly(new Split(1L, 60L), new Split(2L, 40L));
	}

	@Test
	void splitExact_amountsDontSumToTotal_throws() {
		assertThatThrownBy(() -> SplitCalculator.splitExact(100, Map.of(1L, 40L, 2L, 40L)))
				.isInstanceOf(BusinessRuleViolationException.class)
				.hasMessageContaining("80")
				.hasMessageContaining("100");
	}

	@Test
	void splitByPercentage_thirds_distributesRemainderToLowestUserIdsFirst() {
		Map<Long, BigDecimal> percentages = Map.of(
				1L, new BigDecimal("33.33"),
				2L, new BigDecimal("33.33"),
				3L, new BigDecimal("33.34"));

		List<Split> splits = SplitCalculator.splitByPercentage(100, percentages);

		assertSumsTo(splits, 100);
	}

	@Test
	void splitByPercentage_notSummingTo100_throws() {
		Map<Long, BigDecimal> percentages = Map.of(1L, new BigDecimal("50"), 2L, new BigDecimal("40"));

		assertThatThrownBy(() -> SplitCalculator.splitByPercentage(10000, percentages))
				.isInstanceOf(BusinessRuleViolationException.class)
				.hasMessageContaining("90");
	}

	@Test
	void splitByShares_weighted2to1to1() {
		List<Split> splits = SplitCalculator.splitByShares(100, Map.of(1L, 2L, 2L, 1L, 3L, 1L));

		assertThat(splits).containsExactly(
				new Split(1L, 50L),
				new Split(2L, 25L),
				new Split(3L, 25L));
	}

	@Test
	void splitByShares_zeroTotalShares_throws() {
		assertThatThrownBy(() -> SplitCalculator.splitByShares(100, Map.of(1L, 0L, 2L, 0L)))
				.isInstanceOf(BusinessRuleViolationException.class);
	}

	@ParameterizedTest
	@ValueSource(longs = {1, 2, 7, 100, 101, 9999, 1_000_000_001L})
	void splitEqually_alwaysSumsToTotalAmount(long totalAmount) {
		List<Split> splits = SplitCalculator.splitEqually(totalAmount, List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L));
		assertSumsTo(splits, totalAmount);
	}

	@ParameterizedTest
	@ValueSource(longs = {1, 2, 7, 100, 101, 9999, 1_000_000_001L})
	void splitByShares_alwaysSumsToTotalAmount(long totalAmount) {
		List<Split> splits = SplitCalculator.splitByShares(totalAmount, Map.of(1L, 5L, 2L, 3L, 3L, 2L, 4L, 1L));
		assertSumsTo(splits, totalAmount);
	}

	private static void assertSumsTo(List<Split> splits, long expectedTotal) {
		long sum = splits.stream().mapToLong(Split::amount).sum();
		assertThat(sum).isEqualTo(expectedTotal);
	}
}
