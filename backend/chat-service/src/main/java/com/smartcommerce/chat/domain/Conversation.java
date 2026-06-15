package com.smartcommerce.chat.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conversations")
public class Conversation {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long customerId;

  @Column(nullable = false)
  private Long merchantId;

  @Column(nullable = false, length = 160)
  private String merchantName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private ConversationContextType contextType;

  private Long contextId;

  @Column(length = 220)
  private String contextTitle;

  @Column(length = 300)
  private String lastMessagePreview;

  private Instant lastMessageAt;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  @Column(nullable = false)
  private Instant updatedAt = Instant.now();

  @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<ChatMessage> messages = new ArrayList<>();

  protected Conversation() {
  }

  public Conversation(Long customerId, Long merchantId, String merchantName,
                      ConversationContextType contextType, Long contextId, String contextTitle) {
    this.customerId = customerId;
    this.merchantId = merchantId;
    this.merchantName = merchantName == null || merchantName.isBlank() ? "Smart CommerceOps" : merchantName;
    this.contextType = contextType;
    this.contextId = contextId;
    this.contextTitle = contextTitle;
  }

  public Long getId() { return id; }
  public Long getCustomerId() { return customerId; }
  public Long getMerchantId() { return merchantId; }
  public String getMerchantName() { return merchantName; }
  public ConversationContextType getContextType() { return contextType; }
  public Long getContextId() { return contextId; }
  public String getContextTitle() { return contextTitle; }
  public String getLastMessagePreview() { return lastMessagePreview; }
  public Instant getLastMessageAt() { return lastMessageAt; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }

  public ChatMessage addMessage(Long senderId, SenderRole senderRole, String senderName, String content) {
    ChatMessage message = new ChatMessage(this, senderId, senderRole, senderName, content);
    messages.add(message);
    lastMessagePreview = content.length() > 300 ? content.substring(0, 300) : content;
    lastMessageAt = message.getCreatedAt();
    updatedAt = lastMessageAt;
    return message;
  }
}
