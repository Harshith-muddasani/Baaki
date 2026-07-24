package com.baaki.repository;

import com.baaki.entity.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {

	// JOIN FETCH user: same lazy-loading concern as GroupMemberRepository -
	// callers map straight to DTOs with open-in-view disabled.
	@Query("SELECT es FROM ExpenseSplit es JOIN FETCH es.user WHERE es.expense.id = :expenseId")
	List<ExpenseSplit> findByExpense_Id(@Param("expenseId") Long expenseId);
}
