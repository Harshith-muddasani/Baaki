package com.baaki.dto.group;

import com.baaki.entity.Group;

import java.time.OffsetDateTime;

public record GroupResponse(
		Long id,
		String name,
		Long createdByUserId,
		OffsetDateTime createdAt
) {

	public static GroupResponse from(Group group) {
		return new GroupResponse(group.getId(), group.getName(), group.getCreatedBy().getId(), group.getCreatedAt());
	}
}
