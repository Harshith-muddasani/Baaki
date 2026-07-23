package com.baaki.dto.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateGroupRequest(
		@NotBlank(message = "name is required")
		@Size(max = 100)
		String name,

		// Stand-in until /auth is wired up: the creator is passed explicitly
		// rather than derived from an authenticated principal.
		@NotNull(message = "createdByUserId is required")
		Long createdByUserId
) {
}
