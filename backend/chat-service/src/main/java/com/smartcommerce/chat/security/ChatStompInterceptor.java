package com.smartcommerce.chat.security;

import com.smartcommerce.chat.service.ChatService;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

@Component
public class ChatStompInterceptor implements ChannelInterceptor {
  private static final Pattern CONVERSATION_DESTINATION = Pattern.compile(
      "^/(?:app|topic)/chat/conversations/(\\d+)(?:/(?:messages|read))?$");

  private final ChatJwtVerifier jwtVerifier;
  private final ChatService chatService;

  public ChatStompInterceptor(ChatJwtVerifier jwtVerifier, ChatService chatService) {
    this.jwtVerifier = jwtVerifier;
    this.chatService = chatService;
  }

  @Override
  public Message<?> preSend(Message<?> message, MessageChannel channel) {
    StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
    if (accessor == null || accessor.getCommand() == null) {
      return message;
    }
    if (StompCommand.CONNECT.equals(accessor.getCommand())) {
      accessor.setUser(authenticate(accessor));
      return message;
    }
    if (!StompCommand.SEND.equals(accessor.getCommand()) && !StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
      return message;
    }
    if (!(accessor.getUser() instanceof ChatPrincipal principal)) {
      throw new MessagingException("Authenticated WebSocket session required");
    }
    String destination = accessor.getDestination();
    if (StompCommand.SUBSCRIBE.equals(accessor.getCommand()) && "/user/queue/chat-events".equals(destination)) {
      return message;
    }
    Matcher matcher = CONVERSATION_DESTINATION.matcher(destination == null ? "" : destination);
    if (!matcher.matches()) {
      throw new MessagingException("Unsupported chat destination");
    }
    boolean write = StompCommand.SEND.equals(accessor.getCommand());
    chatService.requireAccess(Long.parseLong(matcher.group(1)), principal.userId(), principal.role(), write);
    return message;
  }

  private ChatPrincipal authenticate(StompHeaderAccessor accessor) {
    String authorization = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new MessagingException("Missing bearer token");
    }
    try {
      return jwtVerifier.verify(authorization.substring("Bearer ".length()));
    } catch (IllegalArgumentException error) {
      throw new MessagingException("Invalid bearer token", error);
    }
  }
}
