package com.smartcommerce.assistant.api;

import java.math.BigDecimal;
import java.util.List;

public record AssistantRecommendResult(
    String summary,
    List<RecommendationItem> recommendations
) {}
