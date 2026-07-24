package com.baaki.controller;

import com.baaki.dto.settlement.SettlementSuggestionResponse;
import com.baaki.service.SettlementSuggestionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/groups/{groupId}/settlements/suggestions")
public class SettlementSuggestionController {

	private final SettlementSuggestionService settlementSuggestionService;

	public SettlementSuggestionController(SettlementSuggestionService settlementSuggestionService) {
		this.settlementSuggestionService = settlementSuggestionService;
	}

	@GetMapping
	public List<SettlementSuggestionResponse> getSuggestions(@PathVariable Long groupId) {
		return settlementSuggestionService.getSuggestions(groupId).stream()
				.map(SettlementSuggestionResponse::from)
				.toList();
	}
}
