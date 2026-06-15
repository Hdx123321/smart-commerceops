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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ProductController {
  private static final String USER_ID_HEADER = "X-User-Id";
  private static final String USER_ROLE_HEADER = "X-User-Role";
  private static final String MERCHANT_ID_HEADER = "X-Merchant-Id";
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
  @Cacheable(cacheNames = "catalog:products", key = "'category=' + (#category ?: '') + ';search=' + (#search ?: '')")
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
  @Cacheable(cacheNames = "catalog:product", key = "#id")
  public ProductResponse getProduct(@PathVariable Long id) {
    return ProductResponse.from(findProduct(id));
  }

  @GetMapping("/admin/products")
  @Cacheable(cacheNames = "catalog:admin-products", key = "(#currentRole ?: 'internal') + ':' + (#currentMerchantId ?: #currentUserId ?: '') + ':merchant=' + (#merchantId ?: 'all')")
  public List<ProductResponse> adminProducts(@RequestParam(required = false) Long merchantId,
                                             @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                             @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                             @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = optionalAuth(currentUserId, currentRole, currentMerchantId);
    if (auth != null && auth.isMerchant()) {
      merchantId = auth.merchantIdOrUserId();
    }
    List<Product> result = merchantId == null ? products.findAll() : products.findByMerchantIdOrderByCreatedAtDesc(merchantId);
    return result.stream().map(ProductResponse::from).toList();
  }

  @PostMapping("/admin/products")
  @ResponseStatus(HttpStatus.CREATED)
  @CacheEvict(cacheNames = {"catalog:products", "catalog:product", "catalog:admin-products", "catalog:inventory-alerts"}, allEntries = true)
  public ProductResponse createProduct(@Valid @RequestBody ProductRequest request,
                                       @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                       @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                       @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireOpsAuth(currentUserId, currentRole, currentMerchantId);
    Long merchantId = auth.isMerchant() ? auth.merchantIdOrUserId() : request.merchantId();
    String category = resolveCategory(request);
    if (merchantId != null && products.existsByMerchantIdAndNameIgnoreCase(merchantId, request.name())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Product name already exists for this merchant");
    }
    String imageUrlsJson = serializeImageUrls(request.imageUrls());
    Product product = new Product(request.name(), category, request.description(), request.price(),
        request.stockQuantity(), request.lowStockThreshold(), imageUrlsJson);
    product.update(request.name(), category, request.description(), request.price(), request.stockQuantity(),
        request.lowStockThreshold(), request.activeOrDefault(), imageUrlsJson, merchantId,
        request.merchantNameOrDefault(), request.merchantDescription(), request.merchantContact());
    return ProductResponse.from(products.save(product));
  }

  @PutMapping("/admin/products/{id}")
  @CacheEvict(cacheNames = {"catalog:products", "catalog:product", "catalog:admin-products", "catalog:inventory-alerts"}, allEntries = true)
  public ProductResponse updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request,
                                       @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                       @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                       @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireOpsAuth(currentUserId, currentRole, currentMerchantId);
    String category = resolveCategory(request);
    Product product = findProduct(id);
    requireProductOwner(auth, product);
    Long merchantId = auth.isMerchant() ? auth.merchantIdOrUserId() : request.merchantId();
    product.update(request.name(), category, request.description(), request.price(), request.stockQuantity(),
        request.lowStockThreshold(), request.activeOrDefault(), serializeImageUrls(request.imageUrls()), merchantId,
        request.merchantNameOrDefault(), request.merchantDescription(), request.merchantContact());
    return ProductResponse.from(products.save(product));
  }

  @PostMapping("/products/{id}/reserve")
  @Transactional
  @CacheEvict(cacheNames = {"catalog:products", "catalog:product", "catalog:admin-products", "catalog:inventory-alerts"}, allEntries = true)
  public ProductResponse reserveStock(@PathVariable Long id, @Valid @RequestBody ReserveStockRequest request) {
    Product product = findProduct(id);
    try {
      product.reserve(request.quantity());
      return ProductResponse.from(products.saveAndFlush(product));
    } catch (ObjectOptimisticLockingFailureException error) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Product stock changed, please retry checkout", error);
    }
  }

  @PostMapping("/products/{id}/ratings/{rating}")
  @Transactional
  @CacheEvict(cacheNames = {"catalog:products", "catalog:product", "catalog:admin-products"}, allEntries = true)
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
  @CacheEvict(cacheNames = {"catalog:products", "catalog:product", "catalog:admin-products"}, allEntries = true)
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
  @Cacheable(cacheNames = "catalog:inventory-alerts", key = "(#currentRole ?: 'internal') + ':' + (#currentMerchantId ?: #currentUserId ?: '')")
  public List<InventoryAlertResponse> inventoryAlerts(
      @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
      @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
      @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = optionalAuth(currentUserId, currentRole, currentMerchantId);
    List<Product> result = auth != null && auth.isMerchant()
        ? products.findByMerchantIdOrderByCreatedAtDesc(auth.merchantIdOrUserId())
        : products.findAll();
    return result.stream()
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
  @CacheEvict(cacheNames = {"catalog:products", "catalog:product", "catalog:admin-products"}, allEntries = true)
  public ProductResponse updateProductImages(@PathVariable Long id, @RequestBody List<String> imageUrls,
                                             @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                             @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                             @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireOpsAuth(currentUserId, currentRole, currentMerchantId);
    Product product = findProduct(id);
    requireProductOwner(auth, product);
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

  private AuthContext optionalAuth(String userId, String role, String merchantId) {
    if (userId == null || role == null) {
      return null;
    }
    return new AuthContext(Long.parseLong(userId), role, merchantId == null || merchantId.isBlank() ? null : Long.parseLong(merchantId));
  }

  private AuthContext requireOpsAuth(String userId, String role, String merchantId) {
    AuthContext auth = optionalAuth(userId, role, merchantId);
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user headers are required");
    }
    if (!auth.isMerchant() && !auth.isAdmin()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only merchant or admin users can manage catalog");
    }
    return auth;
  }

  private void requireProductOwner(AuthContext auth, Product product) {
    if (auth.isAdmin()) {
      return;
    }
    if (product.getMerchantId() != null && product.getMerchantId().equals(auth.merchantIdOrUserId())) {
      return;
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owning merchant can manage this product");
  }

  private record AuthContext(Long userId, String role, Long merchantId) {
    boolean isMerchant() {
      return "MERCHANT".equals(role);
    }

    boolean isAdmin() {
      return "ADMIN".equals(role);
    }

    Long merchantIdOrUserId() {
      return merchantId == null ? userId : merchantId;
    }
  }
}
