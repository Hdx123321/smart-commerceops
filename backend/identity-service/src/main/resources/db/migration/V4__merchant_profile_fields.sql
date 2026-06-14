ALTER TABLE user_accounts
  ADD COLUMN merchant_name VARCHAR(160) NULL,
  ADD COLUMN merchant_description VARCHAR(800) NULL,
  ADD COLUMN merchant_contact VARCHAR(160) NULL,
  ADD COLUMN merchant_address VARCHAR(300) NULL;

UPDATE user_accounts
SET merchant_name = CONCAT(username, ' Store'),
    merchant_contact = email
WHERE role = 'MERCHANT' AND merchant_name IS NULL;
