package com.baaki.dto.groupmember;

import jakarta.validation.constraints.NotNull;

public record AddGroupMemberRequest(
		@NotNull(message = "userId is required")
		Long userId
) {
}
