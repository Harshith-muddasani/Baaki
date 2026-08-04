package com.baaki.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.OffsetDateTime;

/**
 * Materialized balance cache (schema Section 3.2, optional). Optimistic
 * locking via {@code @Version}: Hibernate includes "WHERE version = ?" on
 * every UPDATE and throws ObjectOptimisticLockingFailureException if another
 * concurrent writer already bumped it - see BalanceCacheService for the
 * retry loop that handles that.
 */
@Entity
@Table(name = "balance_cache")
public class BalanceCache {

	@EmbeddedId
	private BalanceCacheId id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@MapsId("groupId")
	@JoinColumn(name = "group_id", nullable = false)
	private Group group;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@MapsId("userId")
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "net_balance", nullable = false)
	private long netBalance;

	@Version
	@Column(nullable = false)
	private int version;

	@Column(name = "last_computed_at", nullable = false)
	private OffsetDateTime lastComputedAt;

	protected BalanceCache() {
		// JPA
	}

	public BalanceCache(Group group, User user, long netBalance) {
		this.group = group;
		this.user = user;
		this.id = new BalanceCacheId(group.getId(), user.getId());
		this.netBalance = netBalance;
		this.lastComputedAt = OffsetDateTime.now();
	}

	public void updateBalance(long netBalance) {
		this.netBalance = netBalance;
		this.lastComputedAt = OffsetDateTime.now();
	}

	public BalanceCacheId getId() {
		return id;
	}

	public Group getGroup() {
		return group;
	}

	public User getUser() {
		return user;
	}

	public long getNetBalance() {
		return netBalance;
	}

	public int getVersion() {
		return version;
	}

	public OffsetDateTime getLastComputedAt() {
		return lastComputedAt;
	}
}
