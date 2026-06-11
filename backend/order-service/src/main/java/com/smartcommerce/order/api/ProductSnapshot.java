package com.smartcommerce.order.api;

import java.math.BigDecimal;

public record ProductSnapshot(Long id, String name, String category, String description, BigDecimal price, int stockQuantity) {
}
