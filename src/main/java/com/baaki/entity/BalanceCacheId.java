package com.baaki.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class BalanceCacheId implements Serializable {

	@Column(name = "group_id")
	private Long groupId;

	@Column(name = "user_id")
	private Long userId;

	protected BalanceCacheId() {
		// JPA
	}

	public BalanceCacheId(Long groupId, Long userId) {
		this.groupId = groupId;
		this.userId = userId;
	}

	public Long getGroupId() {
		return groupId;
	}

	public Long getUserId() {
		return userId;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof BalanceCacheId that)) return false;
		return Objects.equals(groupId, that.groupId) && Objects.equals(userId, that.userId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(groupId, userId);
	}
}
