package com.Smilo.SmiloApp.repository;

import com.Smilo.SmiloApp.entity.Thought;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ThoughtRepository extends JpaRepository<Thought, String> {

    @Query("SELECT t FROM Thought t WHERE t.createdAt > :cutoff AND " +
            "(t.visibility = 'GLOBAL' OR t.user.userId = :userId) ORDER BY t.createdAt DESC")
    List<Thought> findGlobalFeed(@Param("userId") String userId, @Param("cutoff") LocalDateTime cutoff);

    @Query("SELECT t FROM Thought t WHERE t.createdAt > :cutoff AND t.user.userId IN :friendIds " +
            "AND t.visibility IN ('FRIENDS','GLOBAL') ORDER BY t.createdAt DESC")
    List<Thought> findFriendsFeed(@Param("friendIds") List<String> friendIds, @Param("cutoff") LocalDateTime cutoff);

    List<Thought> findByUser_UserIdAndCreatedAtAfterOrderByCreatedAtDesc(String userId, LocalDateTime cutoff);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM Thought t WHERE t.createdAt < :cutoff")
    void deleteExpiredThoughts(@Param("cutoff") LocalDateTime cutoff);
}