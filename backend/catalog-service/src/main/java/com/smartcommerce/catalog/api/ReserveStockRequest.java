package com.smartcommerce.catalog.api;

import jakarta.validation.constraints.Min;

public record ReserveStockRequest(@Min(1) int quantity) {
}
