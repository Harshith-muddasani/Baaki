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

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * An actual recorded repayment - append-only, like Expense. The
 * idempotency_key unique constraint (schema Section 3.2) is what makes a
 * retried POST /groups/{id}/settlements safe: see SettlementService.
 */
@Entity
@Table(name = "settlements")
public class Settlement {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "group_id", nullable = false, updatable = false)
	private Group group;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "paid_by", nullable = false, updatable = false)
	private User paidBy;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "paid_to", nullable = false, updatable = false)
	private User paidTo;

	@Column(nullable = false, updatable = false)
	private long amount;

	@Column(name = "idempotency_key", nullable = false, unique = true, updatable = false)
	private UUID idempotencyKey;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20, updatable = false)
	private SettlementStatus status;

	@Column(name = "created_at", nullable = false, updatable = false)
	private OffsetDateTime createdAt;

	protected Settlement() {
		// JPA
	}

	public Settlement(Group group, User paidBy, User paidTo, long amount, UUID idempotencyKey) {
		this.group = group;
		this.paidBy = paidBy;
		this.paidTo = paidTo;
		this.amount = amount;
		this.idempotencyKey = idempotencyKey;
		this.status = SettlementStatus.COMPLETED;
		this.createdAt = OffsetDateTime.now();
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

	public User getPaidTo() {
		return paidTo;
	}

	public long getAmount() {
		return amount;
	}

	public UUID getIdempotencyKey() {
		return idempotencyKey;
	}

	public SettlementStatus getStatus() {
		return status;
	}

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}
}
