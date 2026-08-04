package com.baaki.controller;

import com.baaki.dto.settlement.CreateSettlementRequest;
import com.baaki.dto.settlement.SettlementResponse;
import com.baaki.entity.Settlement;
import com.baaki.exception.BusinessRuleViolationException;
import com.baaki.service.SettlementOutcome;
import com.baaki.service.SettlementService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.UUID;

@RestController
@RequestMapping("/groups/{groupId}/settlements")
public class SettlementController {

	private static final Logger log = LoggerFactory.getLogger(SettlementController.class);

	private final SettlementService settlementService;

	public SettlementController(SettlementService settlementService) {
		this.settlementService = settlementService;
	}

	@PostMapping
	public ResponseEntity<SettlementResponse> recordSettlement(@PathVariable Long groupId,
			@RequestHeader("Idempotency-Key") String idempotencyKeyHeader,
			@Valid @RequestBody CreateSettlementRequest request, UriComponentsBuilder uriBuilder) {
		UUID idempotencyKey = parseIdempotencyKey(idempotencyKeyHeader);

		Settlement settlement;
		boolean newlyCreated;
		try {
			SettlementOutcome outcome = settlementService.createNewSettlement(groupId, request.paidByUserId(),
					request.paidToUserId(), request.amount(), idempotencyKey);
			settlement = outcome.settlement();
			newlyCreated = outcome.newlyCreated();
		} catch (DataIntegrityViolationException raceOnIdempotencyKey) {
			// Another concurrent request with the same key won the insert race -
			// createNewSettlement's transaction has already rolled back, so this
			// runs in a fresh one.
			settlement = settlementService.getByIdempotencyKeyOrThrow(groupId, idempotencyKey);
			newlyCreated = false;
		}

		var location = uriBuilder.path("/groups/{groupId}/settlements/{id}")
				.buildAndExpand(groupId, settlement.getId()).toUri();
		HttpStatus status = newlyCreated ? HttpStatus.CREATED : HttpStatus.OK;

		if (newlyCreated) {
			log.info("Settlement {} recorded in group {}: user {} paid user {} {} paise",
					settlement.getId(), groupId, request.paidByUserId(), request.paidToUserId(), request.amount());
		} else {
			log.info("Settlement request for group {} replayed idempotency key {} - returning existing settlement {}",
					groupId, idempotencyKey, settlement.getId());
		}

		return ResponseEntity.status(status).location(location).body(SettlementResponse.from(settlement));
	}

	private static UUID parseIdempotencyKey(String header) {
		try {
			return UUID.fromString(header);
		} catch (IllegalArgumentException e) {
			throw new BusinessRuleViolationException("Idempotency-Key header must be a valid UUID");
		}
	}
}
