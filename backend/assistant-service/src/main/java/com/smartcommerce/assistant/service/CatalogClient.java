package com.smartcommerce.assistant.service;

import com.smartcommerce.assistant.api.AssistantRecommendRequest;
import java.util.Comparator;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class CatalogClient {

  private static final Logger log = LoggerFactory.getLogger(CatalogClient.class);
  private final RestClient restClient;
  private final int maxCandidates;

  public CatalogClient(@Qualifier("catalogRestClient") RestClient restClient,
                       @Value("${assistant.max-candidates:20}") int maxCandidates) {
    this.restClient = restClient;
    this.maxCandidates = maxCandidates;
  }

  /**
   * Fetch active products from catalog-service, then filter in-memory by budget and limit.
   * Does NOT modify catalog-service — uses only existing /products?category=&search= params.
   */
  public List<CatalogProduct> fetchCandidates(AssistantRecommendRequest request) {
    log.info("Fetching candidates: category={}, search={}, maxBudget={}, limit={}",
        request.category(), request.query(), request.maxBudget(), request.limit());

    PageResponse<CatalogProduct> response = restClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/products")
            .queryParam("category", request.category())
            .queryParam("search", request.query())
            .queryParam("size", Math.max(maxCandidates, request.limit()))
            .build())
        .retrieve()
        .body(new ParameterizedTypeReference<PageResponse<CatalogProduct>>() {});

    if (response == null || response.content() == null) {
      return List.of();
    }
    List<CatalogProduct> products = response.content();

    // In-memory: filter by maxBudget
    if (request.maxBudget() != null) {
      products = products.stream()
          .filter(p -> p.price().compareTo(request.maxBudget()) <= 0)
          .toList();
    }

    // In-memory: sort by salesCount desc + rating desc, then limit
    int limit = Math.min(request.limit() > 0 ? request.limit() : 5, maxCandidates);
    products = products.stream()
        .sorted(Comparator.comparingInt(CatalogProduct::salesCount)
            .thenComparingDouble(CatalogProduct::averageRating)
            .reversed())
        .limit(limit)
        .toList();

    log.info("Returning {} candidates (after filtering)", products.size());
    return products;
  }
}
