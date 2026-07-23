package com.baaki.repository;

import com.baaki.entity.GroupMember;
import com.baaki.entity.GroupMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupMemberRepository extends JpaRepository<GroupMember, GroupMemberId> {

	List<GroupMember> findByGroup_Id(Long groupId);

	boolean existsByGroup_IdAndUser_Id(Long groupId, Long userId);
}
