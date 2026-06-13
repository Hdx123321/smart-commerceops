package com.smartcommerce.order.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class CommerceOrderTest {
  @Test
  void newOrderStartsPendingShipment() {
    CommerceOrder order = new CommerceOrder(1L, "123 Test Street", "91234567");

    assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_SHIPMENT);
  }

  @Test
  void orderCanBeShippedAndConfirmed() {
    CommerceOrder order = new CommerceOrder(1L, "123 Test Street", "91234567");
    order.addLine(10L, "Coffee", 1, BigDecimal.valueOf(12.50));

    order.markShipped();
    assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_RECEIPT);

    order.confirmReceipt();
    assertThat(order.getStatus()).isEqualTo(OrderStatus.COMPLETED);
  }

  @Test
  void receiptCannotBeConfirmedBeforeShipment() {
    CommerceOrder order = new CommerceOrder(1L, "123 Test Street", "91234567");

    assertThatThrownBy(order::confirmReceipt)
        .isInstanceOf(IllegalStateException.class);
  }
}
