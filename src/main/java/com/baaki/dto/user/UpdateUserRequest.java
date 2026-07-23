package com.baaki.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
		@NotBlank(message = "name is required")
		@Size(max = 100)
		String name
) {
}
