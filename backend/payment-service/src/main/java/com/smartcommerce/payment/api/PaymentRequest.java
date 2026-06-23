package com.smartcommerce.payment.api;

import jakarta.validation.constraints.NotNull;

public record PaymentRequest(
    @NotNull Long orderId,
    String paymentMethod
) {
}
