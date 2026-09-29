package com.Smilo.SmiloApp.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "thoughts")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Thought {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String thoughtId;

    @Column(length = 500)
    private String content;

    @Enumerated(EnumType.STRING)
    private Visibility visibility; // GLOBAL, FRIENDS, ONLY_ME

    private int shares;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @OneToMany(mappedBy = "thought", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ThoughtReaction> reactions;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        shares = 0;
    }

    public enum Visibility { GLOBAL, FRIENDS, ONLY_ME }
}