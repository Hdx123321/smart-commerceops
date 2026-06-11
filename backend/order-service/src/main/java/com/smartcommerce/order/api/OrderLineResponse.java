package com.smartcommerce.order.api;

import com.smartcommerce.order.domain.OrderLine;
import java.math.BigDecimal;

public record OrderLineResponse(Long productId, String productName, int quantity, BigDecimal unitPrice) {
  public static OrderLineResponse from(OrderLine line) {
    return new OrderLineResponse(line.getProductId(), line.getProductName(), line.getQuantity(), line.getUnitPrice());
  }
}
