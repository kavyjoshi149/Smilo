package com.Smilo.SmiloApp.payload;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class PersonResponse {
    private String userId;
    private String userName;
    private String name;
    private String avatarUrl;
    private String bio;
    private int smilePoint;
    private int mutualFriends;
    private String relationship; // "NONE", "PENDING_SENT", "PENDING_RECEIVED", "FRIENDS"
}