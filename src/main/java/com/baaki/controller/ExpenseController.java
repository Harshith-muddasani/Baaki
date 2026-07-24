package com.baaki.controller;

import com.baaki.dto.expense.CreateExpenseRequest;
import com.baaki.dto.expense.ExpenseResponse;
import com.baaki.entity.Expense;
import com.baaki.service.ExpenseParticipant;
import com.baaki.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@RestController
@RequestMapping("/groups/{groupId}/expenses")
public class ExpenseController {

	private final ExpenseService expenseService;

	public ExpenseController(ExpenseService expenseService) {
		this.expenseService = expenseService;
	}

	@PostMapping
	public ResponseEntity<ExpenseResponse> createExpense(@PathVariable Long groupId,
			@Valid @RequestBody CreateExpenseRequest request, UriComponentsBuilder uriBuilder) {
		Expense expense = expenseService.createExpense(groupId, request.paidByUserId(), request.description(),
				request.totalAmount(), request.currency(), request.splitType(), toParticipants(request),
				request.createdByUserId());
		var location = uriBuilder.path("/groups/{groupId}/expenses/{expenseId}")
				.buildAndExpand(groupId, expense.getId()).toUri();
		return ResponseEntity.created(location)
				.body(ExpenseResponse.from(expense, expenseService.getSplitsForExpense(expense.getId())));
	}

	@GetMapping
	public Page<ExpenseResponse> listExpenses(@PathVariable Long groupId, Pageable pageable) {
		return expenseService.listExpenses(groupId, pageable)
				.map(expense -> ExpenseResponse.from(expense, expenseService.getSplitsForExpense(expense.getId())));
	}

	@GetMapping("/{expenseId}")
	public ExpenseResponse getExpense(@PathVariable Long groupId, @PathVariable Long expenseId) {
		Expense expense = expenseService.getExpense(groupId, expenseId);
		return ExpenseResponse.from(expense, expenseService.getSplitsForExpense(expenseId));
	}

	@DeleteMapping("/{expenseId}")
	public ResponseEntity<Void> deleteExpense(@PathVariable Long groupId, @PathVariable Long expenseId) {
		expenseService.deleteExpense(groupId, expenseId);
		return ResponseEntity.noContent().build();
	}

	private static List<ExpenseParticipant> toParticipants(CreateExpenseRequest request) {
		return request.participants().stream()
				.map(p -> new ExpenseParticipant(p.userId(), p.amount(), p.percentage(), p.shares()))
				.toList();
	}
}
