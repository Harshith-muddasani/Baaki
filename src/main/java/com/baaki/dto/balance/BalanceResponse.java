package com.baaki.dto.balance;

import com.baaki.repository.UserBalanceProjection;

/** Positive netBalance = this user is owed money; negative = they owe money. */
public record BalanceResponse(
		Long userId,
		String userName,
		long netBalance
) {

	public static BalanceResponse from(UserBalanceProjection projection) {
		return new BalanceResponse(projection.getUserId(), projection.getUserName(), projection.getNetBalance());
	}
}
