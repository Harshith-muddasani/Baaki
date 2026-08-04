package com.baaki.repository;

import com.baaki.entity.BalanceCache;
import com.baaki.entity.BalanceCacheId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BalanceCacheRepository extends JpaRepository<BalanceCache, BalanceCacheId> {

	// JOIN FETCH user: open-in-view is disabled, and the read path maps
	// straight to a response DTO that needs user.getName() already loaded.
	@Query("SELECT bc FROM BalanceCache bc JOIN FETCH bc.user WHERE bc.id.groupId = :groupId")
	List<BalanceCache> findByGroupIdWithUser(@Param("groupId") Long groupId);
}
