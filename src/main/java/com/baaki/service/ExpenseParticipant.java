package com.baaki.service;

import java.math.BigDecimal;

/**
 * Service-layer input for one split participant - decoupled from the web
 * layer's {@code SplitParticipantRequest} so ExpenseService doesn't depend on
 * request DTOs. Which field is populated depends on the expense's splitType:
 * amount for EXACT, percentage for PERCENTAGE, shares for SHARES, none for EQUAL.
 */
public record ExpenseParticipant(Long userId, Long amount, BigDecimal percentage, Long shares) {
}
