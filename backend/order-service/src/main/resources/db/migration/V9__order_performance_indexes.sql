CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);
CREATE INDEX idx_orders_merchant_created ON orders(merchant_id, created_at);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
CREATE INDEX idx_after_sales_user_created ON after_sales_cases(user_id, created_at);
CREATE INDEX idx_after_sales_merchant_created ON after_sales_cases(merchant_id, created_at);
CREATE INDEX idx_after_sales_order_created ON after_sales_cases(order_id, created_at);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
