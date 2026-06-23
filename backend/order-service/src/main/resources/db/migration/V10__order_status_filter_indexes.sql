CREATE INDEX idx_orders_user_status_created ON orders(user_id, status, created_at);
CREATE INDEX idx_orders_merchant_status_created ON orders(merchant_id, status, created_at);
