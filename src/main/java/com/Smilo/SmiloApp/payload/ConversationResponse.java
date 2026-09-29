package com.Smilo.SmiloApp.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data @AllArgsConstructor
public class ConversationResponse {
    private String conversationId;
    private String otherUserId;
    private String otherUserName;
    private String otherName;
    private String otherAvatarUrl;
    private String lastMessage;
    private LocalDateTime updatedAt;
    private long unreadCount;
}