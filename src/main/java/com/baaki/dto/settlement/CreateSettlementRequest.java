package com.baaki.dto.settlement;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateSettlementRequest(
		@NotNull(message = "paidByUserId is required")
		Long paidByUserId,

		@NotNull(message = "paidToUserId is required")
		Long paidToUserId,

		@NotNull(message = "amount is required")
		@Positive(message = "amount must be a positive number of minor units (paise)")
		Long amount
) {
}
