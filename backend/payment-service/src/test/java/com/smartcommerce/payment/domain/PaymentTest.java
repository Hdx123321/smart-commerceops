package com.smartcommerce.payment.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class PaymentTest {
  @Test
  void newPaymentStartsProcessing() {
    Payment payment = new Payment(1L, 2L, BigDecimal.valueOf(19.99), "Card");

    assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PROCESSING);
    assertThat(payment.getCompletedAt()).isNull();
  }

  @Test
  void markSuccessIsIdempotent() {
    Payment payment = new Payment(1L, 2L, BigDecimal.valueOf(19.99), "Card");

    payment.markSuccess();
    payment.markSuccess();

    assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
    assertThat(payment.getCompletedAt()).isNotNull();
  }

  @Test
  void successfulPaymentCannotBeFailed() {
    Payment payment = new Payment(1L, 2L, BigDecimal.valueOf(19.99), "Card");

    payment.markSuccess();

    assertThatThrownBy(payment::markFailed)
        .isInstanceOf(IllegalStateException.class);
  }
}
