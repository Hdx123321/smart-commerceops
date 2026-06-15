ALTER TABLE orders
  ADD COLUMN merchant_id BIGINT NULL,
  ADD COLUMN merchant_name VARCHAR(160) NOT NULL DEFAULT 'Smart CommerceOps';

UPDATE orders
SET merchant_name = 'Smart CommerceOps'
WHERE merchant_name IS NULL OR merchant_name = '';
