package com.baaki.service;

import com.baaki.algorithm.DebtSimplifier;
import com.baaki.algorithm.SettlementSuggestion;
import com.baaki.repository.UserBalanceProjection;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SettlementSuggestionService {

	private final BalanceService balanceService;

	public SettlementSuggestionService(BalanceService balanceService) {
		this.balanceService = balanceService;
	}

	@Transactional(readOnly = true)
	public List<SettlementSuggestion> getSuggestions(Long groupId) {
		Map<Long, Long> netBalances = balanceService.getBalances(groupId).stream()
				.collect(Collectors.toMap(UserBalanceProjection::getUserId, UserBalanceProjection::getNetBalance));
		return DebtSimplifier.simplify(netBalances);
	}
}
