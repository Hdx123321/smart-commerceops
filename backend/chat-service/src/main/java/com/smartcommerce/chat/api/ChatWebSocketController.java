package com.smartcommerce.chat.api;

import com.smartcommerce.chat.domain.SenderRole;
import com.smartcommerce.chat.security.ChatPrincipal;
import com.smartcommerce.chat.service.ChatService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatWebSocketController {
  private final ChatService chatService;
  private final SimpMessagingTemplate messaging;

  public ChatWebSocketController(ChatService chatService, SimpMessagingTemplate messaging) {
    this.chatService = chatService;
    this.messaging = messaging;
  }

  @MessageMapping("/chat/conversations/{conversationId}/messages")
  public void send(@DestinationVariable Long conversationId,
                   @Valid @Payload RealtimeSendMessageRequest request,
                   Principal rawPrincipal) {
    ChatPrincipal principal = (ChatPrincipal) rawPrincipal;
    ChatMessageResponse message = chatService.send(conversationId, new SendMessageRequest(
        principal.userId(), SenderRole.valueOf(principal.role()), principal.username(), request.content()));
    ConversationResponse conversation = chatService.get(conversationId, null);
    messaging.convertAndSend("/topic/chat/conversations/" + conversationId, ChatEvent.message(message, conversation));
    sendConversationEvent(conversation, message);
  }

  @MessageMapping("/chat/conversations/{conversationId}/read")
  public void read(@DestinationVariable Long conversationId, Principal rawPrincipal) {
    ChatPrincipal principal = (ChatPrincipal) rawPrincipal;
    ConversationResponse conversation = chatService.markRead(conversationId, principal.userId());
    ChatEvent event = ChatEvent.read(conversationId, principal.userId(), conversation);
    messaging.convertAndSend("/topic/chat/conversations/" + conversationId, event);
    messaging.convertAndSendToUser(principal.getName(), "/queue/chat-events", event);
  }

  private void sendConversationEvent(ConversationResponse conversation, ChatMessageResponse message) {
    String customer = ChatPrincipal.principalName("CUSTOMER", conversation.customerId());
    String merchant = ChatPrincipal.principalName("MERCHANT", conversation.merchantId());
    messaging.convertAndSendToUser(customer, "/queue/chat-events",
        ChatEvent.message(message, chatService.get(conversation.id(), conversation.customerId())));
    messaging.convertAndSendToUser(merchant, "/queue/chat-events",
        ChatEvent.message(message, chatService.get(conversation.id(), conversation.merchantId())));
  }
}
