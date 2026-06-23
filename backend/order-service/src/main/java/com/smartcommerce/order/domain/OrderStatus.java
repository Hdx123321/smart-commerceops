package com.smartcommerce.order.domain;

public enum OrderStatus {
  PENDING_PAYMENT,
  PENDING_SHIPMENT,
  PENDING_RECEIPT,
  COMPLETED,
  AFTER_SALES,
  CANCELLED
}
