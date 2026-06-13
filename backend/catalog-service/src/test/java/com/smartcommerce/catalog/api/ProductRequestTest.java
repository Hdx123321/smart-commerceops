package com.smartcommerce.catalog.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class ProductRequestTest {
  @Test
  void activeDefaultsToTrueWhenOmitted() {
    ProductRequest request = new ProductRequest(
        "Coffee",
        "Groceries",
        null,
        "Beans",
        BigDecimal.valueOf(12.50),
        10,
        3,
        null,
        null,
        null,
        null,
        null,
        null
    );

    assertThat(request.activeOrDefault()).isTrue();
  }

  @Test
  void activeCanBeExplicitlyDisabled() {
    ProductRequest request = new ProductRequest(
        "Coffee",
        "Groceries",
        null,
        "Beans",
        BigDecimal.valueOf(12.50),
        10,
        3,
        false,
        null,
        null,
        null,
        null,
        null
    );

    assertThat(request.activeOrDefault()).isFalse();
  }

  @Test
  void presetCategoryResolvesToCanonicalValue() {
    ProductRequest request = new ProductRequest(
        "Coffee",
        "groceries",
        null,
        "Beans",
        BigDecimal.valueOf(12.50),
        10,
        3,
        true,
        null,
        null,
        null,
        null,
        null
    );

    assertThat(request.resolvedCategory()).isEqualTo("Groceries");
  }

  @Test
  void otherCategoryUsesCustomValue() {
    ProductRequest request = new ProductRequest(
        "Coffee",
        "Other",
        "Office Supplies",
        "Beans",
        BigDecimal.valueOf(12.50),
        10,
        3,
        true,
        null,
        null,
        null,
        null,
        null
    );

    assertThat(request.resolvedCategory()).isEqualTo("Office Supplies");
  }

  @Test
  void merchantNameDefaultsWhenOmitted() {
    ProductRequest request = new ProductRequest(
        "Coffee",
        "Groceries",
        null,
        "Beans",
        BigDecimal.valueOf(12.50),
        10,
        3,
        true,
        null,
        null,
        null,
        null,
        null
    );

    assertThat(request.merchantNameOrDefault()).isEqualTo("Smart CommerceOps");
  }
}
