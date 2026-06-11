package com.smartcommerce.analytics.api;

public record TopProduct(Long productId, String name, int salesCount, double averageRating) {
}
