package com.smartcommerce.order.api;

import com.smartcommerce.order.domain.AfterSalesType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AfterSalesRequest(
    @NotNull Long userId,
    @NotNull AfterSalesType type,
    @NotBlank String reason,
    String description,
    String contactMethod
) {
}
