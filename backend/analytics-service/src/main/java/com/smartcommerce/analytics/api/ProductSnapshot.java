package com.smartcommerce.analytics.api;

import java.math.BigDecimal;

public record ProductSnapshot(
    Long id,
    String name,
    String category,
    String description,
    BigDecimal price,
    int stockQuantity,
    int lowStockThreshold,
    int salesCount,
    boolean active,
    String imageUrl,
    double averageRating,
    long ratingCount
) {
}
