package com.smartcommerce.order.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcommerce.order.domain.CartItem;
import java.math.BigDecimal;
import java.util.List;

public record CartItemResponse(
    Long id,
    Long userId,
    Long productId,
    String productName,
    BigDecimal unitPrice,
    int quantity,
    List<String> imageUrls,
    Long merchantId,
    String merchantName
) {
  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {};

  public static CartItemResponse from(CartItem item) {
    return new CartItemResponse(
        item.getId(),
        item.getUserId(),
        item.getProductId(),
        item.getProductName(),
        item.getUnitPrice(),
        item.getQuantity(),
        parseImageUrls(item.getImageUrls()),
        item.getMerchantId(),
        item.getMerchantName() == null || item.getMerchantName().isBlank() ? "Smart CommerceOps" : item.getMerchantName()
    );
  }

  public static List<String> parseImageUrls(String raw) {
    if (raw == null || raw.isBlank()) {
      return List.of();
    }
    if (!raw.trim().startsWith("[")) {
      return List.of(raw);
    }
    try {
      return MAPPER.readValue(raw, STRING_LIST);
    } catch (Exception ignored) {
      return List.of();
    }
  }
}
