package com.baaki.dto.expense;

import com.baaki.entity.Expense;
import com.baaki.entity.SplitType;

import java.time.OffsetDateTime;

public record ExpenseResponse(
		Long id,
		Long groupId,
		Long paidByUserId,
		String description,
		long totalAmount,
		String currency,
		SplitType splitType,
		Long createdByUserId,
		OffsetDateTime createdAt,
		boolean deleted
) {

	public static ExpenseResponse from(Expense expense) {
		return new ExpenseResponse(
				expense.getId(),
				expense.getGroup().getId(),
				expense.getPaidBy().getId(),
				expense.getDescription(),
				expense.getTotalAmount(),
				expense.getCurrency(),
				expense.getSplitType(),
				expense.getCreatedBy().getId(),
				expense.getCreatedAt(),
				expense.isDeleted());
	}
}
