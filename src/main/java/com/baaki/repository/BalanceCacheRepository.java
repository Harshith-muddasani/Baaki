package com.baaki.repository;

import com.baaki.entity.BalanceCache;
import com.baaki.entity.BalanceCacheId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BalanceCacheRepository extends JpaRepository<BalanceCache, BalanceCacheId> {
}
