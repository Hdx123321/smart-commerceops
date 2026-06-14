package com.smartcommerce.chat.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ConversationTest {
  @Test
  void addingMessageUpdatesLastMessageSnapshot() {
    Conversation conversation = new Conversation(1L, 2L, "Merchant", ConversationContextType.ORDER, 10L, "Order #10");

    ChatMessage message = conversation.addMessage(1L, SenderRole.CUSTOMER, "Alice", "Hello merchant");

    assertThat(message.getContent()).isEqualTo("Hello merchant");
    assertThat(conversation.getLastMessagePreview()).isEqualTo("Hello merchant");
    assertThat(conversation.getLastMessageAt()).isNotNull();
  }
}
