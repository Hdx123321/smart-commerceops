package com.smartcommerce.order.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_lines")
public class OrderLine {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "order_id", nullable = false)
  private CommerceOrder order;

  @Column(nullable = false)
  private Long productId;

  @Column(nullable = false, length = 160)
  private String productName;

  @Column(nullable = false)
  private int quantity;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal unitPrice;

  protected OrderLine() {
  }

  public OrderLine(CommerceOrder order, Long productId, String productName, int quantity, BigDecimal unitPrice) {
    this.order = order;
    this.productId = productId;
    this.productName = productName;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
  }

  public Long getId() { return id; }
  public Long getProductId() { return productId; }
  public String getProductName() { return productName; }
  public int getQuantity() { return quantity; }
  public BigDecimal getUnitPrice() { return unitPrice; }
}
