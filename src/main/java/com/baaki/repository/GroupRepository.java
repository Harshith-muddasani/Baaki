package com.baaki.repository;

import com.baaki.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {

	@Query("SELECT gm.group FROM GroupMember gm WHERE gm.user.id = :userId ORDER BY gm.group.createdAt DESC")
	List<Group> findByMemberUserId(@Param("userId") Long userId);
}
