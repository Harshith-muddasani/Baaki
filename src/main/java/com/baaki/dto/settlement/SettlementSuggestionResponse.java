package com.baaki.dto.settlement;

import com.baaki.algorithm.SettlementSuggestion;

public record SettlementSuggestionResponse(Long fromUserId, Long toUserId, long amount) {

	public static SettlementSuggestionResponse from(SettlementSuggestion suggestion) {
		return new SettlementSuggestionResponse(suggestion.fromUserId(), suggestion.toUserId(), suggestion.amount());
	}
}
