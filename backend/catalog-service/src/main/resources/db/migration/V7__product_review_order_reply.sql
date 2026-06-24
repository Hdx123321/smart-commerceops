ALTER TABLE product_reviews
  ADD COLUMN order_id BIGINT NULL,
  ADD COLUMN order_line_id BIGINT NULL,
  ADD COLUMN merchant_reply VARCHAR(1000) NULL,
  ADD COLUMN merchant_replied_at TIMESTAMP NULL;

CREATE UNIQUE INDEX ux_product_reviews_order_line ON product_reviews(order_line_id);
