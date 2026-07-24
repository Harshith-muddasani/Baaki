package com.baaki.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

/**
 * "User X owes share_amount for expense Y" - computed once at write time by
 * {@link com.baaki.algorithm.SplitCalculator} and never recalculated or
 * mutated afterward. Append-only, like Expense: no setters at all.
 */
@Entity
@Table(name = "expense_splits")
public class ExpenseSplit {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "expense_id", nullable = false, updatable = false)
	private Expense expense;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false, updatable = false)
	private User user;

	@Column(name = "share_amount", nullable = false, updatable = false)
	private long shareAmount;

	@Column(name = "created_at", nullable = false, updatable = false)
	private OffsetDateTime createdAt;

	protected ExpenseSplit() {
		// JPA
	}

	public ExpenseSplit(Expense expense, User user, long shareAmount) {
		this.expense = expense;
		this.user = user;
		this.shareAmount = shareAmount;
		this.createdAt = OffsetDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public Expense getExpense() {
		return expense;
	}

	public User getUser() {
		return user;
	}

	public long getShareAmount() {
		return shareAmount;
	}

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}
}
