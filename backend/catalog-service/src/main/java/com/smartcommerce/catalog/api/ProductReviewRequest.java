package com.smartcommerce.catalog.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductReviewRequest(
    @NotNull Long orderId,
    @NotNull Long orderLineId,
    @Min(1) @Max(5) int rating,
    @Size(max = 1000) String comment
) {
}
