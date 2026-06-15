package com.smartcommerce.order.api;

public record AfterSalesDecisionRequest(
    Long merchantId,
    String note
) {
}
