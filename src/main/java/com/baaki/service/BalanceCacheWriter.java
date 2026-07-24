package com.baaki.service;

import com.baaki.entity.BalanceCache;
import com.baaki.entity.BalanceCacheId;
import com.baaki.entity.Group;
import com.baaki.entity.User;
import com.baaki.repository.BalanceCacheRepository;
import com.baaki.repository.BalanceRepository;
import com.baaki.repository.GroupRepository;
import com.baaki.repository.UserBalanceProjection;
import com.baaki.repository.UserRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * One attempt at recomputing and upserting balance_cache rows for a group, in
 * its own transaction. Package-private and separate from BalanceCacheService
 * on purpose: the retry loop needs to call this fresh (a new transaction) on
 * each attempt, which only works by going through the Spring proxy of a
 * DIFFERENT bean - calling a method on {@code this} would bypass the proxy
 * and silently skip @Transactional entirely.
 */
@Component
class BalanceCacheWriter {

	private final BalanceCacheRepository balanceCacheRepository;
	private final BalanceRepository balanceRepository;
	private final GroupRepository groupRepository;
	private final UserRepository userRepository;

	BalanceCacheWriter(BalanceCacheRepository balanceCacheRepository, BalanceRepository balanceRepository,
			GroupRepository groupRepository, UserRepository userRepository) {
		this.balanceCacheRepository = balanceCacheRepository;
		this.balanceRepository = balanceRepository;
		this.groupRepository = groupRepository;
		this.userRepository = userRepository;
	}

	@Transactional
	void writeOnce(Long groupId) {
		List<UserBalanceProjection> liveBalances = balanceRepository.computeBalances(groupId);
		Group groupRef = groupRepository.getReferenceById(groupId);

		for (UserBalanceProjection projection : liveBalances) {
			var cacheId = new BalanceCacheId(groupId, projection.getUserId());
			BalanceCache cache = balanceCacheRepository.findById(cacheId).orElse(null);
			if (cache == null) {
				User userRef = userRepository.getReferenceById(projection.getUserId());
				balanceCacheRepository.save(new BalanceCache(groupRef, userRef, projection.getNetBalance()));
			} else {
				cache.updateBalance(projection.getNetBalance());
				// dirty-checked at flush; @Version on BalanceCache makes this
				// UPDATE conditional on the version still matching.
			}
		}
	}
}
