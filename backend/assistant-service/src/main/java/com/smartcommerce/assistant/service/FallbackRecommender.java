package com.smartcommerce.assistant.service;

import com.smartcommerce.assistant.api.AssistantRecommendRequest;
import com.smartcommerce.assistant.api.AssistantRecommendResult;
import com.smartcommerce.assistant.api.RecommendationItem;
import java.util.Comparator;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Rule-based fallback when LLM is unavailable.
 * Filters by query keywords in name/description/category, sorts by sales + rating.
 */
@Service
public class FallbackRecommender {

  private static final Logger log = LoggerFactory.getLogger(FallbackRecommender.class);

  public AssistantRecommendResult recommend(List<CatalogProduct> candidates,
                                             AssistantRecommendRequest request) {
    log.info("Using rule-based fallback for query='{}'", request.query());

    String queryLower = request.query().toLowerCase();
    int limit = request.limit() > 0 ? request.limit() : 5;

    List<CatalogProduct> matched = candidates.stream()
        .filter(p -> matchesQuery(p, queryLower))
        .sorted(Comparator.comparingInt(CatalogProduct::salesCount)
            .thenComparingDouble(CatalogProduct::averageRating)
            .reversed())
        .limit(limit)
        .toList();

    if (matched.isEmpty()) {
      // Return top-selling products as fallback
      matched = candidates.stream()
          .sorted(Comparator.comparingInt(CatalogProduct::salesCount)
              .thenComparingDouble(CatalogProduct::averageRating)
              .reversed())
          .limit(limit)
          .toList();
    }

    List<RecommendationItem> items = matched.stream()
        .map(p -> new RecommendationItem(
            p.id(), p.name(), p.price(), p.category(), p.imageUrls(),
            p.merchantName(), p.stockQuantity(), p.averageRating(), p.salesCount(),
            buildReason(p, queryLower)
        ))
        .toList();

    String summary = matched.isEmpty()
        ? "抱歉，没有找到符合您需求的商品。以下是热门商品推荐。"
        : "根据您的需求，为您找到以下商品。";

    return new AssistantRecommendResult(summary, items);
  }

  private boolean matchesQuery(CatalogProduct p, String queryLower) {
    if (p.name() != null && p.name().toLowerCase().contains(queryLower)) return true;
    if (p.description() != null && p.description().toLowerCase().contains(queryLower)) return true;
    if (p.category() != null && p.category().toLowerCase().contains(queryLower)) return true;
    // Try individual words
    for (String word : queryLower.split("\\s+")) {
      if (word.length() < 2) continue;
      if (p.name() != null && p.name().toLowerCase().contains(word)) return true;
      if (p.description() != null && p.description().toLowerCase().contains(word)) return true;
      if (p.category() != null && p.category().toLowerCase().contains(word)) return true;
    }
    return false;
  }

  private String buildReason(CatalogProduct p, String queryLower) {
    StringBuilder sb = new StringBuilder();
    if (p.averageRating() >= 4.0) sb.append("高评分");
    if (p.salesCount() >= 50) sb.append(sb.isEmpty() ? "热销" : "、热销");
    if (p.stockQuantity() > 0 && p.stockQuantity() <= p.lowStockThreshold()) sb.append(sb.isEmpty() ? "库存紧张" : "、库存紧张");
    if (sb.isEmpty()) sb.append("价格合理");
    return sb.append("，值得推荐").toString();
  }
}
