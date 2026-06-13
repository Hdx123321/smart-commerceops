package com.smartcommerce.order.repository;

import com.smartcommerce.order.domain.CommerceOrder;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommerceOrderRepository extends JpaRepository<CommerceOrder, Long> {
  List<CommerceOrder> findByUserIdOrderByCreatedAtDesc(Long userId);
  List<CommerceOrder> findAllByOrderByCreatedAtDesc();
}
