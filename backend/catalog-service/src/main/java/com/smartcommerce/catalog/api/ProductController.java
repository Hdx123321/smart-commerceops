package com.smartcommerce.catalog.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcommerce.catalog.domain.Product;
import com.smartcommerce.catalog.domain.ProductReview;
import com.smartcommerce.catalog.repository.ProductRepository;
import com.smartcommerce.catalog.repository.ProductReviewRepository;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ProductController {
  private final ProductRepository products;
  private final ProductReviewRepository reviews;
  private final String uploadDirStr;
  private Path imageDir;

  private static final ObjectMapper MAPPER = new ObjectMapper();

  public ProductController(ProductRepository products,
                           ProductReviewRepository reviews,
                           @Value("${app.upload.dir:./uploads}") String uploadDirStr) {
    this.products = products;
    this.reviews = reviews;
    this.uploadDirStr = uploadDirStr;
  }

  @PostConstruct
  void initImageDir() throws IOException {
    this.imageDir = Path.of(uploadDirStr, "images", "products").toAbsolutePath();
    Files.createDirectories(imageDir);
  }

  @GetMapping("/products")
  public List<ProductResponse> listProducts(
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String search) {
    List<Product> result = products.findByActiveTrue();
    if (category != null && !category.isBlank()) {
      result = result.stream().filter(p -> category.equals(p.getCategory())).toList();
    }
    if (search != null && !search.isBlank()) {
      String lower = search.toLowerCase();
      result = result.stream()
          .filter(p -> (p.getName() != null && p.getName().toLowerCase().contains(lower))
                    || (p.getDescription() != null && p.getDescription().toLowerCase().contains(lower)))
          .toList();
    }
    return result.stream().map(ProductResponse::from).toList();
  }

  @GetMapping("/products/{id}")
  public ProductResponse getProduct(@PathVariable Long id) {
    return ProductResponse.from(findProduct(id));
  }

  @PostMapping("/admin/products")
  @ResponseStatus(HttpStatus.CREATED)
  public ProductResponse createProduct(@Valid @RequestBody ProductRequest request) {
    String category = resolveCategory(request);
    if (products.existsByNameIgnoreCase(request.name())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Product name already exists");
    }
    String imageUrlsJson = serializeImageUrls(request.imageUrls());
    Product product = new Product(request.name(), category, request.description(), request.price(),
        request.stockQuantity(), request.lowStockThreshold(), imageUrlsJson);
    product.update(request.name(), category, request.description(), request.price(), request.stockQuantity(),
        request.lowStockThreshold(), request.activeOrDefault(), imageUrlsJson, request.merchantId(),
        request.merchantNameOrDefault(), request.merchantDescription(), request.merchantContact());
    return ProductResponse.from(products.save(product));
  }

  @PutMapping("/admin/products/{id}")
  public ProductResponse updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
    String category = resolveCategory(request);
    Product product = findProduct(id);
    product.update(request.name(), category, request.description(), request.price(), request.stockQuantity(),
        request.lowStockThreshold(), request.activeOrDefault(), serializeImageUrls(request.imageUrls()), request.merchantId(),
        request.merchantNameOrDefault(), request.merchantDescription(), request.merchantContact());
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

  @GetMapping("/products/{id}/reviews")
  public List<ProductReviewResponse> productReviews(@PathVariable Long id) {
    findProduct(id);
    return reviews.findByProductIdOrderByCreatedAtDesc(id).stream().map(ProductReviewResponse::from).toList();
  }

  @PostMapping("/products/{id}/reviews")
  @ResponseStatus(HttpStatus.CREATED)
  @Transactional
  public ProductReviewResponse createReview(@PathVariable Long id, @Valid @RequestBody ProductReviewRequest request) {
    Product product = findProduct(id);
    ProductReview review = reviews.save(new ProductReview(
        product.getId(),
        request.userId(),
        request.username(),
        request.rating(),
        request.comment()
    ));
    product.addRating(request.rating());
    return ProductReviewResponse.from(review);
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

  @PutMapping("/admin/products/{id}/images")
  public ProductResponse updateProductImages(@PathVariable Long id, @RequestBody List<String> imageUrls) {
    Product product = findProduct(id);
    product.updateImageUrls(serializeImageUrls(imageUrls));
    return ProductResponse.from(products.save(product));
  }

  @PostMapping("/admin/upload")
  public List<String> uploadImages(@RequestParam("files") List<MultipartFile> files) {
    return files.stream().map(file -> {
      String original = file.getOriginalFilename();
      String ext = "";
      if (original != null && original.contains(".")) {
        ext = original.substring(original.lastIndexOf("."));
      }
      String stored = UUID.randomUUID() + ext;
      try {
        file.transferTo(imageDir.resolve(stored));
      } catch (IOException e) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file");
      }
      return "/images/products/" + stored;
    }).toList();
  }

  private static String serializeImageUrls(List<String> urls) {
    if (urls == null || urls.isEmpty()) {
      return null;
    }
    try {
      return MAPPER.writeValueAsString(urls);
    } catch (Exception e) {
      return null;
    }
  }

  private Product findProduct(Long id) {
    return products.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
  }

  private String resolveCategory(ProductRequest request) {
    try {
      return request.resolvedCategory();
    } catch (IllegalArgumentException error) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
    }
  }
}
