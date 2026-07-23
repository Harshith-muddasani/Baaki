package com.baaki.dto.expense;

import com.baaki.entity.SplitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * No split-related fields yet (per-user shares, etc) - split calculation is
 * Week 2 (§5.1). This only captures the raw ledger row; expense_splits rows
 * are not written by this endpoint yet.
 */
public record CreateExpenseRequest(
		@NotNull(message = "paidByUserId is required")
		Long paidByUserId,

		@NotBlank(message = "description is required")
		@Size(max = 255)
		String description,

		@NotNull(message = "totalAmount is required")
		@Positive(message = "totalAmount must be a positive number of minor units (paise)")
		Long totalAmount,

		@NotBlank(message = "currency is required")
		@Pattern(regexp = "[A-Z]{3}", message = "currency must be a 3-letter ISO 4217 code")
		String currency,

		@NotNull(message = "splitType is required")
		SplitType splitType,

		@NotNull(message = "createdByUserId is required")
		Long createdByUserId
) {
}
