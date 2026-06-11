package com.smartcommerce.analytics.api;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummary(
    BigDecimal gmv,
    long orderCount,
    BigDecimal averageOrderValue,
    long lowStockCount,
    List<TopProduct> topProducts,
    List<InventoryRecommendation> inventoryRecommendations
) {
}
