package com.smartcommerce.catalog.repository;

import com.smartcommerce.catalog.domain.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
  List<Product> findByActiveTrue();
  List<Product> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);
  List<Product> findByStockQuantityLessThanEqual(int threshold);
  boolean existsByNameIgnoreCase(String name);
  boolean existsByMerchantIdAndNameIgnoreCase(Long merchantId, String name);
}
