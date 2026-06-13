ALTER TABLE products
  ADD COLUMN merchant_id BIGINT,
  ADD COLUMN merchant_name VARCHAR(160) NOT NULL DEFAULT 'Smart CommerceOps',
  ADD COLUMN merchant_description VARCHAR(800),
  ADD COLUMN merchant_contact VARCHAR(160);

CREATE TABLE product_reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  username VARCHAR(80) NOT NULL,
  rating INT NOT NULL,
  comment VARCHAR(1000),
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_product_reviews_product FOREIGN KEY (product_id) REFERENCES products(id)
);
