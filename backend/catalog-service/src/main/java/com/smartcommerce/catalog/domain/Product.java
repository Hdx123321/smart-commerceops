package com.smartcommerce.catalog.domain;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

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

  @Column(columnDefinition = "TEXT")
  private String imageUrl;

  private static final ObjectMapper MAPPER = new ObjectMapper();

  public static List<String> parseImageUrls(String json) {
    if (json == null || json.isBlank()) {
      return List.of();
    }
    try {
      return MAPPER.readValue(json, new TypeReference<List<String>>() {});
    } catch (Exception e) {
      return List.of();
    }
  }

  private Long merchantId;

  @Column(nullable = false, length = 160)
  private String merchantName = "Smart CommerceOps";

  @Column(length = 800)
  private String merchantDescription;

  @Column(length = 160)
  private String merchantContact;

  @Column(nullable = false)
  private double averageRating;

  @Column(nullable = false)
  private long ratingCount;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  protected Product() {
  }

  public Product(String name, String category, String description, BigDecimal price, int stockQuantity, int lowStockThreshold, String imageUrls) {
    this.name = name;
    this.category = category;
    this.description = description;
    this.price = price;
    this.stockQuantity = stockQuantity;
    this.lowStockThreshold = lowStockThreshold;
    this.imageUrl = imageUrls;
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
  public Long getMerchantId() { return merchantId; }
  public String getMerchantName() { return merchantName; }
  public String getMerchantDescription() { return merchantDescription; }
  public String getMerchantContact() { return merchantContact; }
  public double getAverageRating() { return averageRating; }
  public long getRatingCount() { return ratingCount; }
  public Instant getCreatedAt() { return createdAt; }

  public void update(String name, String category, String description, BigDecimal price, int stockQuantity,
                     int lowStockThreshold, boolean active, String imageUrls, Long merchantId, String merchantName,
                     String merchantDescription, String merchantContact) {
    this.name = name;
    this.category = category;
    this.description = description;
    this.price = price;
    this.stockQuantity = stockQuantity;
    this.lowStockThreshold = lowStockThreshold;
    this.active = active;
    this.imageUrl = imageUrls;
    this.merchantId = merchantId;
    this.merchantName = merchantName == null || merchantName.isBlank() ? "Smart CommerceOps" : merchantName.trim();
    this.merchantDescription = merchantDescription;
    this.merchantContact = merchantContact;
  }

  public void updateImageUrls(String imageUrlsJson) {
    this.imageUrl = imageUrlsJson;
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
