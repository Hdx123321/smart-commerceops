package com.smartcommerce.catalog.api;

import com.smartcommerce.catalog.domain.ProductReview;
import java.time.Instant;

public record ProductReviewResponse(
    Long id,
    Long productId,
    Long userId,
    String username,
    int rating,
    String comment,
    Instant createdAt
) {
  public static ProductReviewResponse from(ProductReview review) {
    return new ProductReviewResponse(
        review.getId(),
        review.getProductId(),
        review.getUserId(),
        review.getUsername(),
        review.getRating(),
        review.getComment(),
        review.getCreatedAt()
    );
  }
}
