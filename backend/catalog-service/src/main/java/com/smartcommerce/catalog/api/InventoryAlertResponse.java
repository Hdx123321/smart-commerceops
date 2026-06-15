package com.smartcommerce.catalog.api;

import java.io.Serializable;

public record InventoryAlertResponse(Long productId, String productName, int stockQuantity, int lowStockThreshold, int recommendedRestock) implements Serializable {
}
