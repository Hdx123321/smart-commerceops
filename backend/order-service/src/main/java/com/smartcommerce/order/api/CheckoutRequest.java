package com.smartcommerce.order.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CheckoutRequest(
    @NotNull Long userId,
    @NotBlank String shippingAddress,
    @NotBlank String phoneNumber,
    String paymentMethod,
    List<Long> cartItemIds
) {
}
