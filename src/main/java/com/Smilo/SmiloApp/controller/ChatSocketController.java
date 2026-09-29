package com.Smilo.SmiloApp.controller;

import com.Smilo.SmiloApp.entity.User;
import com.Smilo.SmiloApp.payload.ChatMessageRequest;
import com.Smilo.SmiloApp.payload.MessageResponse;
import com.Smilo.SmiloApp.repository.UserRepository;
import com.Smilo.SmiloApp.services.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository; // NEW

    @MessageMapping("/chat.send/{otherUserId}")
    public void sendRealtime(@DestinationVariable String otherUserId, @Payload ChatMessageRequest request, Authentication authentication) {
        MessageResponse saved = chatService.sendMessage(authentication.getName(), otherUserId, request.getContent());

        // Per-user routing is keyed by the STOMP Principal name, which is
        // the username — not the userId. Resolve it before sending, or
        // the recipient's push silently goes nowhere.
        String otherUserName = userRepository.findById(otherUserId)
                .map(User::getUserName)
                .orElseThrow(() -> new RuntimeException("User not found: " + otherUserId));

        messagingTemplate.convertAndSendToUser(otherUserName, "/queue/messages", saved);
        messagingTemplate.convertAndSendToUser(authentication.getName(), "/queue/messages", saved);
    }
}