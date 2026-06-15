package com.smartcommerce.order.api;

import java.math.BigDecimal;
import java.util.List;

public record ProductSnapshot(
    Long id,
    String name,
    String category,
    String description,
    BigDecimal price,
    int stockQuantity,
    List<String> imageUrls,
    Long merchantId,
    String merchantName
) {
}
