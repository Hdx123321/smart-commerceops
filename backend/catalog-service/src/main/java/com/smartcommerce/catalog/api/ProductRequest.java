package com.smartcommerce.catalog.api;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

public record ProductRequest(
    @NotBlank String name,
    @NotBlank String category,
    String customCategory,
    String description,
    @NotNull @DecimalMin("0.01") BigDecimal price,
    @Min(0) int stockQuantity,
    @Min(0) int lowStockThreshold,
    Boolean active,
    List<String> imageUrls,
    Long merchantId,
    String merchantName,
    String merchantDescription,
    String merchantContact
) {
  private static final String OTHER_CATEGORY = "Other";
  private static final Set<String> PRESET_CATEGORIES = Set.of(
      "Beverages",
      "Groceries",
      "Lifestyle",
      "Electronics",
      "Home",
      "Apparel"
  );

  public String resolvedCategory() {
    if (OTHER_CATEGORY.equalsIgnoreCase(category)) {
      if (customCategory == null || customCategory.isBlank()) {
        throw new IllegalArgumentException("Custom category is required when category is Other");
      }
      return customCategory.trim();
    }
    return PRESET_CATEGORIES.stream()
        .filter(preset -> preset.equalsIgnoreCase(category))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Unsupported product category"));
  }

  public boolean activeOrDefault() {
    return active == null || active;
  }

  public String merchantNameOrDefault() {
    return merchantName == null || merchantName.isBlank() ? "Smart CommerceOps" : merchantName.trim();
  }
}
