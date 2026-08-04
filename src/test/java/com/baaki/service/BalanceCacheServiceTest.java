package com.baaki.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * BalanceCacheWriter itself needs a real database (it's a JPA writer), so
 * that's covered by an integration test. This tests the retry LOOP in
 * isolation: does refreshCache retry on optimistic-lock conflicts, and give
 * up after exhausting attempts.
 */
@ExtendWith(MockitoExtension.class)
class BalanceCacheServiceTest {

	@Mock
	private BalanceCacheWriter balanceCacheWriter;

	@Test
	void refreshCache_succeedsImmediatelyWithNoConflict() {
		BalanceCacheService service = new BalanceCacheService(balanceCacheWriter);
		doNothing().when(balanceCacheWriter).writeOnce(1L);

		service.refreshCache(1L);

		verify(balanceCacheWriter, times(1)).writeOnce(1L);
	}

	@Test
	void refreshCache_retriesOnConflictThenSucceeds() {
		BalanceCacheService service = new BalanceCacheService(balanceCacheWriter);
		doThrow(new ObjectOptimisticLockingFailureException(Object.class, "1"))
				.doThrow(new ObjectOptimisticLockingFailureException(Object.class, "1"))
				.doNothing()
				.when(balanceCacheWriter).writeOnce(1L);

		service.refreshCache(1L);

		verify(balanceCacheWriter, times(3)).writeOnce(1L);
	}

	@Test
	void refreshCache_givesUpAfterMaxAttempts() {
		BalanceCacheService service = new BalanceCacheService(balanceCacheWriter);
		doThrow(new ObjectOptimisticLockingFailureException(Object.class, "1"))
				.when(balanceCacheWriter).writeOnce(1L);

		assertThatThrownBy(() -> service.refreshCache(1L))
				.isInstanceOf(ObjectOptimisticLockingFailureException.class);

		verify(balanceCacheWriter, times(3)).writeOnce(1L);
	}
}
