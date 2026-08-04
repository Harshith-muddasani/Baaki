package com.baaki.service;

import com.baaki.entity.BalanceCache;
import com.baaki.repository.BalanceCacheRepository;
import com.baaki.repository.BalanceRepository;
import com.baaki.repository.UserBalanceProjection;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BalanceService {

	private final BalanceRepository balanceRepository;
	private final BalanceCacheRepository balanceCacheRepository;
	private final BalanceCacheService balanceCacheService;
	private final GroupMemberService groupMemberService;
	private final GroupService groupService;

	public BalanceService(BalanceRepository balanceRepository, BalanceCacheRepository balanceCacheRepository,
			BalanceCacheService balanceCacheService, GroupMemberService groupMemberService,
			GroupService groupService) {
		this.balanceRepository = balanceRepository;
		this.balanceCacheRepository = balanceCacheRepository;
		this.balanceCacheService = balanceCacheService;
		this.groupMemberService = groupMemberService;
		this.groupService = groupService;
	}

	/**
	 * Cache-first read. balance_cache is kept synchronously fresh by
	 * BalanceCacheService's AFTER_COMMIT listener - by the time any read
	 * happens here, every member touched by a prior write already has a
	 * current cache row. The one completeness check that matters is size:
	 * cached.size() == current member count. That's exactly true whenever
	 * the cache reflects the current membership, and exactly false in the
	 * two cases where it can't be trusted:
	 *   - a brand-new group with no expense/settlement ever recorded (no
	 *     write event has ever fired, so no cache rows exist at all)
	 *   - a member added since the last write (computeBalances always
	 *     returns every current group_members row, so writeOnce always
	 *     upserts ALL members together - a newly-added member simply has no
	 *     row yet until the next write)
	 * Either way, falling through to a live compute-and-warm is correct.
	 * removeMember (GroupMemberService) deletes the corresponding cache row
	 * on membership removal so this check stays reliable in that direction
	 * too, instead of leaving a stale row that would keep forcing a miss.
	 */
	@Transactional(readOnly = true)
	public List<UserBalanceProjection> getBalances(Long groupId) {
		groupService.getGroup(groupId); // 404 if the group itself doesn't exist
		int memberCount = groupMemberService.listMembers(groupId).size();

		List<BalanceCache> cached = balanceCacheRepository.findByGroupIdWithUser(groupId);
		if (!cached.isEmpty() && cached.size() == memberCount) {
			return cached.stream()
					.sorted((a, b) -> Long.compare(a.getUser().getId(), b.getUser().getId()))
					.<UserBalanceProjection>map(BalanceCacheProjection::new)
					.toList();
		}

		List<UserBalanceProjection> live = balanceRepository.computeBalances(groupId);
		balanceCacheService.refreshCache(groupId);
		return live;
	}

	private record BalanceCacheProjection(BalanceCache cache) implements UserBalanceProjection {
		@Override
		public Long getUserId() {
			return cache.getUser().getId();
		}

		@Override
		public String getUserName() {
			return cache.getUser().getName();
		}

		@Override
		public Long getNetBalance() {
			return cache.getNetBalance();
		}
	}
}
