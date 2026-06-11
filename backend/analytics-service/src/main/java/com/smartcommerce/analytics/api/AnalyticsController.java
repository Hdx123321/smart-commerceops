package com.smartcommerce.analytics.api;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@RestController
public class AnalyticsController {
  private final RestClient restClient;
  private final String catalogUrl;
  private final String orderUrl;

  public AnalyticsController(RestClient restClient,
                             @Value("${services.catalog-url:http://localhost:8083}") String catalogUrl,
                             @Value("${services.order-url:http://localhost:8084}") String orderUrl) {
    this.restClient = restClient;
    this.catalogUrl = catalogUrl;
    this.orderUrl = orderUrl;
  }

  @GetMapping("/analytics/dashboard")
  public DashboardSummary dashboard() {
    List<ProductSnapshot> products = Arrays.asList(restClient.get()
        .uri(catalogUrl + "/products")
        .retrieve()
        .body(ProductSnapshot[].class));
    List<OrderSnapshot> orders = Arrays.asList(restClient.get()
        .uri(orderUrl + "/orders")
        .retrieve()
        .body(OrderSnapshot[].class));

    BigDecimal gmv = orders.stream()
        .map(OrderSnapshot::totalAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal aov = orders.isEmpty()
        ? BigDecimal.ZERO
        : gmv.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);

    List<InventoryRecommendation> recommendations = products.stream()
        .filter(product -> product.stockQuantity() <= product.lowStockThreshold())
        .map(product -> new InventoryRecommendation(
            product.id(),
            product.name(),
            product.stockQuantity(),
            product.lowStockThreshold(),
            Math.max(product.lowStockThreshold() * 2 - product.stockQuantity(), 0)
        ))
        .toList();

    List<TopProduct> topProducts = products.stream()
        .sorted(Comparator.comparingInt(ProductSnapshot::salesCount).reversed())
        .limit(5)
        .map(product -> new TopProduct(product.id(), product.name(), product.salesCount(), product.averageRating()))
        .toList();

    return new DashboardSummary(gmv, orders.size(), aov, recommendations.size(), topProducts, recommendations);
  }
}
