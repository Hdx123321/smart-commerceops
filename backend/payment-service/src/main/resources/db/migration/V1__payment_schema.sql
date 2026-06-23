CREATE TABLE payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(120) NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NULL,
  version BIGINT NOT NULL,
  CONSTRAINT uk_payments_order UNIQUE (order_id)
);

CREATE INDEX idx_payments_user ON payments(user_id);
