package com.smartcommerce.analytics.api;

import java.math.BigDecimal;

public record OrderSnapshot(Long id, Long userId, String status, String paymentStatus, BigDecimal totalAmount) {
}
