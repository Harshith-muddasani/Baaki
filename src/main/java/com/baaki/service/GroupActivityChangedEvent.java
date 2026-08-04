package com.baaki.service;

/**
 * Published after an expense or settlement write commits, so the balance
 * cache (Section 3.2, optional) can refresh without coupling to or risking
 * rollback of the primary write's transaction.
 */
public record GroupActivityChangedEvent(Long groupId) {
}
