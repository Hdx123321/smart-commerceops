package com.smartcommerce.chat.api;

import com.smartcommerce.chat.domain.Conversation;
import com.smartcommerce.chat.domain.ConversationContextType;
import java.time.Instant;

public record ConversationResponse(
    Long id,
    Long customerId,
    Long merchantId,
    String merchantName,
    ConversationContextType contextType,
    Long contextId,
    String contextTitle,
    String lastMessagePreview,
    Instant lastMessageAt,
    Instant createdAt,
    Instant updatedAt,
    long unreadCount
) {
  public static ConversationResponse from(Conversation conversation, long unreadCount) {
    return new ConversationResponse(
        conversation.getId(),
        conversation.getCustomerId(),
        conversation.getMerchantId(),
        conversation.getMerchantName(),
        conversation.getContextType(),
        conversation.getContextId(),
        conversation.getContextTitle(),
        conversation.getLastMessagePreview(),
        conversation.getLastMessageAt(),
        conversation.getCreatedAt(),
        conversation.getUpdatedAt(),
        unreadCount
    );
  }
}
