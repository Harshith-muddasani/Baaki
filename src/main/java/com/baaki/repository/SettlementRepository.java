package com.baaki.repository;

import com.baaki.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

	Optional<Settlement> findByIdempotencyKey(UUID idempotencyKey);
}
