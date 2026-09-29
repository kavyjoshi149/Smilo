package com.Smilo.SmiloApp.repository;

import com.Smilo.SmiloApp.entity.ThoughtReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ThoughtReactionRepository extends JpaRepository<ThoughtReaction, String> {
    Optional<ThoughtReaction> findByThought_ThoughtIdAndUser_UserIdAndType(String thoughtId, String userId, ThoughtReaction.ReactionType type);
    List<ThoughtReaction> findByThought_ThoughtId(String thoughtId);
    List<ThoughtReaction> findByThought_ThoughtIdAndUser_UserId(String thoughtId, String userId);
}