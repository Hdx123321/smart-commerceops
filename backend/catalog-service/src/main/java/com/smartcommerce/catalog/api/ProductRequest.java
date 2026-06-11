package com.smartcommerce.catalog.api;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ProductRequest(
    @NotBlank String name,
    @NotBlank String category,
    String description,
    @NotNull @DecimalMin("0.01") BigDecimal price,
    @Min(0) int stockQuantity,
    @Min(0) int lowStockThreshold,
    boolean active,
    String imageUrl
) {
}
