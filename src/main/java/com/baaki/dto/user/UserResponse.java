package com.baaki.dto.user;

import com.baaki.entity.User;

import java.time.OffsetDateTime;

public record UserResponse(
		Long id,
		String name,
		String email,
		OffsetDateTime createdAt
) {

	public static UserResponse from(User user) {
		return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());
	}
}
