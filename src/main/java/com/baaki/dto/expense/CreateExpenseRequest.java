package com.baaki.dto.expense;

import com.baaki.entity.SplitType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

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

		@NotEmpty(message = "participants must not be empty")
		@Valid
		List<SplitParticipantRequest> participants,

		@NotNull(message = "createdByUserId is required")
		Long createdByUserId
) {
}
