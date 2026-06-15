package com.smartcommerce.catalog.api;

import com.smartcommerce.catalog.domain.Product;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

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
    List<String> imageUrls,
    Long merchantId,
    String merchantName,
    String merchantDescription,
    String merchantContact,
    double averageRating,
    long ratingCount
) implements Serializable {
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
        Product.parseImageUrls(product.getImageUrl()),
        product.getMerchantId(),
        product.getMerchantName(),
        product.getMerchantDescription(),
        product.getMerchantContact(),
        Math.round(product.getAverageRating() * 10.0) / 10.0,
        product.getRatingCount()
    );
  }
}
