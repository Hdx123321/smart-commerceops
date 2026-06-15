CREATE TABLE after_sales_cases (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  merchant_id BIGINT NULL,
  merchant_name VARCHAR(160) NOT NULL,
  type VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL,
  reason VARCHAR(120) NOT NULL,
  description VARCHAR(1000) NULL,
  contact_method VARCHAR(160) NULL,
  merchant_note VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_after_sales_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX idx_after_sales_order ON after_sales_cases(order_id);
CREATE INDEX idx_after_sales_user ON after_sales_cases(user_id);
CREATE INDEX idx_after_sales_merchant ON after_sales_cases(merchant_id);
