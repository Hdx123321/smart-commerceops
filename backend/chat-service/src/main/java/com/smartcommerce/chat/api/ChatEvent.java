package com.smartcommerce.chat.api;

import java.time.Instant;

public record ChatEvent(
    String type,
    Long conversationId,
    ChatMessageResponse message,
    ConversationResponse conversation,
    Long readerId,
    Instant occurredAt
) {
  public static ChatEvent message(ChatMessageResponse message, ConversationResponse conversation) {
    return new ChatEvent("MESSAGE_CREATED", message.conversationId(), message, conversation, null, Instant.now());
  }

  public static ChatEvent read(Long conversationId, Long readerId, ConversationResponse conversation) {
    return new ChatEvent("READ_UPDATED", conversationId, null, conversation, readerId, Instant.now());
  }
}
