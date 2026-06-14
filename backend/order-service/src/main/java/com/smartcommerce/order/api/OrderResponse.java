package com.smartcommerce.order.api;

import com.smartcommerce.order.domain.CommerceOrder;
import com.smartcommerce.order.domain.AfterSalesCase;
import com.smartcommerce.order.domain.AfterSalesStatus;
import com.smartcommerce.order.domain.AfterSalesType;
import com.smartcommerce.order.domain.OrderStatus;
import com.smartcommerce.order.domain.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
    Long id,
    Long userId,
    Long merchantId,
    String merchantName,
    OrderStatus status,
    PaymentStatus paymentStatus,
    BigDecimal totalAmount,
    String shippingAddress,
    String phoneNumber,
    String paymentMethod,
    Instant paidAt,
    Instant createdAt,
    Instant updatedAt,
    Long latestAfterSalesCaseId,
    AfterSalesType latestAfterSalesType,
    AfterSalesStatus latestAfterSalesStatus,
    List<OrderLineResponse> lines
) {
  public static OrderResponse from(CommerceOrder order) {
    AfterSalesCase latestAfterSalesCase = order.getAfterSalesCases().stream()
        .filter(afterSalesCase -> afterSalesCase.getType() != AfterSalesType.CONTACT_MERCHANT)
        .max((left, right) -> left.getCreatedAt().compareTo(right.getCreatedAt()))
        .orElse(null);
    return new OrderResponse(
        order.getId(),
        order.getUserId(),
        order.getMerchantId(),
        order.getMerchantName(),
        order.getStatus(),
        order.getPaymentStatus(),
        order.getTotalAmount(),
        order.getShippingAddress(),
        order.getPhoneNumber(),
        order.getPaymentMethod(),
        order.getPaidAt(),
        order.getCreatedAt(),
        order.getUpdatedAt(),
        latestAfterSalesCase == null ? null : latestAfterSalesCase.getId(),
        latestAfterSalesCase == null ? null : latestAfterSalesCase.getType(),
        latestAfterSalesCase == null ? null : latestAfterSalesCase.getStatus(),
        order.getLines().stream().map(OrderLineResponse::from).toList()
    );
  }
}
