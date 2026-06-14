ALTER TABLE orders
  ADD COLUMN payment_method VARCHAR(120) NULL,
  ADD COLUMN paid_at TIMESTAMP NULL;

UPDATE orders
SET payment_method = 'Profile payment method',
    paid_at = created_at,
    payment_status = 'PAID'
WHERE paid_at IS NULL;

ALTER TABLE order_lines
  ADD COLUMN image_urls TEXT NULL,
  ADD COLUMN merchant_id BIGINT NULL,
  ADD COLUMN merchant_name VARCHAR(160) NULL;
