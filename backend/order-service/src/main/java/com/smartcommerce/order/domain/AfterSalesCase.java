package com.smartcommerce.order.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "after_sales_cases")
public class AfterSalesCase {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id", nullable = false)
  private CommerceOrder order;

  @Column(nullable = false)
  private Long userId;

  private Long merchantId;

  @Column(nullable = false, length = 160)
  private String merchantName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private AfterSalesType type;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private AfterSalesStatus status = AfterSalesStatus.PENDING_MERCHANT;

  @Column(nullable = false, length = 120)
  private String reason;

  @Column(length = 1000)
  private String description;

  @Column(length = 160)
  private String contactMethod;

  @Column(length = 1000)
  private String merchantNote;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  @Column(nullable = false)
  private Instant updatedAt = Instant.now();

  protected AfterSalesCase() {
  }

  public AfterSalesCase(CommerceOrder order, AfterSalesType type, String reason, String description, String contactMethod) {
    this.order = order;
    this.userId = order.getUserId();
    this.merchantId = order.getMerchantId();
    this.merchantName = order.getMerchantName();
    this.type = type;
    this.reason = reason;
    this.description = description;
    this.contactMethod = contactMethod;
    if (type == AfterSalesType.CONTACT_MERCHANT) {
      this.status = AfterSalesStatus.COMPLETED;
      this.merchantNote = "Contact request recorded. Merchant should follow up through the provided contact method.";
    }
  }

  public Long getId() { return id; }
  public CommerceOrder getOrder() { return order; }
  public Long getUserId() { return userId; }
  public Long getMerchantId() { return merchantId; }
  public String getMerchantName() { return merchantName; }
  public AfterSalesType getType() { return type; }
  public AfterSalesStatus getStatus() { return status; }
  public String getReason() { return reason; }
  public String getDescription() { return description; }
  public String getContactMethod() { return contactMethod; }
  public String getMerchantNote() { return merchantNote; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }

  public void cancel() {
    if (status != AfterSalesStatus.PENDING_MERCHANT) {
      throw new IllegalStateException("Only pending after-sales cases can be cancelled");
    }
    status = AfterSalesStatus.CANCELLED;
    updatedAt = Instant.now();
  }

  public void reject(String note) {
    if (status != AfterSalesStatus.PENDING_MERCHANT) {
      throw new IllegalStateException("Only pending after-sales cases can be rejected");
    }
    status = AfterSalesStatus.MERCHANT_REJECTED;
    merchantNote = note;
    updatedAt = Instant.now();
  }

  public void complete(String note) {
    approve(note);
  }

  public void approve(String note) {
    if (status != AfterSalesStatus.PENDING_MERCHANT) {
      throw new IllegalStateException("Only pending after-sales cases can be approved");
    }
    if (type == AfterSalesType.CONTACT_MERCHANT) {
      throw new IllegalStateException("Contact requests cannot be approved as after-sales cases");
    }
    if (type == AfterSalesType.REFUND_ONLY) {
      status = AfterSalesStatus.COMPLETED;
    } else {
      status = AfterSalesStatus.RETURN_PENDING_RECEIPT;
    }
    merchantNote = note;
    updatedAt = Instant.now();
  }

  public void confirmReturnedGoods(String note) {
    if (status != AfterSalesStatus.RETURN_PENDING_RECEIPT) {
      throw new IllegalStateException("Returned goods can only be confirmed after merchant approval");
    }
    if (type == AfterSalesType.RETURN) {
      status = AfterSalesStatus.COMPLETED;
    } else if (type == AfterSalesType.EXCHANGE) {
      status = AfterSalesStatus.EXCHANGE_PENDING_SHIPMENT;
    } else {
      throw new IllegalStateException("This after-sales type does not require returned goods confirmation");
    }
    merchantNote = note;
    updatedAt = Instant.now();
  }

  public void shipReplacement(String note) {
    if (type != AfterSalesType.EXCHANGE) {
      throw new IllegalStateException("Only exchange cases can ship replacement goods");
    }
    if (status != AfterSalesStatus.EXCHANGE_PENDING_SHIPMENT) {
      throw new IllegalStateException("Replacement can only be shipped after returned goods are received");
    }
    status = AfterSalesStatus.EXCHANGE_PENDING_RECEIPT;
    merchantNote = note;
    updatedAt = Instant.now();
  }

  public void confirmReplacementReceived() {
    if (type != AfterSalesType.EXCHANGE) {
      throw new IllegalStateException("Only exchange cases can confirm replacement receipt");
    }
    if (status != AfterSalesStatus.EXCHANGE_PENDING_RECEIPT) {
      throw new IllegalStateException("Replacement receipt can only be confirmed after replacement shipment");
    }
    status = AfterSalesStatus.COMPLETED;
    updatedAt = Instant.now();
  }
}
