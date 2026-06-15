package com.smartcommerce.order.api;

import com.smartcommerce.order.domain.AfterSalesCase;
import com.smartcommerce.order.domain.AfterSalesStatus;
import com.smartcommerce.order.domain.AfterSalesType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AfterSalesResponse(
    Long id,
    Long orderId,
    Long userId,
    Long merchantId,
    String merchantName,
    AfterSalesType type,
    AfterSalesStatus status,
    String reason,
    String description,
    String contactMethod,
    String merchantNote,
    BigDecimal orderTotalAmount,
    String shippingAddress,
    String phoneNumber,
    Instant createdAt,
    Instant updatedAt,
    List<OrderLineResponse> lines
) {
  public static AfterSalesResponse from(AfterSalesCase afterSalesCase) {
    return new AfterSalesResponse(
        afterSalesCase.getId(),
        afterSalesCase.getOrder().getId(),
        afterSalesCase.getUserId(),
        afterSalesCase.getMerchantId(),
        afterSalesCase.getMerchantName(),
        afterSalesCase.getType(),
        afterSalesCase.getStatus(),
        afterSalesCase.getReason(),
        afterSalesCase.getDescription(),
        afterSalesCase.getContactMethod(),
        afterSalesCase.getMerchantNote(),
        afterSalesCase.getOrder().getTotalAmount(),
        afterSalesCase.getOrder().getShippingAddress(),
        afterSalesCase.getOrder().getPhoneNumber(),
        afterSalesCase.getCreatedAt(),
        afterSalesCase.getUpdatedAt(),
        afterSalesCase.getOrder().getLines().stream().map(OrderLineResponse::from).toList()
    );
  }
}
