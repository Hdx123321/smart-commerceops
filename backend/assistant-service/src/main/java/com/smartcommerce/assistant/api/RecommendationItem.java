package com.smartcommerce.assistant.api;

import java.math.BigDecimal;
import java.util.List;

public record RecommendationItem(
    long productId,
    String name,
    BigDecimal price,
    String category,
    List<String> imageUrls,
    String merchantName,
    int stockQuantity,
    double averageRating,
    int salesCount,
    String reason
) {}
