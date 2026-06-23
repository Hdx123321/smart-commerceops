package com.smartcommerce.payment.api;

import java.math.BigDecimal;

public record OrderVerificationResponse(
    Long id,
    Long userId,
    String status,
    String paymentStatus,
    BigDecimal totalAmount,
    String paymentMethod
) {
}
