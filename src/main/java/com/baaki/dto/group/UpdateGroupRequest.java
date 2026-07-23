package com.baaki.dto.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateGroupRequest(
		@NotBlank(message = "name is required")
		@Size(max = 100)
		String name
) {
}
