CREATE INDEX idx_products_active_category_created ON products(active, category, created_at);
CREATE INDEX idx_products_merchant_created ON products(merchant_id, created_at);
CREATE INDEX idx_products_stock_threshold ON products(stock_quantity, low_stock_threshold);
CREATE INDEX idx_product_reviews_product_created ON product_reviews(product_id, created_at);
