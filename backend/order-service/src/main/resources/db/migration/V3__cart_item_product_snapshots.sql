ALTER TABLE cart_items
  ADD COLUMN image_urls TEXT NULL,
  ADD COLUMN merchant_id BIGINT NULL,
  ADD COLUMN merchant_name VARCHAR(160) NULL;
