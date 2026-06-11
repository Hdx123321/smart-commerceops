package com.smartcommerce.order.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AddCartItemRequest(@NotNull Long userId, @NotNull Long productId, @Min(1) int quantity) {
}
