package com.smartcommerce.chat.service;

import com.smartcommerce.chat.api.*;
import com.smartcommerce.chat.domain.ChatMessage;
import com.smartcommerce.chat.domain.Conversation;
import com.smartcommerce.chat.domain.ConversationRead;
import com.smartcommerce.chat.repository.ChatMessageRepository;
import com.smartcommerce.chat.repository.ConversationReadRepository;
import com.smartcommerce.chat.repository.ConversationRepository;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
    return list(customerId, merchantId, 0, 100).content();
  }

  @Transactional(readOnly = true)
  public PageResponse<ConversationResponse> list(Long customerId, Long merchantId, int page, int size) {
    Page<Conversation> result;
    Long readerId;
    PageRequest pageable = pageRequest(page, size);
    if (merchantId != null) {
      result = conversations.findByMerchantId(merchantId, pageable);
      readerId = merchantId;
    } else if (customerId != null) {
      result = conversations.findByCustomerId(customerId, pageable);
      readerId = customerId;
    } else {
      result = conversations.findAll(pageable);
      readerId = null;
    }
    List<ConversationResponse> content = result.stream()
        .map(conversation -> ConversationResponse.from(conversation, readerId == null ? 0 : unreadCount(conversation, readerId)))
        .toList();
    return PageResponse.from(result, content);
  }

  @Transactional(readOnly = true)
  public ConversationResponse get(Long conversationId, Long readerId) {
    Conversation conversation = requireConversation(conversationId);
    return ConversationResponse.from(conversation, readerId == null ? 0 : unreadCount(conversation, readerId));
  }

  @Transactional(readOnly = true)
  public List<ChatMessageResponse> messages(Long conversationId) {
    return messages(conversationId, null, 50);
  }

  @Transactional(readOnly = true)
  public List<ChatMessageResponse> messages(Long conversationId, Long beforeId, int limit) {
    requireConversation(conversationId);
    int safeLimit = Math.max(1, Math.min(limit, 100));
    List<ChatMessage> page = beforeId == null
        ? messages.findByConversation_IdOrderByIdDesc(conversationId, PageRequest.of(0, safeLimit))
        : messages.findByConversation_IdAndIdLessThanOrderByIdDesc(conversationId, beforeId, PageRequest.of(0, safeLimit));
    List<ChatMessage> chronological = new ArrayList<>(page);
    Collections.reverse(chronological);
    return chronological.stream()
        .map(ChatMessageResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public ConversationResponse requireAccess(Long conversationId, Long userId, String role, boolean write) {
    Conversation conversation = requireConversation(conversationId);
    if ("ADMIN".equals(role)) {
      if (write) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin users can only audit conversations");
      }
      return ConversationResponse.from(conversation, 0);
    }
    boolean allowed = "CUSTOMER".equals(role) && conversation.getCustomerId().equals(userId)
        || "MERCHANT".equals(role) && conversation.getMerchantId().equals(userId);
    if (!allowed) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation is outside current user scope");
    }
    return ConversationResponse.from(conversation, unreadCount(conversation, userId));
  }

  @Transactional
  public ChatMessageResponse send(Long conversationId, SendMessageRequest request) {
    Conversation conversation = requireConversation(conversationId);
    ChatMessage message = conversation.addMessage(request.senderId(), request.senderRole(), request.senderName(), request.content());
    messages.saveAndFlush(message);
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

  private PageRequest pageRequest(int page, int size) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.max(1, Math.min(size, 100));
    return PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "lastMessageAt", "updatedAt"));
  }

  private long unreadCount(Conversation conversation, Long readerId) {
    return reads.findByConversationIdAndReaderId(conversation.getId(), readerId)
        .map(read -> messages.countByConversation_IdAndSenderIdNotAndCreatedAtAfter(conversation.getId(), readerId, read.getLastReadAt()))
        .orElseGet(() -> messages.countByConversation_IdAndSenderIdNot(conversation.getId(), readerId));
  }
}
