package com.Smilo.SmiloApp.controller;

import com.Smilo.SmiloApp.payload.*;
import com.Smilo.SmiloApp.services.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> conversations(Authentication auth) {
        return ResponseEntity.ok(chatService.listConversations(auth.getName()));
    }

    @GetMapping("/conversations/{otherUserId}/messages")
    public ResponseEntity<List<MessageResponse>> messages(Authentication auth, @PathVariable String otherUserId) {
        return ResponseEntity.ok(chatService.getMessages(auth.getName(), otherUserId));
    }

    @PostMapping("/conversations/{otherUserId}/messages")
    public ResponseEntity<MessageResponse> send(Authentication auth, @PathVariable String otherUserId, @Valid @RequestBody ChatMessageRequest request) {
        return ResponseEntity.ok(chatService.sendMessage(auth.getName(), otherUserId, request.getContent()));
    }
}