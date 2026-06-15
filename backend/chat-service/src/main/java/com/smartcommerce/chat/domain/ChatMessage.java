package com.smartcommerce.chat.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "conversation_id", nullable = false)
  private Conversation conversation;

  @Column(nullable = false)
  private Long senderId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private SenderRole senderRole;

  @Column(nullable = false, length = 120)
  private String senderName;

  @Column(nullable = false, length = 2000)
  private String content;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  protected ChatMessage() {
  }

  public ChatMessage(Conversation conversation, Long senderId, SenderRole senderRole, String senderName, String content) {
    this.conversation = conversation;
    this.senderId = senderId;
    this.senderRole = senderRole;
    this.senderName = senderName == null || senderName.isBlank() ? senderRole.name() : senderName;
    this.content = content;
  }

  public Long getId() { return id; }
  public Long getConversationId() { return conversation.getId(); }
  public Long getSenderId() { return senderId; }
  public SenderRole getSenderRole() { return senderRole; }
  public String getSenderName() { return senderName; }
  public String getContent() { return content; }
  public Instant getCreatedAt() { return createdAt; }
}
