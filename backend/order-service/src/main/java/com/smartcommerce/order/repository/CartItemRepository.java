package com.smartcommerce.order.repository;

import com.smartcommerce.order.domain.CartItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
  List<CartItem> findByUserId(Long userId);
  List<CartItem> findByUserIdAndIdIn(Long userId, List<Long> ids);
  Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);
  void deleteByUserId(Long userId);
}
