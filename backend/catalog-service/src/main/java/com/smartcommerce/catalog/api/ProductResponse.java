package com.smartcommerce.catalog.api;

import com.smartcommerce.catalog.domain.Product;
import java.math.BigDecimal;

public record ProductResponse(
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
  public static ProductResponse from(Product product) {
    return new ProductResponse(
        product.getId(),
        product.getName(),
        product.getCategory(),
        product.getDescription(),
        product.getPrice(),
        product.getStockQuantity(),
        product.getLowStockThreshold(),
        product.getSalesCount(),
        product.isActive(),
        product.getImageUrl(),
        Math.round(product.getAverageRating() * 10.0) / 10.0,
        product.getRatingCount()
    );
  }
}
