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

  @Column(columnDefinition = "TEXT")
  private String imageUrls;

  private Long merchantId;

  @Column(length = 160)
  private String merchantName;

  protected OrderLine() {
  }

  public OrderLine(CommerceOrder order, Long productId, String productName, int quantity, BigDecimal unitPrice,
                   String imageUrls, Long merchantId, String merchantName) {
    this.order = order;
    this.productId = productId;
    this.productName = productName;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.imageUrls = imageUrls;
    this.merchantId = merchantId;
    this.merchantName = merchantName;
  }

  public Long getId() { return id; }
  public Long getProductId() { return productId; }
  public String getProductName() { return productName; }
  public int getQuantity() { return quantity; }
  public BigDecimal getUnitPrice() { return unitPrice; }
  public String getImageUrls() { return imageUrls; }
  public Long getMerchantId() { return merchantId; }
  public String getMerchantName() { return merchantName; }
}
