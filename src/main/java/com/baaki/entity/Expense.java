package com.baaki.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

/**
 * Ledger row — append-only per CLAUDE.md. Every field below is immutable once
 * persisted except {@code deleted}, which can only move false -> true via
 * {@link #softDelete()}. There is deliberately no setter for anything else and
 * no update endpoint on top of this entity: correcting a mistake means adding
 * a new expense, not mutating history (see spec Section 3.1).
 */
@Entity
@Table(name = "expenses")
public class Expense {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "group_id", nullable = false, updatable = false)
	private Group group;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "paid_by", nullable = false, updatable = false)
	private User paidBy;

	@Column(nullable = false, length = 255)
	private String description;

	// minor units (paise) — never float/double, per CLAUDE.md
	@Column(name = "total_amount", nullable = false, updatable = false)
	private long totalAmount;

	// CHAR(3) in the schema, not VARCHAR - JdbcTypeCode tells Hibernate to
	// expect/generate CHAR so schema validation matches the real column type.
	@JdbcTypeCode(SqlTypes.CHAR)
	@Column(nullable = false, length = 3, updatable = false)
	private String currency;

	@Enumerated(EnumType.STRING)
	@Column(name = "split_type", nullable = false, length = 20, updatable = false)
	private SplitType splitType;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "created_by", nullable = false, updatable = false)
	private User createdBy;

	@Column(name = "created_at", nullable = false, updatable = false)
	private OffsetDateTime createdAt;

	@Column(name = "is_deleted", nullable = false)
	private boolean deleted = false;

	protected Expense() {
		// JPA
	}

	public Expense(Group group, User paidBy, String description, long totalAmount,
			String currency, SplitType splitType, User createdBy) {
		this.group = group;
		this.paidBy = paidBy;
		this.description = description;
		this.totalAmount = totalAmount;
		this.currency = currency;
		this.splitType = splitType;
		this.createdBy = createdBy;
		this.createdAt = OffsetDateTime.now();
	}

	public void softDelete() {
		this.deleted = true;
	}

	public Long getId() {
		return id;
	}

	public Group getGroup() {
		return group;
	}

	public User getPaidBy() {
		return paidBy;
	}

	public String getDescription() {
		return description;
	}

	public long getTotalAmount() {
		return totalAmount;
	}

	public String getCurrency() {
		return currency;
	}

	public SplitType getSplitType() {
		return splitType;
	}

	public User getCreatedBy() {
		return createdBy;
	}

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}

	public boolean isDeleted() {
		return deleted;
	}
}
