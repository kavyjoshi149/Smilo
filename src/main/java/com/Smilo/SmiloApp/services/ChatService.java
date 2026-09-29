package com.Smilo.SmiloApp.services;

import com.Smilo.SmiloApp.entity.*;
import com.Smilo.SmiloApp.exceptions.ResourceNotFoundException;
import com.Smilo.SmiloApp.payload.*;
import com.Smilo.SmiloApp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    private User getUser(String userName) {
        return userRepository.findByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userName));
    }

    private Conversation getOrCreateConversation(User me, User other) {
        return conversationRepository.findBetween(me.getUserId(), other.getUserId())
                .orElseGet(() -> {
                    Conversation c = new Conversation();
                    c.setUserA(me);
                    c.setUserB(other);
                    return conversationRepository.save(c);
                });
    }

    public List<ConversationResponse> listConversations(String userName) {
        User me = getUser(userName);
        List<Conversation> convos = conversationRepository.findAllForUser(me.getUserId());

        return convos.stream().map(c -> {
            User other = c.getUserA().getUserId().equals(me.getUserId()) ? c.getUserB() : c.getUserA();
            Message last = messageRepository.findTop1ByConversation_ConversationIdOrderByCreatedAtDesc(c.getConversationId());
            long unread = messageRepository.countByConversation_ConversationIdAndReadFlagFalseAndSender_UserIdNot(c.getConversationId(), me.getUserId());

            return new ConversationResponse(
                    c.getConversationId(), other.getUserId(), other.getUserName(), other.getName(), other.getAvatarUrl(),
                    last != null ? last.getContent() : null,
                    c.getUpdatedAt(), unread
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public List<MessageResponse> getMessages(String userName, String otherUserId) {
        User me = getUser(userName);
        User other = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + otherUserId));

        Conversation convo = getOrCreateConversation(me, other);
        messageRepository.markReadForOther(convo.getConversationId(), me.getUserId());

        return messageRepository.findByConversation_ConversationIdOrderByCreatedAtAsc(convo.getConversationId())
                .stream()
                .map(m -> new MessageResponse(m.getMessageId(), m.getSender().getUserId(), m.getContent(), m.getCreatedAt(), m.getSender().getUserId().equals(me.getUserId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageResponse sendMessage(String userName, String otherUserId, String content) {
        User me = getUser(userName);
        User other = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + otherUserId));

        Conversation convo = getOrCreateConversation(me, other);
        convo.setUpdatedAt(java.time.LocalDateTime.now());
        conversationRepository.save(convo);

        Message message = new Message();
        message.setConversation(convo);
        message.setSender(me);
        message.setContent(content);
        Message saved = messageRepository.save(message);

        return new MessageResponse(saved.getMessageId(), me.getUserId(), saved.getContent(), saved.getCreatedAt(), true);
    }
}