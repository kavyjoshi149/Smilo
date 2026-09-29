package com.Smilo.SmiloApp.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "thought_reactions", uniqueConstraints = @UniqueConstraint(columnNames = {"thought_id", "user_id", "type"}))
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ThoughtReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thought_id", nullable = false)
    private Thought thought;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private ReactionType type; // SMILE, INSPIRED, RELATABLE, WORTH_SHARING

    public enum ReactionType { SMILE, INSPIRED, RELATABLE, WORTH_SHARING }
}