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

  protected CartItem() {
  }

  public CartItem(Long userId, Long productId, String productName, BigDecimal unitPrice, int quantity) {
    this.userId = userId;
    this.productId = productId;
    this.productName = productName;
    this.unitPrice = unitPrice;
    this.quantity = quantity;
  }

  public Long getId() { return id; }
  public Long getUserId() { return userId; }
  public Long getProductId() { return productId; }
  public String getProductName() { return productName; }
  public BigDecimal getUnitPrice() { return unitPrice; }
  public int getQuantity() { return quantity; }

  public void addQuantity(int delta) {
    this.quantity += delta;
  }
}
