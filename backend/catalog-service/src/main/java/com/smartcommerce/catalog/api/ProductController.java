package com.smartcommerce.catalog.api;

import com.smartcommerce.catalog.domain.Product;
import com.smartcommerce.catalog.repository.ProductRepository;
import jakarta.validation.Valid;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ProductController {
  private final ProductRepository products;

  public ProductController(ProductRepository products) {
    this.products = products;
  }

  @GetMapping("/products")
  public List<ProductResponse> listProducts() {
    return products.findByActiveTrue().stream().map(ProductResponse::from).toList();
  }

  @GetMapping("/products/{id}")
  public ProductResponse getProduct(@PathVariable Long id) {
    return ProductResponse.from(findProduct(id));
  }

  @PostMapping("/admin/products")
  @ResponseStatus(HttpStatus.CREATED)
  public ProductResponse createProduct(@Valid @RequestBody ProductRequest request) {
    Product product = new Product(request.name(), request.category(), request.description(), request.price(),
        request.stockQuantity(), request.lowStockThreshold(), request.imageUrl());
    product.update(request.name(), request.category(), request.description(), request.price(), request.stockQuantity(),
        request.lowStockThreshold(), request.active(), request.imageUrl());
    return ProductResponse.from(products.save(product));
  }

  @PutMapping("/admin/products/{id}")
  public ProductResponse updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
    Product product = findProduct(id);
    product.update(request.name(), request.category(), request.description(), request.price(), request.stockQuantity(),
        request.lowStockThreshold(), request.active(), request.imageUrl());
    return ProductResponse.from(products.save(product));
  }

  @PostMapping("/products/{id}/reserve")
  @Transactional
  public ProductResponse reserveStock(@PathVariable Long id, @Valid @RequestBody ReserveStockRequest request) {
    Product product = findProduct(id);
    product.reserve(request.quantity());
    return ProductResponse.from(product);
  }

  @PostMapping("/products/{id}/ratings/{rating}")
  @Transactional
  public ProductResponse rateProduct(@PathVariable Long id, @PathVariable int rating) {
    Product product = findProduct(id);
    product.addRating(rating);
    return ProductResponse.from(product);
  }

  @GetMapping("/admin/inventory/alerts")
  public List<InventoryAlertResponse> inventoryAlerts() {
    return products.findAll().stream()
        .filter(product -> product.getStockQuantity() <= product.getLowStockThreshold())
        .sorted(Comparator.comparingInt(Product::getStockQuantity))
        .map(product -> new InventoryAlertResponse(
            product.getId(),
            product.getName(),
            product.getStockQuantity(),
            product.getLowStockThreshold(),
            Math.max(product.getLowStockThreshold() * 2 - product.getStockQuantity(), 0)
        ))
        .toList();
  }

  private Product findProduct(Long id) {
    return products.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
  }
}
