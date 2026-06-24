package com.smartcommerce.catalog.repository;

import com.smartcommerce.catalog.domain.Product;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {
  List<Product> findByActiveTrue();
  List<Product> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);
  Page<Product> findByMerchantId(Long merchantId, Pageable pageable);
  List<Product> findByStockQuantityLessThanEqual(int threshold);
  @Query("""
      select p from Product p
      where p.active = true
        and (:merchantId is null or p.merchantId = :merchantId)
        and (:category is null or p.category = :category)
        and (
          :search is null
          or lower(p.name) like lower(concat('%', :search, '%'))
          or lower(coalesce(p.description, '')) like lower(concat('%', :search, '%'))
          or lower(coalesce(p.merchantName, '')) like lower(concat('%', :search, '%'))
        )
      """)
  Page<Product> searchActive(@Param("merchantId") Long merchantId, @Param("category") String category, @Param("search") String search, Pageable pageable);
  boolean existsByNameIgnoreCase(String name);
  boolean existsByMerchantIdAndNameIgnoreCase(Long merchantId, String name);
}
