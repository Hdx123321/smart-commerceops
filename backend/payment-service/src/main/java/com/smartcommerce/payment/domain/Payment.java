package com.smartcommerce.payment.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payments")
public class Payment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private Long orderId;

  @Column(nullable = false)
  private Long userId;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amount;

  @Column(nullable = false, length = 120)
  private String paymentMethod;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private PaymentStatus status = PaymentStatus.PROCESSING;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  private Instant completedAt;

  @Version
  private Long version;

  protected Payment() {
  }

  public Payment(Long orderId, Long userId, BigDecimal amount, String paymentMethod) {
    this.orderId = orderId;
    this.userId = userId;
    this.amount = amount;
    this.paymentMethod = paymentMethod == null || paymentMethod.isBlank() ? "Simulated payment" : paymentMethod;
  }

  public Long getId() { return id; }
  public Long getOrderId() { return orderId; }
  public Long getUserId() { return userId; }
  public BigDecimal getAmount() { return amount; }
  public String getPaymentMethod() { return paymentMethod; }
  public PaymentStatus getStatus() { return status; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getCompletedAt() { return completedAt; }
  public Long getVersion() { return version; }

  public boolean isProcessing() {
    return status == PaymentStatus.PROCESSING;
  }

  public boolean isSuccess() {
    return status == PaymentStatus.SUCCESS;
  }

  public void markSuccess() {
    if (status == PaymentStatus.SUCCESS) {
      return;
    }
    status = PaymentStatus.SUCCESS;
    completedAt = Instant.now();
  }

  public void markFailed() {
    if (status == PaymentStatus.SUCCESS) {
      throw new IllegalStateException("Successful payments cannot be failed");
    }
    status = PaymentStatus.FAILED;
  }
}
