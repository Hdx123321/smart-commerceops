package com.smartcommerce.chat.api;

import com.smartcommerce.chat.domain.ChatMessage;
import com.smartcommerce.chat.domain.SenderRole;
import java.time.Instant;

public record ChatMessageResponse(
    Long id,
    Long conversationId,
    Long senderId,
    SenderRole senderRole,
    String senderName,
    String content,
    Instant createdAt
) {
  public static ChatMessageResponse from(ChatMessage message) {
    return new ChatMessageResponse(
        message.getId(),
        message.getConversationId(),
        message.getSenderId(),
        message.getSenderRole(),
        message.getSenderName(),
        message.getContent(),
        message.getCreatedAt()
    );
  }
}
