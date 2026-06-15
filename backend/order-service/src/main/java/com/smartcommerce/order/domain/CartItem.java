package com.smartcommerce.order.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cart_items")
public class CartItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long userId;

  @Column(nullable = false)
  private Long productId;

  @Column(nullable = false, length = 160)
  private String productName;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal unitPrice;

  @Column(nullable = false)
  private int quantity;

  @Column(columnDefinition = "TEXT")
  private String imageUrls;

  private Long merchantId;

  @Column(length = 160)
  private String merchantName;

  protected CartItem() {
  }

  public CartItem(Long userId, Long productId, String productName, BigDecimal unitPrice, int quantity,
                  String imageUrls, Long merchantId, String merchantName) {
    this.userId = userId;
    this.productId = productId;
    this.productName = productName;
    this.unitPrice = unitPrice;
    this.quantity = quantity;
    this.imageUrls = imageUrls;
    this.merchantId = merchantId;
    this.merchantName = merchantName;
  }

  public Long getId() { return id; }
  public Long getUserId() { return userId; }
  public Long getProductId() { return productId; }
  public String getProductName() { return productName; }
  public BigDecimal getUnitPrice() { return unitPrice; }
  public int getQuantity() { return quantity; }
  public String getImageUrls() { return imageUrls; }
  public Long getMerchantId() { return merchantId; }
  public String getMerchantName() { return merchantName; }

  public void addQuantity(int delta) {
    this.quantity += delta;
  }
}
