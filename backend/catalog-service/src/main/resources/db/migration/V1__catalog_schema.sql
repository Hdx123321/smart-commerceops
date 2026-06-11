CREATE TABLE products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description VARCHAR(800),
  price DECIMAL(12,2) NOT NULL,
  stock_quantity INT NOT NULL,
  low_stock_threshold INT NOT NULL,
  sales_count INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  image_url VARCHAR(1000),
  average_rating DOUBLE NOT NULL DEFAULT 0,
  rating_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL
);

INSERT INTO products (name, category, description, price, stock_quantity, low_stock_threshold, sales_count, active, image_url, average_rating, rating_count, created_at) VALUES
('Coke Zero 12-pack', 'Beverages', 'Low sugar canned drink bundle for office pantry replenishment.', 8.90, 32, 10, 45, TRUE, '/images/products/coke.png', 4.6, 12, CURRENT_TIMESTAMP),
('Fanta Orange 12-pack', 'Beverages', 'Popular orange soda bundle with high repeat purchase.', 8.50, 8, 12, 38, TRUE, '/images/products/fanta.png', 4.3, 9, CURRENT_TIMESTAMP),
('Reusable Tote Bag', 'Lifestyle', 'Eco-friendly tote for daily shopping.', 5.90, 18, 8, 16, TRUE, NULL, 4.8, 6, CURRENT_TIMESTAMP),
('Premium Coffee Beans', 'Groceries', 'Medium roast beans for subscription customers.', 18.90, 6, 10, 28, TRUE, NULL, 4.7, 15, CURRENT_TIMESTAMP);
