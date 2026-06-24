package com.smartcommerce.catalog.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductReviewReplyRequest(
    @NotBlank @Size(max = 1000) String reply
) {
}
