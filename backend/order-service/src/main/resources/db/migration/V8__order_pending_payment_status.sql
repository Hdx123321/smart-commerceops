UPDATE orders
SET status = 'PENDING_PAYMENT'
WHERE status = 'PENDING_SHIPMENT'
  AND payment_status = 'UNPAID';
