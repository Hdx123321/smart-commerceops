package com.smartcommerce.catalog.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "product_reviews")
public class ProductReview {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long productId;

  @Column(nullable = false)
  private Long userId;

  @Column(nullable = false, length = 80)
  private String username;

  @Column(nullable = false)
  private int rating;

  @Column(length = 1000)
  private String comment;

  private Long orderId;

  private Long orderLineId;

  @Column(length = 1000)
  private String merchantReply;

  private Instant merchantRepliedAt;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  protected ProductReview() {
  }

  public ProductReview(Long productId, Long userId, String username, int rating, String comment, Long orderId, Long orderLineId) {
    this.productId = productId;
    this.userId = userId;
    this.username = username;
    this.rating = rating;
    this.comment = comment;
    this.orderId = orderId;
    this.orderLineId = orderLineId;
  }

  public Long getId() { return id; }
  public Long getProductId() { return productId; }
  public Long getUserId() { return userId; }
  public String getUsername() { return username; }
  public int getRating() { return rating; }
  public String getComment() { return comment; }
  public Long getOrderId() { return orderId; }
  public Long getOrderLineId() { return orderLineId; }
  public String getMerchantReply() { return merchantReply; }
  public Instant getMerchantRepliedAt() { return merchantRepliedAt; }
  public Instant getCreatedAt() { return createdAt; }

  public void reply(String reply) {
    this.merchantReply = reply;
    this.merchantRepliedAt = Instant.now();
  }
}
