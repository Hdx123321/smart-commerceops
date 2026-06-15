package com.smartcommerce.chat.service;

import com.smartcommerce.chat.api.*;
import com.smartcommerce.chat.domain.ChatMessage;
import com.smartcommerce.chat.domain.Conversation;
import com.smartcommerce.chat.domain.ConversationRead;
import com.smartcommerce.chat.repository.ChatMessageRepository;
import com.smartcommerce.chat.repository.ConversationReadRepository;
import com.smartcommerce.chat.repository.ConversationRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class ChatService {
  private final ConversationRepository conversations;
  private final ChatMessageRepository messages;
  private final ConversationReadRepository reads;

  public ChatService(ConversationRepository conversations, ChatMessageRepository messages, ConversationReadRepository reads) {
    this.conversations = conversations;
    this.messages = messages;
    this.reads = reads;
  }

  @Transactional
  public ConversationResponse createOrReuse(CreateConversationRequest request) {
    Conversation conversation = conversations
        .findFirstByCustomerIdAndMerchantIdAndContextTypeAndContextIdOrderByCreatedAtDesc(
            request.customerId(), request.merchantId(), request.contextType(), request.contextId())
        .orElseGet(() -> conversations.save(new Conversation(
            request.customerId(),
            request.merchantId(),
            request.merchantName(),
            request.contextType(),
            request.contextId(),
            request.contextTitle()
        )));
    return ConversationResponse.from(conversation, unreadCount(conversation, request.customerId()));
  }

  @Transactional(readOnly = true)
  public List<ConversationResponse> list(Long customerId, Long merchantId) {
    List<Conversation> result;
    Long readerId;
    if (merchantId != null) {
      result = conversations.findByMerchantIdOrderByLastMessageAtDescUpdatedAtDesc(merchantId);
      readerId = merchantId;
    } else if (customerId != null) {
      result = conversations.findByCustomerIdOrderByLastMessageAtDescUpdatedAtDesc(customerId);
      readerId = customerId;
    } else {
      result = conversations.findAllByOrderByLastMessageAtDescUpdatedAtDesc();
      readerId = null;
    }
    return result.stream()
        .map(conversation -> ConversationResponse.from(conversation, readerId == null ? 0 : unreadCount(conversation, readerId)))
        .toList();
  }

  @Transactional(readOnly = true)
  public ConversationResponse get(Long conversationId, Long readerId) {
    Conversation conversation = requireConversation(conversationId);
    return ConversationResponse.from(conversation, readerId == null ? 0 : unreadCount(conversation, readerId));
  }

  @Transactional(readOnly = true)
  public List<ChatMessageResponse> messages(Long conversationId) {
    requireConversation(conversationId);
    return messages.findByConversation_IdOrderByCreatedAtAsc(conversationId).stream()
        .map(ChatMessageResponse::from)
        .toList();
  }

  @Transactional
  public ChatMessageResponse send(Long conversationId, SendMessageRequest request) {
    Conversation conversation = requireConversation(conversationId);
    ChatMessage message = conversation.addMessage(request.senderId(), request.senderRole(), request.senderName(), request.content());
    conversations.save(conversation);
    return ChatMessageResponse.from(message);
  }

  @Transactional
  public ConversationResponse markRead(Long conversationId, Long readerId) {
    if (readerId == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "readerId is required");
    }
    Conversation conversation = requireConversation(conversationId);
    ConversationRead read = reads.findByConversationIdAndReaderId(conversationId, readerId)
        .orElseGet(() -> new ConversationRead(conversationId, readerId));
    read.markRead();
    reads.save(read);
    return ConversationResponse.from(conversation, 0);
  }

  private Conversation requireConversation(Long conversationId) {
    return conversations.findById(conversationId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
  }

  private long unreadCount(Conversation conversation, Long readerId) {
    return reads.findByConversationIdAndReaderId(conversation.getId(), readerId)
        .map(read -> messages.countByConversation_IdAndSenderIdNotAndCreatedAtAfter(conversation.getId(), readerId, read.getLastReadAt()))
        .orElseGet(() -> messages.countByConversation_IdAndSenderIdNot(conversation.getId(), readerId));
  }
}
