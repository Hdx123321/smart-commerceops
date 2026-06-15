DELETE FROM cart_items
WHERE id IN (
  SELECT id FROM (
    SELECT ci1.id
    FROM cart_items ci1
    JOIN cart_items ci2
      ON ci1.user_id = ci2.user_id
     AND ci1.product_id = ci2.product_id
     AND ci1.id > ci2.id
  ) duplicate_cart_items
);

ALTER TABLE cart_items
  ADD CONSTRAINT uk_cart_items_user_product UNIQUE (user_id, product_id);
