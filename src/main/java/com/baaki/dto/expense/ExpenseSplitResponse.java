package com.baaki.dto.expense;

import com.baaki.entity.ExpenseSplit;

public record ExpenseSplitResponse(
		Long userId,
		String userName,
		long shareAmount
) {

	public static ExpenseSplitResponse from(ExpenseSplit split) {
		return new ExpenseSplitResponse(split.getUser().getId(), split.getUser().getName(), split.getShareAmount());
	}
}
