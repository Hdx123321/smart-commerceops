package com.smartcommerce.order.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CheckoutRequest(@NotNull Long userId, @NotBlank String shippingAddress, @NotBlank String phoneNumber) {
}
