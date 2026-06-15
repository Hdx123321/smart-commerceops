package com.smartcommerce.order.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class AfterSalesCaseTest {
  @Test
  void refundOnlyCompletesWhenMerchantApproves() {
    AfterSalesCase afterSalesCase = new AfterSalesCase(order(), AfterSalesType.REFUND_ONLY, "Damaged", null, "email");

    afterSalesCase.approve("Refund approved");

    assertThat(afterSalesCase.getStatus()).isEqualTo(AfterSalesStatus.COMPLETED);
    assertThat(afterSalesCase.getMerchantNote()).isEqualTo("Refund approved");
  }

  @Test
  void returnCompletesOnlyAfterMerchantReceivesReturnedGoods() {
    AfterSalesCase afterSalesCase = new AfterSalesCase(order(), AfterSalesType.RETURN, "Wrong size", null, "phone");

    afterSalesCase.approve("Return approved");
    assertThat(afterSalesCase.getStatus()).isEqualTo(AfterSalesStatus.RETURN_PENDING_RECEIPT);

    afterSalesCase.confirmReturnedGoods("Returned package received");
    assertThat(afterSalesCase.getStatus()).isEqualTo(AfterSalesStatus.COMPLETED);
  }

  @Test
  void exchangeCompletesOnlyAfterCustomerReceivesReplacement() {
    AfterSalesCase afterSalesCase = new AfterSalesCase(order(), AfterSalesType.EXCHANGE, "Wrong color", null, "phone");

    afterSalesCase.approve("Exchange approved");
    assertThat(afterSalesCase.getStatus()).isEqualTo(AfterSalesStatus.RETURN_PENDING_RECEIPT);

    afterSalesCase.confirmReturnedGoods("Returned goods received");
    assertThat(afterSalesCase.getStatus()).isEqualTo(AfterSalesStatus.EXCHANGE_PENDING_SHIPMENT);

    afterSalesCase.shipReplacement("Replacement shipped");
    assertThat(afterSalesCase.getStatus()).isEqualTo(AfterSalesStatus.EXCHANGE_PENDING_RECEIPT);

    afterSalesCase.confirmReplacementReceived();
    assertThat(afterSalesCase.getStatus()).isEqualTo(AfterSalesStatus.COMPLETED);
  }

  @Test
  void replacementCannotShipBeforeReturnedGoodsAreReceived() {
    AfterSalesCase afterSalesCase = new AfterSalesCase(order(), AfterSalesType.EXCHANGE, "Wrong color", null, "phone");
    afterSalesCase.approve("Exchange approved");

    assertThatThrownBy(() -> afterSalesCase.shipReplacement("Too early"))
        .isInstanceOf(IllegalStateException.class);
  }

  private CommerceOrder order() {
    return new CommerceOrder(1L, 10L, "Merchant", "123 Test Street", "91234567", "Card");
  }
}
