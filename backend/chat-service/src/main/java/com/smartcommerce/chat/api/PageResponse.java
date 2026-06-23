package com.smartcommerce.chat.api;

import java.io.Serializable;
import java.util.List;
import org.springframework.data.domain.Page;

public record PageResponse<T>(
    List<T> content,
    long totalElements,
    int totalPages,
    int page,
    int size
) implements Serializable {
  public static <T> PageResponse<T> from(Page<?> page, List<T> content) {
    return new PageResponse<>(
        content,
        page.getTotalElements(),
        page.getTotalPages(),
        page.getNumber(),
        page.getSize()
    );
  }
}
