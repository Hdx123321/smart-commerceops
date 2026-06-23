package com.smartcommerce.assistant.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record AssistantRecommendRequest(
    @NotBlank(message = "query is required")
    @Size(max = 500, message = "query must be at most 500 characters")
    String query,

    String category,

    @Min(0)
    BigDecimal maxBudget,

    @Min(1)
    @Max(10)
    int limit
) {
  public AssistantRecommendRequest {
    if (limit < 1) {
      limit = 5;
    }
  }
}
