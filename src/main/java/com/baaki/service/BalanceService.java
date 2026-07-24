package com.baaki.service;

import com.baaki.repository.BalanceRepository;
import com.baaki.repository.UserBalanceProjection;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BalanceService {

	private final BalanceRepository balanceRepository;
	private final GroupService groupService;

	public BalanceService(BalanceRepository balanceRepository, GroupService groupService) {
		this.balanceRepository = balanceRepository;
		this.groupService = groupService;
	}

	@Transactional(readOnly = true)
	public List<UserBalanceProjection> getBalances(Long groupId) {
		groupService.getGroup(groupId); // 404 if the group itself doesn't exist
		return balanceRepository.computeBalances(groupId);
	}
}
