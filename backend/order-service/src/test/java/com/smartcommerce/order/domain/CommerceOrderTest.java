package com.smartcommerce.order.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class CommerceOrderTest {
  @Test
  void newOrderStartsPendingShipment() {
    CommerceOrder order = new CommerceOrder(1L, 10L, "Merchant", "123 Test Street", "91234567", "Card");

    assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_SHIPMENT);
  }

  @Test
  void orderCanBeShippedAndConfirmed() {
    CommerceOrder order = new CommerceOrder(1L, 10L, "Merchant", "123 Test Street", "91234567", "Card");
    order.addLine(10L, "Coffee", 1, BigDecimal.valueOf(12.50));

    order.markShipped();
    assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_RECEIPT);

    order.confirmReceipt();
    assertThat(order.getStatus()).isEqualTo(OrderStatus.COMPLETED);
  }

  @Test
  void receiptCannotBeConfirmedBeforeShipment() {
    CommerceOrder order = new CommerceOrder(1L, 10L, "Merchant", "123 Test Street", "91234567", "Card");

    assertThatThrownBy(order::confirmReceipt)
        .isInstanceOf(IllegalStateException.class);
  }

  @Test
  void afterSalesMovesOrderToAfterSalesStatus() {
    CommerceOrder order = new CommerceOrder(1L, 10L, "Merchant", "123 Test Street", "91234567", "Card");

    order.requestAfterSales();

    assertThat(order.getStatus()).isEqualTo(OrderStatus.AFTER_SALES);
  }
}
