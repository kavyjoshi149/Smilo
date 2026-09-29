package com.Smilo.SmiloApp.repository;

import com.Smilo.SmiloApp.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {

    List<Message> findByConversation_ConversationIdOrderByCreatedAtAsc(String conversationId);

    Message findTop1ByConversation_ConversationIdOrderByCreatedAtDesc(String conversationId);

    long countByConversation_ConversationIdAndReadFlagFalseAndSender_UserIdNot(String conversationId, String currentUserId);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.readFlag = true WHERE m.conversation.conversationId = :conversationId AND m.sender.userId <> :userId")
    void markReadForOther(@Param("conversationId") String conversationId, @Param("userId") String userId);
}