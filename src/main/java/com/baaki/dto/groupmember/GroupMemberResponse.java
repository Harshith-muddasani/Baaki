package com.baaki.dto.groupmember;

import com.baaki.entity.GroupMember;

import java.time.OffsetDateTime;

public record GroupMemberResponse(
		Long groupId,
		Long userId,
		String userName,
		OffsetDateTime joinedAt
) {

	public static GroupMemberResponse from(GroupMember member) {
		return new GroupMemberResponse(
				member.getGroup().getId(),
				member.getUser().getId(),
				member.getUser().getName(),
				member.getJoinedAt());
	}
}
