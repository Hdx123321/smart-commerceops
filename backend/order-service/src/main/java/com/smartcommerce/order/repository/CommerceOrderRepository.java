package com.smartcommerce.order.repository;

import com.smartcommerce.order.domain.CommerceOrder;
import com.smartcommerce.order.domain.OrderStatus;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommerceOrderRepository extends JpaRepository<CommerceOrder, Long> {
  List<CommerceOrder> findByUserIdOrderByCreatedAtDesc(Long userId);
  List<CommerceOrder> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);
  List<CommerceOrder> findAllByOrderByCreatedAtDesc();
  Page<CommerceOrder> findByUserId(Long userId, Pageable pageable);
  Page<CommerceOrder> findByMerchantId(Long merchantId, Pageable pageable);
  Page<CommerceOrder> findByStatus(OrderStatus status, Pageable pageable);
  Page<CommerceOrder> findByUserIdAndStatus(Long userId, OrderStatus status, Pageable pageable);
  Page<CommerceOrder> findByMerchantIdAndStatus(Long merchantId, OrderStatus status, Pageable pageable);
}
