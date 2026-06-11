package com.smartcommerce.catalog.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class ProductTest {
  @Test
  void reserveStockReducesInventoryAndIncrementsSales() throws Exception {
    Class<?> productClass = Class.forName("com.smartcommerce.catalog.domain.Product");
    Object product = productClass
        .getConstructor(String.class, String.class, String.class, BigDecimal.class, int.class, int.class, String.class)
        .newInstance("Coffee", "Groceries", "Beans", BigDecimal.valueOf(12.50), 10, 3, null);

    productClass.getMethod("reserve", int.class).invoke(product, 4);

    assertThat(productClass.getMethod("getStockQuantity").invoke(product)).isEqualTo(6);
    assertThat(productClass.getMethod("getSalesCount").invoke(product)).isEqualTo(4);
  }

  @Test
  void reserveStockRejectsInsufficientInventory() throws Exception {
    Class<?> productClass = Class.forName("com.smartcommerce.catalog.domain.Product");
    Object product = productClass
        .getConstructor(String.class, String.class, String.class, BigDecimal.class, int.class, int.class, String.class)
        .newInstance("Coffee", "Groceries", "Beans", BigDecimal.valueOf(12.50), 2, 3, null);

    assertThatThrownBy(() -> productClass.getMethod("reserve", int.class).invoke(product, 4))
        .hasRootCauseInstanceOf(IllegalStateException.class);
  }
}
