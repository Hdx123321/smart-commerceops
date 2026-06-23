package com.smartcommerce.assistant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcommerce.assistant.api.AssistantRecommendRequest;
import com.smartcommerce.assistant.api.AssistantRecommendResult;
import com.smartcommerce.assistant.api.RecommendationItem;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AssistantService {

  private static final Logger log = LoggerFactory.getLogger(AssistantService.class);
  private static final ObjectMapper MAPPER = new ObjectMapper();

  /**
   * Parse LLM JSON response, validate every recommendation against the candidate set,
   * and build the result with full product snapshots for frontend rendering.
   */
  public AssistantRecommendResult parseAndValidate(String llmJson, List<CatalogProduct> candidates,
                                                    AssistantRecommendRequest request) {
    List<RecommendationItem> validated = new ArrayList<>();
    String summary = "";

    try {
      JsonNode root = MAPPER.readTree(llmJson);
      summary = root.path("summary").asText("根据您的需求，为您推荐以下商品。");

      JsonNode recs = root.path("recommendations");
      if (recs.isArray()) {
        for (JsonNode rec : recs) {
          int index = rec.path("productIndex").asInt(-1);
          String reason = rec.path("reason").asText("");

          // Validate productIndex is in range
          if (index < 0 || index >= candidates.size()) {
            log.warn("LLM returned invalid productIndex={}, skipping", index);
            continue;
          }

          CatalogProduct product = candidates.get(index);

          // Validate product is active and in stock
          if (!product.active() || product.stockQuantity() <= 0) {
            log.warn("LLM recommended inactive/out-of-stock product id={}, skipping", product.id());
            continue;
          }

          // Validate maxBudget
          if (request.maxBudget() != null && product.price().compareTo(request.maxBudget()) > 0) {
            log.warn("LLM recommended over-budget product id={} price={}, skipping",
                product.id(), product.price());
            continue;
          }

          validated.add(new RecommendationItem(
              product.id(),
              product.name(),
              product.price(),
              product.category(),
              product.imageUrls(),
              product.merchantName(),
              product.stockQuantity(),
              product.averageRating(),
              product.salesCount(),
              reason
          ));
        }
      }
    } catch (Exception e) {
      log.error("Failed to parse LLM JSON, returning empty: {}", e.getMessage());
      return new AssistantRecommendResult("抱歉，推荐服务暂时出现异常，请稍后再试。", List.of());
    }

    if (validated.isEmpty() && !summary.contains("没有") && !summary.contains("找不到")) {
      summary = "根据您的需求，暂未找到完全匹配的商品。以下是热门商品推荐。";
    }

    return new AssistantRecommendResult(summary, validated);
  }
}
