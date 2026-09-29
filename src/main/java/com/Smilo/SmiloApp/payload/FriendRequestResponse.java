package com.Smilo.SmiloApp.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data @AllArgsConstructor
public class FriendRequestResponse {
    private String requestId;
    private String userId;    // the other person in this request
    private String userName;
    private String name;
    private String avatarUrl;
    private LocalDateTime createdAt;
}