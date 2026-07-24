package com.baaki.controller;

import com.baaki.dto.balance.BalanceResponse;
import com.baaki.service.BalanceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/groups/{groupId}/balances")
public class BalanceController {

	private final BalanceService balanceService;

	public BalanceController(BalanceService balanceService) {
		this.balanceService = balanceService;
	}

	@GetMapping
	public List<BalanceResponse> getBalances(@PathVariable Long groupId) {
		return balanceService.getBalances(groupId).stream().map(BalanceResponse::from).toList();
	}
}
