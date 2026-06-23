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

  private Long merchantId;

  @Column(nullable = false, length = 160)
  private String merchantName = "Smart CommerceOps";

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private OrderStatus status = OrderStatus.PENDING_PAYMENT;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal totalAmount = BigDecimal.ZERO;

  @Column(nullable = false, length = 300)
  private String shippingAddress;

  @Column(nullable = false, length = 40)
  private String phoneNumber;

  @Column(length = 120)
  private String paymentMethod;

  private Instant paidAt;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  @Column(nullable = false)
  private Instant updatedAt = Instant.now();

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<OrderLine> lines = new ArrayList<>();

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<AfterSalesCase> afterSalesCases = new ArrayList<>();

  protected CommerceOrder() {
  }

  public CommerceOrder(Long userId, Long merchantId, String merchantName, String shippingAddress, String phoneNumber, String paymentMethod) {
    this.userId = userId;
    this.merchantId = merchantId;
    this.merchantName = merchantName == null || merchantName.isBlank() ? "Smart CommerceOps" : merchantName;
    this.shippingAddress = shippingAddress;
    this.phoneNumber = phoneNumber;
    this.paymentMethod = paymentMethod;
  }

  public Long getId() { return id; }
  public Long getUserId() { return userId; }
  public Long getMerchantId() { return merchantId; }
  public String getMerchantName() { return merchantName; }
  public OrderStatus getStatus() { return status; }
  public PaymentStatus getPaymentStatus() { return paymentStatus; }
  public BigDecimal getTotalAmount() { return totalAmount; }
  public String getShippingAddress() { return shippingAddress; }
  public String getPhoneNumber() { return phoneNumber; }
  public String getPaymentMethod() { return paymentMethod; }
  public Instant getPaidAt() { return paidAt; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public List<OrderLine> getLines() { return lines; }
  public List<AfterSalesCase> getAfterSalesCases() { return afterSalesCases; }

  public void addLine(Long productId, String productName, int quantity, BigDecimal unitPrice) {
    addLine(productId, productName, quantity, unitPrice, null, null, null);
  }

  public void addLine(Long productId, String productName, int quantity, BigDecimal unitPrice,
                      String imageUrls, Long merchantId, String merchantName) {
    OrderLine line = new OrderLine(this, productId, productName, quantity, unitPrice, imageUrls, merchantId, merchantName);
    lines.add(line);
    totalAmount = totalAmount.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));
  }

  public void markShipped() {
    if (status != OrderStatus.PENDING_SHIPMENT) {
      throw new IllegalStateException("Only pending shipment orders can be shipped");
    }
    if (paymentStatus != PaymentStatus.PAID) {
      throw new IllegalStateException("Only paid orders can be shipped");
    }
    status = OrderStatus.PENDING_RECEIPT;
    updatedAt = Instant.now();
  }

  public void markPaid() {
    if (paymentStatus == PaymentStatus.PAID) {
      if (status == OrderStatus.PENDING_PAYMENT) {
        status = OrderStatus.PENDING_SHIPMENT;
        updatedAt = Instant.now();
      }
      return;
    }
    if (paymentStatus == PaymentStatus.REFUNDED) {
      throw new IllegalStateException("Refunded orders cannot be marked paid");
    }
    if (status == OrderStatus.CANCELLED) {
      throw new IllegalStateException("Cancelled orders cannot be marked paid");
    }
    paymentStatus = PaymentStatus.PAID;
    paidAt = Instant.now();
    updatedAt = paidAt;
    if (status == OrderStatus.PENDING_PAYMENT) {
      status = OrderStatus.PENDING_SHIPMENT;
    }
  }

  public void confirmReceipt() {
    if (status != OrderStatus.PENDING_RECEIPT) {
      throw new IllegalStateException("Only pending receipt orders can be completed");
    }
    status = OrderStatus.COMPLETED;
    updatedAt = Instant.now();
  }

  public void requestAfterSales() {
    if (status == OrderStatus.AFTER_SALES) {
      throw new IllegalStateException("Order is already in after-sales");
    }
    if (status == OrderStatus.PENDING_PAYMENT || status == OrderStatus.CANCELLED) {
      throw new IllegalStateException("Only active paid orders can request after-sales");
    }
    status = OrderStatus.AFTER_SALES;
    updatedAt = Instant.now();
  }

  public void cancelPendingPayment() {
    if (status != OrderStatus.PENDING_PAYMENT || paymentStatus != PaymentStatus.UNPAID) {
      throw new IllegalStateException("Only unpaid pending payment orders can be cancelled");
    }
    status = OrderStatus.CANCELLED;
    updatedAt = Instant.now();
  }
}
