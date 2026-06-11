package com.smartcommerce.analytics.api;

public record InventoryRecommendation(Long productId, String productName, int stockQuantity, int lowStockThreshold, int recommendedRestock) {
}
