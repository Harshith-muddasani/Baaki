package com.baaki.service;

import com.baaki.entity.Settlement;

/** newlyCreated=false means this was an idempotent replay - return 200, not 201. */
public record SettlementOutcome(Settlement settlement, boolean newlyCreated) {
}
