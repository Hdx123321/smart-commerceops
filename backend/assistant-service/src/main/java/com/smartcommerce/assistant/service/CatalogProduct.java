package com.smartcommerce.assistant.service;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO mirroring catalog-service ProductResponse fields assistant-service needs.
 */
public record CatalogProduct(
    Long id,
    String name,
    String category,
    String description,
    BigDecimal price,
    int stockQuantity,
    int lowStockThreshold,
    int salesCount,
    boolean active,
    List<String> imageUrls,
    Long merchantId,
    String merchantName,
    String merchantDescription,
    String merchantContact,
    double averageRating,
    long ratingCount
) {}
