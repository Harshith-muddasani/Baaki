package com.baaki.service;

import com.baaki.entity.BalanceCache;
import com.baaki.entity.Group;
import com.baaki.entity.GroupMember;
import com.baaki.entity.User;
import com.baaki.repository.BalanceCacheRepository;
import com.baaki.repository.BalanceRepository;
import com.baaki.repository.UserBalanceProjection;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * BalanceService is the cache-vs-live decision point: balance_cache is kept
 * synchronously fresh by BalanceCacheService's AFTER_COMMIT listener, but
 * nothing previously ever READ from it - GET /balances always recomputed
 * live. These tests prove the read-through actually uses the cache (not
 * just that it exists), and falls back correctly when it can't be trusted.
 */
@ExtendWith(MockitoExtension.class)
class BalanceServiceTest {

	@Mock
	private BalanceRepository balanceRepository;
	@Mock
	private BalanceCacheRepository balanceCacheRepository;
	@Mock
	private BalanceCacheService balanceCacheService;
	@Mock
	private GroupMemberService groupMemberService;
	@Mock
	private GroupService groupService;

	private BalanceService balanceService;

	@BeforeEach
	void setUp() {
		balanceService = new BalanceService(balanceRepository, balanceCacheRepository, balanceCacheService,
				groupMemberService, groupService);
	}

	@Test
	void cacheCoversEveryCurrentMember_returnsCachedValuesWithoutTouchingTheLiveQuery() {
		Long groupId = 1L;
		List<BalanceCache> cachedRows = List.of(cacheRow(1L, "Alice", 500L), cacheRow(2L, "Bob", -500L));
		when(groupMemberService.listMembers(groupId)).thenReturn(twoMembers());
		when(balanceCacheRepository.findByGroupIdWithUser(groupId)).thenReturn(cachedRows);

		List<UserBalanceProjection> result = balanceService.getBalances(groupId);

		assertThat(result).hasSize(2);
		assertThat(result.get(0).getUserId()).isEqualTo(1L);
		assertThat(result.get(0).getUserName()).isEqualTo("Alice");
		assertThat(result.get(0).getNetBalance()).isEqualTo(500L);
		assertThat(result.get(1).getUserId()).isEqualTo(2L);
		assertThat(result.get(1).getUserName()).isEqualTo("Bob");
		assertThat(result.get(1).getNetBalance()).isEqualTo(-500L);

		verify(balanceRepository, never()).computeBalances(anyLong());
		verify(balanceCacheService, never()).refreshCache(anyLong());
	}

	@Test
	void noCacheRowsYet_fallsBackToLiveComputeAndWarmsTheCache() {
		Long groupId = 2L;
		when(groupMemberService.listMembers(groupId)).thenReturn(twoMembers());
		when(balanceCacheRepository.findByGroupIdWithUser(groupId)).thenReturn(List.of());
		UserBalanceProjection live = liveProjection(1L, "Alice", 0L);
		when(balanceRepository.computeBalances(groupId)).thenReturn(List.of(live));

		List<UserBalanceProjection> result = balanceService.getBalances(groupId);

		assertThat(result).containsExactly(live);
		verify(balanceRepository, times(1)).computeBalances(groupId);
		verify(balanceCacheService, times(1)).refreshCache(groupId);
	}

	@Test
	void cacheMissingARecentlyAddedMember_fallsBackToLiveRatherThanReturningIncompleteData() {
		Long groupId = 3L;
		// three current members, but the cache only has two rows - e.g. a
		// member joined after the last expense/settlement write
		List<BalanceCache> incompleteCache = List.of(cacheRow(1L, "Alice", 100L), cacheRow(2L, "Bob", -100L));
		List<UserBalanceProjection> liveProjections = List.of(
				liveProjection(1L, "Alice", 100L), liveProjection(2L, "Bob", -100L), liveProjection(3L, "Carol", 0L));
		when(groupMemberService.listMembers(groupId)).thenReturn(threeMembers());
		when(balanceCacheRepository.findByGroupIdWithUser(groupId)).thenReturn(incompleteCache);
		when(balanceRepository.computeBalances(groupId)).thenReturn(liveProjections);

		List<UserBalanceProjection> result = balanceService.getBalances(groupId);

		assertThat(result).hasSize(3);
		verify(balanceRepository, times(1)).computeBalances(groupId);
		verify(balanceCacheService, times(1)).refreshCache(groupId);
	}

	private static List<GroupMember> twoMembers() {
		return List.of(mock(GroupMember.class), mock(GroupMember.class));
	}

	private static List<GroupMember> threeMembers() {
		return List.of(mock(GroupMember.class), mock(GroupMember.class), mock(GroupMember.class));
	}

	// getName() is only actually read on the cache-hit path (mapped into the
	// returned projection) - lenient because the fallback-path tests construct
	// these rows too, purely to prove they're ignored, and never touch it.
	private static BalanceCache cacheRow(long userId, String name, long netBalance) {
		Group group = mock(Group.class);
		when(group.getId()).thenReturn(1L);
		User user = mock(User.class);
		when(user.getId()).thenReturn(userId);
		lenient().when(user.getName()).thenReturn(name);
		return new BalanceCache(group, user, netBalance);
	}

	private static UserBalanceProjection liveProjection(long userId, String name, long netBalance) {
		return new UserBalanceProjection() {
			public Long getUserId() {
				return userId;
			}

			public String getUserName() {
				return name;
			}

			public Long getNetBalance() {
				return netBalance;
			}
		};
	}
}
