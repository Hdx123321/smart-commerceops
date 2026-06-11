package com.smartcommerce.catalog.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "products")
public class Product {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 160)
  private String name;

  @Column(nullable = false, length = 80)
  private String category;

  @Column(length = 800)
  private String description;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal price;

  @Column(nullable = false)
  private int stockQuantity;

  @Column(nullable = false)
  private int lowStockThreshold;

  @Column(nullable = false)
  private int salesCount;

  @Column(nullable = false)
  private boolean active = true;

  @Column(length = 1000)
  private String imageUrl;

  @Column(nullable = false)
  private double averageRating;

  @Column(nullable = false)
  private long ratingCount;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  protected Product() {
  }

  public Product(String name, String category, String description, BigDecimal price, int stockQuantity, int lowStockThreshold, String imageUrl) {
    this.name = name;
    this.category = category;
    this.description = description;
    this.price = price;
    this.stockQuantity = stockQuantity;
    this.lowStockThreshold = lowStockThreshold;
    this.imageUrl = imageUrl;
  }

  public Long getId() { return id; }
  public String getName() { return name; }
  public String getCategory() { return category; }
  public String getDescription() { return description; }
  public BigDecimal getPrice() { return price; }
  public int getStockQuantity() { return stockQuantity; }
  public int getLowStockThreshold() { return lowStockThreshold; }
  public int getSalesCount() { return salesCount; }
  public boolean isActive() { return active; }
  public String getImageUrl() { return imageUrl; }
  public double getAverageRating() { return averageRating; }
  public long getRatingCount() { return ratingCount; }
  public Instant getCreatedAt() { return createdAt; }

  public void update(String name, String category, String description, BigDecimal price, int stockQuantity, int lowStockThreshold, boolean active, String imageUrl) {
    this.name = name;
    this.category = category;
    this.description = description;
    this.price = price;
    this.stockQuantity = stockQuantity;
    this.lowStockThreshold = lowStockThreshold;
    this.active = active;
    this.imageUrl = imageUrl;
  }

  public void reserve(int quantity) {
    if (quantity <= 0) {
      throw new IllegalArgumentException("Quantity must be positive");
    }
    if (stockQuantity < quantity) {
      throw new IllegalStateException("Insufficient stock for " + name);
    }
    stockQuantity -= quantity;
    salesCount += quantity;
  }

  public void addRating(int rating) {
    if (rating < 1 || rating > 5) {
      throw new IllegalArgumentException("Rating must be between 1 and 5");
    }
    averageRating = ((averageRating * ratingCount) + rating) / (ratingCount + 1);
    ratingCount++;
  }
}
