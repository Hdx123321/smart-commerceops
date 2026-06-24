package com.smartcommerce.catalog.api;

public record ReviewEligibilityResponse(
    Long orderId,
    Long orderLineId,
    Long productId,
    Long userId,
    String username
) {
}
