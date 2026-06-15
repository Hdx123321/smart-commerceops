package com.smartcommerce.chat.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartcommerce.chat.api.CreateConversationRequest;
import com.smartcommerce.chat.api.SendMessageRequest;
import com.smartcommerce.chat.domain.ConversationContextType;
import com.smartcommerce.chat.domain.SenderRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ChatServiceIntegrationTest {
  @Autowired
  private ChatService chatService;

  @Test
  void createConversationReusesSameContextThread() {
    CreateConversationRequest request = new CreateConversationRequest(
        1L, 2L, "Merchant", ConversationContextType.ORDER, 10L, "Order #10");

    var first = chatService.createOrReuse(request);
    var second = chatService.createOrReuse(request);

    assertThat(second.id()).isEqualTo(first.id());
  }

  @Test
  void sendMessageUpdatesUnreadCountAndMarkReadClearsIt() {
    var conversation = chatService.createOrReuse(new CreateConversationRequest(
        11L, 22L, "Merchant", ConversationContextType.PRODUCT, 33L, "Running Shoes"));

    chatService.send(conversation.id(), new SendMessageRequest(11L, SenderRole.CUSTOMER, "Alice", "Is size 40 available?"));

    var merchantInbox = chatService.list(null, 22L);
    assertThat(merchantInbox).hasSize(1);
    assertThat(merchantInbox.getFirst().lastMessagePreview()).isEqualTo("Is size 40 available?");
    assertThat(merchantInbox.getFirst().unreadCount()).isEqualTo(1);

    chatService.markRead(conversation.id(), 22L);

    var refreshedInbox = chatService.list(null, 22L);
    assertThat(refreshedInbox.getFirst().unreadCount()).isZero();
  }
}
