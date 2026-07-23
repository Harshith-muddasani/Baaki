package com.baaki.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "group_members")
public class GroupMember {

	@EmbeddedId
	private GroupMemberId id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@MapsId("groupId")
	@JoinColumn(name = "group_id", nullable = false)
	private Group group;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@MapsId("userId")
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "joined_at", nullable = false, updatable = false)
	private OffsetDateTime joinedAt;

	protected GroupMember() {
		// JPA
	}

	public GroupMember(Group group, User user) {
		this.group = group;
		this.user = user;
		this.id = new GroupMemberId(group.getId(), user.getId());
		this.joinedAt = OffsetDateTime.now();
	}

	public GroupMemberId getId() {
		return id;
	}

	public Group getGroup() {
		return group;
	}

	public User getUser() {
		return user;
	}

	public OffsetDateTime getJoinedAt() {
		return joinedAt;
	}
}
