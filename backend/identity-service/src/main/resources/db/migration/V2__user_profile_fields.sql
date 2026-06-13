ALTER TABLE user_accounts
  ADD COLUMN gender VARCHAR(30),
  ADD COLUMN height_cm INT,
  ADD COLUMN weight_kg INT,
  ADD COLUMN shoe_size DECIMAL(4,1),
  ADD COLUMN shipping_address VARCHAR(500),
  ADD COLUMN payment_method VARCHAR(120);
