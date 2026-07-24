package com.baaki.dto.expense;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * One participant in an expense's split. Which of amount/percentage/shares is
 * required depends on the expense's splitType (EQUAL needs none of them) -
 * that's a cross-field rule ExpenseService validates, not Bean Validation.
 */
public record SplitParticipantRequest(
		@NotNull(message = "userId is required")
		Long userId,

		Long amount,
		BigDecimal percentage,
		Long shares
) {
}
