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

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  protected ProductReview() {
  }

  public ProductReview(Long productId, Long userId, String username, int rating, String comment) {
    this.productId = productId;
    this.userId = userId;
    this.username = username;
    this.rating = rating;
    this.comment = comment;
  }

  public Long getId() { return id; }
  public Long getProductId() { return productId; }
  public Long getUserId() { return userId; }
  public String getUsername() { return username; }
  public int getRating() { return rating; }
  public String getComment() { return comment; }
  public Instant getCreatedAt() { return createdAt; }
}
