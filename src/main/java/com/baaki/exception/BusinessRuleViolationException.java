package com.baaki.exception;

/**
 * Request is syntactically valid but violates a domain rule
 * (e.g. an expense paid by a user who isn't a member of the group).
 */
public class BusinessRuleViolationException extends RuntimeException {

	public BusinessRuleViolationException(String message) {
		super(message);
	}
}
