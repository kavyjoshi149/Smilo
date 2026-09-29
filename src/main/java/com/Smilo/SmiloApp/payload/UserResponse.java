package com.Smilo.SmiloApp.payload;

import lombok.AllArgsConstructor;
import lombok.Data;


@Data
@AllArgsConstructor
public class UserResponse {
    private String userId;
    private String userName;
    private String name;
    private String email;
    private String avatarUrl;
    private String bio;
    private int smilePoint;
    private int streak;
}