package com.smartcommerce.order.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class CommerceOrder {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private OrderStatus status = OrderStatus.PENDING;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal totalAmount = BigDecimal.ZERO;

  @Column(nullable = false, length = 300)
  private String shippingAddress;

  @Column(nullable = false, length = 40)
  private String phoneNumber;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  @Column(nullable = false)
  private Instant updatedAt = Instant.now();

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<OrderLine> lines = new ArrayList<>();

  protected CommerceOrder() {
  }

  public CommerceOrder(Long userId, String shippingAddress, String phoneNumber) {
    this.userId = userId;
    this.shippingAddress = shippingAddress;
    this.phoneNumber = phoneNumber;
  }

  public Long getId() { return id; }
  public Long getUserId() { return userId; }
  public OrderStatus getStatus() { return status; }
  public PaymentStatus getPaymentStatus() { return paymentStatus; }
  public BigDecimal getTotalAmount() { return totalAmount; }
  public String getShippingAddress() { return shippingAddress; }
  public String getPhoneNumber() { return phoneNumber; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public List<OrderLine> getLines() { return lines; }

  public void addLine(Long productId, String productName, int quantity, BigDecimal unitPrice) {
    OrderLine line = new OrderLine(this, productId, productName, quantity, unitPrice);
    lines.add(line);
    totalAmount = totalAmount.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));
  }

  public void transitionTo(OrderStatus nextStatus) {
    if (status == OrderStatus.CANCELLED || status == OrderStatus.COMPLETED) {
      throw new IllegalStateException("Terminal orders cannot transition");
    }
    if (nextStatus == OrderStatus.PAID) {
      paymentStatus = PaymentStatus.PAID;
    }
    status = nextStatus;
    updatedAt = Instant.now();
  }
}
