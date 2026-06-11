package com.smartcommerce.order.api;

import com.smartcommerce.order.domain.CommerceOrder;
import com.smartcommerce.order.domain.OrderStatus;
import com.smartcommerce.order.domain.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
    Long id,
    Long userId,
    OrderStatus status,
    PaymentStatus paymentStatus,
    BigDecimal totalAmount,
    String shippingAddress,
    String phoneNumber,
    Instant createdAt,
    List<OrderLineResponse> lines
) {
  public static OrderResponse from(CommerceOrder order) {
    return new OrderResponse(
        order.getId(),
        order.getUserId(),
        order.getStatus(),
        order.getPaymentStatus(),
        order.getTotalAmount(),
        order.getShippingAddress(),
        order.getPhoneNumber(),
        order.getCreatedAt(),
        order.getLines().stream().map(OrderLineResponse::from).toList()
    );
  }
}
