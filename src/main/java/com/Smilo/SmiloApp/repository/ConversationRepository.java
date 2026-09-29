package com.Smilo.SmiloApp.repository;

import com.Smilo.SmiloApp.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, String> {

    @Query("SELECT c FROM Conversation c WHERE (c.userA.userId = :u1 AND c.userB.userId = :u2) OR (c.userA.userId = :u2 AND c.userB.userId = :u1)")
    Optional<Conversation> findBetween(@Param("u1") String u1, @Param("u2") String u2);

    @Query("SELECT c FROM Conversation c WHERE c.userA.userId = :userId OR c.userB.userId = :userId ORDER BY c.updatedAt DESC")
    List<Conversation> findAllForUser(@Param("userId") String userId);
}