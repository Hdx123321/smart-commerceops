package com.smartcommerce.order.repository;

import com.smartcommerce.order.domain.AfterSalesCase;
import com.smartcommerce.order.domain.AfterSalesStatus;
import com.smartcommerce.order.domain.AfterSalesType;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AfterSalesCaseRepository extends JpaRepository<AfterSalesCase, Long> {
  List<AfterSalesCase> findByOrderIdOrderByCreatedAtDesc(Long orderId);
  List<AfterSalesCase> findByUserIdOrderByCreatedAtDesc(Long userId);
  List<AfterSalesCase> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);
  List<AfterSalesCase> findAllByOrderByCreatedAtDesc();
  boolean existsByOrderIdAndTypeInAndStatus(Long orderId, Collection<AfterSalesType> types, AfterSalesStatus status);
  boolean existsByOrderIdAndTypeInAndStatusIn(Long orderId, Collection<AfterSalesType> types, Collection<AfterSalesStatus> statuses);
}
