package com.smartcommerce.order.api;

import com.smartcommerce.order.domain.OrderLine;
import java.math.BigDecimal;
import java.util.List;

public record OrderLineResponse(
    Long id,
    Long productId,
    String productName,
    int quantity,
    BigDecimal unitPrice,
    List<String> imageUrls,
    Long merchantId,
    String merchantName
) {
  public static OrderLineResponse from(OrderLine line) {
    return new OrderLineResponse(
        line.getId(),
        line.getProductId(),
        line.getProductName(),
        line.getQuantity(),
        line.getUnitPrice(),
        CartItemResponse.parseImageUrls(line.getImageUrls()),
        line.getMerchantId(),
        line.getMerchantName() == null || line.getMerchantName().isBlank() ? "Smart CommerceOps" : line.getMerchantName()
    );
  }
}
