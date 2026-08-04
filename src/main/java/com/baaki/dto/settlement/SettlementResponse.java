package com.baaki.dto.settlement;

import com.baaki.entity.Settlement;
import com.baaki.entity.SettlementStatus;

import java.time.OffsetDateTime;

public record SettlementResponse(
		Long id,
		Long groupId,
		Long paidByUserId,
		Long paidToUserId,
		long amount,
		SettlementStatus status,
		OffsetDateTime createdAt
) {

	public static SettlementResponse from(Settlement settlement) {
		return new SettlementResponse(
				settlement.getId(),
				settlement.getGroup().getId(),
				settlement.getPaidBy().getId(),
				settlement.getPaidTo().getId(),
				settlement.getAmount(),
				settlement.getStatus(),
				settlement.getCreatedAt());
	}
}
