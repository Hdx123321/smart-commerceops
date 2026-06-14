package com.smartcommerce.chat.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "conversation_reads", uniqueConstraints = {
    @UniqueConstraint(name = "uk_conversation_reader", columnNames = {"conversation_id", "reader_id"})
})
public class ConversationRead {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long conversationId;

  @Column(nullable = false)
  private Long readerId;

  @Column(nullable = false)
  private Instant lastReadAt = Instant.now();

  protected ConversationRead() {
  }

  public ConversationRead(Long conversationId, Long readerId) {
    this.conversationId = conversationId;
    this.readerId = readerId;
  }

  public Instant getLastReadAt() { return lastReadAt; }

  public void markRead() {
    lastReadAt = Instant.now();
  }
}
