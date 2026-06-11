package com.smartcommerce.catalog.api;

public record InventoryAlertResponse(Long productId, String productName, int stockQuantity, int lowStockThreshold, int recommendedRestock) {
}
