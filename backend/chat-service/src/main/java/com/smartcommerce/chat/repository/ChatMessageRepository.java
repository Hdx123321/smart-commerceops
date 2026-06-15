package com.smartcommerce.chat.repository;

import com.smartcommerce.chat.domain.ChatMessage;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
  List<ChatMessage> findByConversation_IdOrderByCreatedAtAsc(Long conversationId);
  long countByConversation_IdAndSenderIdNot(Long conversationId, Long senderId);
  long countByConversation_IdAndSenderIdNotAndCreatedAtAfter(Long conversationId, Long senderId, Instant createdAt);
}
