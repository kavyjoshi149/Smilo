package com.Smilo.SmiloApp.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data @AllArgsConstructor
public class MessageResponse {
    private String messageId;
    private String senderId;
    private String content;
    private LocalDateTime createdAt;
    private boolean mine;
}