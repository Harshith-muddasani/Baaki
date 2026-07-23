package com.baaki.repository;

import com.baaki.entity.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

	Page<Expense> findByGroup_IdAndDeletedFalse(Long groupId, Pageable pageable);

	Optional<Expense> findByIdAndGroup_Id(Long id, Long groupId);
}
