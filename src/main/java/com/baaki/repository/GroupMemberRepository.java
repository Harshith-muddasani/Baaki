package com.baaki.repository;

import com.baaki.entity.GroupMember;
import com.baaki.entity.GroupMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GroupMemberRepository extends JpaRepository<GroupMember, GroupMemberId> {

	// JOIN FETCH user: open-in-view is disabled, so the DTO mapping (which
	// reads user.getName()) must see an already-initialized association -
	// there's no session left by the time the controller maps to a response.
	@Query("SELECT gm FROM GroupMember gm JOIN FETCH gm.user WHERE gm.group.id = :groupId")
	List<GroupMember> findByGroup_Id(@Param("groupId") Long groupId);

	boolean existsByGroup_IdAndUser_Id(Long groupId, Long userId);
}
