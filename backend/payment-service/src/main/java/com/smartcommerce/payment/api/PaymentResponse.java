package com.smartcommerce.payment.api;

import com.smartcommerce.payment.domain.Payment;
import com.smartcommerce.payment.domain.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
    Long id,
    Long orderId,
    Long userId,
    BigDecimal amount,
    String paymentMethod,
    PaymentStatus status,
    Instant createdAt,
    Instant completedAt
) {
  static PaymentResponse from(Payment payment) {
    return new PaymentResponse(
        payment.getId(),
        payment.getOrderId(),
        payment.getUserId(),
        payment.getAmount(),
        payment.getPaymentMethod(),
        payment.getStatus(),
        payment.getCreatedAt(),
        payment.getCompletedAt()
    );
  }
}
