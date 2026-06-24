package com.smartcommerce.order.api;

public record ReviewEligibilityResponse(
    Long orderId,
    Long orderLineId,
    Long productId,
    Long userId,
    String username
) {
}
