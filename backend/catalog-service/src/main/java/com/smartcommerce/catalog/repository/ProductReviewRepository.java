package com.smartcommerce.catalog.repository;

import com.smartcommerce.catalog.domain.ProductReview;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
  List<ProductReview> findByProductIdOrderByCreatedAtDesc(Long productId);
}
