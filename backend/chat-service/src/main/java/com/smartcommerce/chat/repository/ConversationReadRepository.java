package com.smartcommerce.chat.repository;

import com.smartcommerce.chat.domain.ConversationRead;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationReadRepository extends JpaRepository<ConversationRead, Long> {
  Optional<ConversationRead> findByConversationIdAndReaderId(Long conversationId, Long readerId);
}
