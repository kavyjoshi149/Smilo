package com.Smilo.SmiloApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDate;
import java.util.List;
@Entity
@Table(name = "users")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String userId;

    private String userName;

    private String name;       // NEW — full display name

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    private String password;

    private String avatarUrl;  // NEW
    private String bio;        // NEW

    private int smilePoint;
    private int streak;
    private LocalDate lastIncrease;


    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Thought> thoughts;
}