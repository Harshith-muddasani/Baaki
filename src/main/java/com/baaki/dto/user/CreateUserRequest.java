package com.baaki.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
		@NotBlank(message = "name is required")
		@Size(max = 100)
		String name,

		@NotBlank(message = "email is required")
		@Email(message = "email must be a valid address")
		@Size(max = 255)
		String email,

		@NotBlank(message = "password is required")
		@Size(min = 8, max = 72, message = "password must be between 8 and 72 characters")
		String password
) {
}
