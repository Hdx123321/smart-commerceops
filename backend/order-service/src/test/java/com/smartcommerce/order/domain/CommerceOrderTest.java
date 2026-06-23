package com.smartcommerce.order.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class CommerceOrderTest {
  @Test
  void newOrderStartsPendingPayment() {
    CommerceOrder order = new CommerceOrder(1L, 10L, "Merchant", "123 Test Street", "91234567", "Card");

    assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);
    assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.UNPAID);
    assertThat(order.getPaidAt()).isNull();
  }

  @Test
  void orderCanBeShippedAndConfirmed() {
    CommerceOrder order = new CommerceOrder(1L, 10L, "Merchant", "123 Test Street", "91234567", "Card");
    order.addLine(10L, "Coffee", 1, BigDecimal.valueOf(12.50));
    order.markPaid();
    assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_SHIPMENT);

    order.markShipped();
    assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_RECEIPT);

    order.confirmReceipt();
    assertThat(order.getStatus()).isEqualTo(OrderStatus.COMPLETED);
  }

  @Test
  void pendingPaymentOrderCannotBeShipped() {
    CommerceOrder order = new CommerceOrder(1L, 10L, "Merchant", "123 Test Street", "91234567", "Card");

    assertThatThrownBy(order::markShipped)
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("pending shipment");
  }

  @Test
  void markPaidIsIdempotent() {
    CommerceOrder order = new CommerceOrder(1L, 10L, "Merchant", "123 Test Street", "91234567", "Card");

    order.markPaid();
    assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    assertThat(order.getPaidAt()).isNotNull();

    order.markPaid();
    assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
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
    order.markPaid();

    order.requestAfterSales();

    assertThat(order.getStatus()).isEqualTo(OrderStatus.AFTER_SALES);
  }

  @Test
  void pendingPaymentOrderCanBeCancelled() {
    CommerceOrder order = new CommerceOrder(1L, 10L, "Merchant", "123 Test Street", "91234567", "Card");

    order.cancelPendingPayment();

    assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
  }

  @Test
  void paidOrderCannotBeCancelledAsPendingPayment() {
    CommerceOrder order = new CommerceOrder(1L, 10L, "Merchant", "123 Test Street", "91234567", "Card");
    order.markPaid();

    assertThatThrownBy(order::cancelPendingPayment)
        .isInstanceOf(IllegalStateException.class);
  }
}
