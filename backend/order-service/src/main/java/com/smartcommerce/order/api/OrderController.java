package com.smartcommerce.order.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcommerce.order.domain.CartItem;
import com.smartcommerce.order.domain.CommerceOrder;
import com.smartcommerce.order.domain.AfterSalesCase;
import com.smartcommerce.order.domain.AfterSalesStatus;
import com.smartcommerce.order.domain.AfterSalesType;
import com.smartcommerce.order.repository.AfterSalesCaseRepository;
import com.smartcommerce.order.repository.CartItemRepository;
import com.smartcommerce.order.repository.CommerceOrderRepository;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class OrderController {
  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final String USER_ID_HEADER = "X-User-Id";
  private static final String USER_ROLE_HEADER = "X-User-Role";
  private static final String MERCHANT_ID_HEADER = "X-Merchant-Id";

  private final CartItemRepository cartItems;
  private final CommerceOrderRepository orders;
  private final AfterSalesCaseRepository afterSalesCases;
  private final RestClient catalogClient;

  public OrderController(CartItemRepository cartItems, CommerceOrderRepository orders, AfterSalesCaseRepository afterSalesCases, RestClient catalogClient) {
    this.cartItems = cartItems;
    this.orders = orders;
    this.afterSalesCases = afterSalesCases;
    this.catalogClient = catalogClient;
  }

  @GetMapping("/cart/{userId}")
  public List<CartItemResponse> getCart(@PathVariable Long userId,
                                        @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                        @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole) {
    AuthContext auth = requireAuth(currentUserId, currentRole, null);
    requireCustomerOwner(auth, userId);
    return cartItems.findByUserId(userId).stream().map(CartItemResponse::from).toList();
  }

  @PostMapping("/cart/items")
  public CartItemResponse addToCart(@Valid @RequestBody AddCartItemRequest request,
                                    @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                    @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole) {
    AuthContext auth = requireAuth(currentUserId, currentRole, null);
    requireCustomerOwner(auth, request.userId());
    ProductSnapshot product = catalogClient.get().uri("/products/{id}", request.productId()).retrieve().body(ProductSnapshot.class);
    if (product == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
    }
    CartItem item = cartItems.findByUserIdAndProductId(request.userId(), request.productId())
        .map(existing -> {
          existing.addQuantity(request.quantity());
          return existing;
        })
        .orElseGet(() -> new CartItem(
            request.userId(),
            product.id(),
            product.name(),
            product.price(),
            request.quantity(),
            serializeImageUrls(product.imageUrls()),
            product.merchantId(),
            product.merchantName()
        ));
    return CartItemResponse.from(cartItems.save(item));
  }

  @DeleteMapping("/cart/{userId}")
  @Transactional
  public void clearCart(@PathVariable Long userId,
                        @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                        @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole) {
    AuthContext auth = requireAuth(currentUserId, currentRole, null);
    requireCustomerOwner(auth, userId);
    cartItems.deleteByUserId(userId);
  }

  @PostMapping("/checkout")
  @Transactional
  public List<OrderResponse> checkout(@Valid @RequestBody CheckoutRequest request,
                                      @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                      @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole) {
    AuthContext auth = requireAuth(currentUserId, currentRole, null);
    requireCustomerOwner(auth, request.userId());
    List<CartItem> items = checkoutItems(request);
    if (items.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one cart item");
    }
    List<OrderResponse> createdOrders = new ArrayList<>();
    Map<Long, List<CartItem>> byMerchant = items.stream()
        .collect(Collectors.groupingBy(item -> item.getMerchantId() == null ? 0L : item.getMerchantId()));
    for (List<CartItem> merchantItems : byMerchant.values()) {
      CartItem first = merchantItems.getFirst();
      CommerceOrder order = new CommerceOrder(
          request.userId(),
          first.getMerchantId(),
          first.getMerchantName(),
          request.shippingAddress(),
          request.phoneNumber(),
          request.paymentMethod()
      );
      for (CartItem item : merchantItems) {
        catalogClient.post()
            .uri("/products/{id}/reserve", item.getProductId())
            .body(Map.of("quantity", item.getQuantity()))
            .retrieve()
            .toBodilessEntity();
        order.addLine(
            item.getProductId(),
            item.getProductName(),
            item.getQuantity(),
            item.getUnitPrice(),
            item.getImageUrls(),
            item.getMerchantId(),
            item.getMerchantName()
        );
      }
      createdOrders.add(OrderResponse.from(orders.save(order)));
    }
    cartItems.deleteAll(items);
    return createdOrders;
  }

  private List<CartItem> checkoutItems(CheckoutRequest request) {
    if (request.cartItemIds() == null) {
      return cartItems.findByUserId(request.userId());
    }
    if (request.cartItemIds().isEmpty()) {
      return List.of();
    }
    if (request.cartItemIds().stream().anyMatch(id -> id == null)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart item ids must not contain null");
    }
    Set<Long> requestedIds = Set.copyOf(request.cartItemIds());
    List<CartItem> items = cartItems.findByUserIdAndIdIn(request.userId(), request.cartItemIds());
    if (items.size() != requestedIds.size()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected cart items are invalid");
    }
    return items;
  }

  private static String serializeImageUrls(List<String> imageUrls) {
    if (imageUrls == null || imageUrls.isEmpty()) {
      return null;
    }
    try {
      return MAPPER.writeValueAsString(imageUrls);
    } catch (Exception error) {
      return null;
    }
  }

  @GetMapping("/orders")
  @Transactional(readOnly = true)
  public List<OrderResponse> listOrders(@RequestParam(required = false) Long userId,
                                        @RequestParam(required = false) Long merchantId,
                                        @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                        @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                        @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = optionalAuth(currentUserId, currentRole, currentMerchantId);
    if (auth != null) {
      if (auth.isCustomer()) {
        userId = auth.userId();
        merchantId = null;
      } else if (auth.isMerchant()) {
        merchantId = auth.merchantIdOrUserId();
        userId = null;
      }
    }
    List<CommerceOrder> result;
    if (merchantId != null) {
      result = orders.findByMerchantIdOrderByCreatedAtDesc(merchantId);
    } else if (userId != null) {
      result = orders.findByUserIdOrderByCreatedAtDesc(userId);
    } else {
      result = orders.findAllByOrderByCreatedAtDesc();
    }
    return result.stream().map(OrderResponse::from).toList();
  }

  @GetMapping("/orders/{id}")
  @Transactional(readOnly = true)
  public OrderResponse getOrder(@PathVariable Long id,
                                @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireAuth(currentUserId, currentRole, currentMerchantId);
    CommerceOrder order = orders.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    requireOrderAccess(auth, order);
    return OrderResponse.from(order);
  }

  @PutMapping("/orders/{id}/ship")
  @Transactional
  public OrderResponse shipOrder(@PathVariable Long id,
                                 @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                 @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                 @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireAuth(currentUserId, currentRole, currentMerchantId);
    CommerceOrder order = orders.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    requireMerchantOrderAccess(auth, order);
    try {
      order.markShipped();
    } catch (IllegalStateException error) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
    }
    return OrderResponse.from(order);
  }

  @PutMapping("/orders/{id}/confirm-receipt")
  @Transactional
  public OrderResponse confirmReceipt(@PathVariable Long id,
                                      @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                      @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole) {
    AuthContext auth = requireAuth(currentUserId, currentRole, null);
    CommerceOrder order = orders.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    requireCustomerOwner(auth, order.getUserId());
    try {
      order.confirmReceipt();
    } catch (IllegalStateException error) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
    }
    return OrderResponse.from(order);
  }

  @PostMapping("/orders/{id}/after-sales")
  @Transactional
  public AfterSalesResponse createAfterSales(@PathVariable Long id, @Valid @RequestBody AfterSalesRequest request,
                                             @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                             @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole) {
    AuthContext auth = requireAuth(currentUserId, currentRole, null);
    requireCustomerOwner(auth, request.userId());
    CommerceOrder order = orders.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    if (!order.getUserId().equals(request.userId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the order owner can request after-sales");
    }
    if (request.type() != AfterSalesType.CONTACT_MERCHANT) {
      boolean hasPendingCase = afterSalesCases.existsByOrderIdAndTypeInAndStatusIn(
          id,
          List.of(AfterSalesType.RETURN, AfterSalesType.EXCHANGE, AfterSalesType.REFUND_ONLY),
          List.of(
              AfterSalesStatus.PENDING_MERCHANT,
              AfterSalesStatus.RETURN_PENDING_RECEIPT,
              AfterSalesStatus.EXCHANGE_PENDING_SHIPMENT,
              AfterSalesStatus.EXCHANGE_PENDING_RECEIPT
          )
      );
      if (hasPendingCase) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This order already has a pending after-sales case");
      }
      try {
        order.requestAfterSales();
      } catch (IllegalStateException error) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
      }
    }
    AfterSalesCase afterSalesCase = afterSalesCases.save(new AfterSalesCase(
        order,
        request.type(),
        request.reason(),
        request.description(),
        request.contactMethod()
    ));
    return AfterSalesResponse.from(afterSalesCase);
  }

  @GetMapping("/orders/{id}/after-sales")
  @Transactional(readOnly = true)
  public List<AfterSalesResponse> listOrderAfterSales(@PathVariable Long id,
                                                      @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                                      @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                                      @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireAuth(currentUserId, currentRole, currentMerchantId);
    CommerceOrder order = orders.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    requireOrderAccess(auth, order);
    return afterSalesCases.findByOrderIdOrderByCreatedAtDesc(id).stream().map(AfterSalesResponse::from).toList();
  }

  @GetMapping("/after-sales")
  @Transactional(readOnly = true)
  public List<AfterSalesResponse> listAfterSales(@RequestParam(required = false) Long userId,
                                                 @RequestParam(required = false) Long merchantId,
                                                 @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                                 @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                                 @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = optionalAuth(currentUserId, currentRole, currentMerchantId);
    if (auth != null) {
      if (auth.isCustomer()) {
        userId = auth.userId();
        merchantId = null;
      } else if (auth.isMerchant()) {
        merchantId = auth.merchantIdOrUserId();
        userId = null;
      }
    }
    List<AfterSalesCase> result;
    if (merchantId != null) {
      result = afterSalesCases.findByMerchantIdOrderByCreatedAtDesc(merchantId);
    } else if (userId != null) {
      result = afterSalesCases.findByUserIdOrderByCreatedAtDesc(userId);
    } else {
      result = afterSalesCases.findAllByOrderByCreatedAtDesc();
    }
    return result.stream().map(AfterSalesResponse::from).toList();
  }

  @GetMapping("/after-sales/{id}")
  @Transactional(readOnly = true)
  public AfterSalesResponse getAfterSales(@PathVariable Long id,
                                          @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                          @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                          @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireAuth(currentUserId, currentRole, currentMerchantId);
    AfterSalesCase afterSalesCase = afterSalesCases.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "After-sales case not found"));
    requireAfterSalesAccess(auth, afterSalesCase);
    return AfterSalesResponse.from(afterSalesCase);
  }

  @PutMapping("/after-sales/{id}/cancel")
  @Transactional
  public AfterSalesResponse cancelAfterSales(@PathVariable Long id, @RequestParam(required = false) Long userId,
                                             @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                             @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole) {
    AuthContext auth = requireAuth(currentUserId, currentRole, null);
    AfterSalesCase afterSalesCase = afterSalesCases.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "After-sales case not found"));
    requireCustomerOwner(auth, afterSalesCase.getUserId());
    try {
      afterSalesCase.cancel();
    } catch (IllegalStateException error) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
    }
    return AfterSalesResponse.from(afterSalesCase);
  }

  @PutMapping("/after-sales/{id}/reject")
  @Transactional
  public AfterSalesResponse rejectAfterSales(@PathVariable Long id, @RequestBody AfterSalesDecisionRequest request,
                                             @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                             @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                             @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AfterSalesCase afterSalesCase = afterSalesCaseForMerchantAction(id, requireAuth(currentUserId, currentRole, currentMerchantId));
    try {
      afterSalesCase.reject(request.note());
    } catch (IllegalStateException error) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
    }
    return AfterSalesResponse.from(afterSalesCase);
  }

  @PutMapping("/after-sales/{id}/complete")
  @Transactional
  public AfterSalesResponse completeAfterSales(@PathVariable Long id, @RequestBody AfterSalesDecisionRequest request,
                                               @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                               @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                               @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AfterSalesCase afterSalesCase = afterSalesCaseForMerchantAction(id, requireAuth(currentUserId, currentRole, currentMerchantId));
    try {
      afterSalesCase.complete(request.note());
    } catch (IllegalStateException error) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
    }
    return AfterSalesResponse.from(afterSalesCase);
  }

  @PutMapping("/after-sales/{id}/approve")
  @Transactional
  public AfterSalesResponse approveAfterSales(@PathVariable Long id, @RequestBody AfterSalesDecisionRequest request,
                                              @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                              @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                              @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AfterSalesCase afterSalesCase = afterSalesCaseForMerchantAction(id, requireAuth(currentUserId, currentRole, currentMerchantId));
    try {
      afterSalesCase.approve(request.note());
    } catch (IllegalStateException error) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
    }
    return AfterSalesResponse.from(afterSalesCase);
  }

  @PutMapping("/after-sales/{id}/return-received")
  @Transactional
  public AfterSalesResponse confirmReturnedGoods(@PathVariable Long id, @RequestBody AfterSalesDecisionRequest request,
                                                 @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                                 @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                                 @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AfterSalesCase afterSalesCase = afterSalesCaseForMerchantAction(id, requireAuth(currentUserId, currentRole, currentMerchantId));
    try {
      afterSalesCase.confirmReturnedGoods(request.note());
    } catch (IllegalStateException error) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
    }
    return AfterSalesResponse.from(afterSalesCase);
  }

  @PutMapping("/after-sales/{id}/replacement-shipped")
  @Transactional
  public AfterSalesResponse shipReplacement(@PathVariable Long id, @RequestBody AfterSalesDecisionRequest request,
                                            @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                            @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                            @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AfterSalesCase afterSalesCase = afterSalesCaseForMerchantAction(id, requireAuth(currentUserId, currentRole, currentMerchantId));
    try {
      afterSalesCase.shipReplacement(request.note());
    } catch (IllegalStateException error) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
    }
    return AfterSalesResponse.from(afterSalesCase);
  }

  @PutMapping("/after-sales/{id}/replacement-received")
  @Transactional
  public AfterSalesResponse confirmReplacementReceived(@PathVariable Long id,
                                                       @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                                       @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole) {
    AuthContext auth = requireAuth(currentUserId, currentRole, null);
    AfterSalesCase afterSalesCase = afterSalesCases.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "After-sales case not found"));
    requireCustomerOwner(auth, afterSalesCase.getUserId());
    try {
      afterSalesCase.confirmReplacementReceived();
    } catch (IllegalStateException error) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
    }
    return AfterSalesResponse.from(afterSalesCase);
  }

  private AfterSalesCase afterSalesCaseForMerchantAction(Long id, AuthContext auth) {
    AfterSalesCase afterSalesCase = afterSalesCases.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "After-sales case not found"));
    requireMerchantAfterSalesAccess(auth, afterSalesCase);
    return afterSalesCase;
  }

  private AuthContext optionalAuth(String userId, String role, String merchantId) {
    if (userId == null || role == null) {
      return null;
    }
    return new AuthContext(Long.parseLong(userId), role, merchantId == null || merchantId.isBlank() ? null : Long.parseLong(merchantId));
  }

  private AuthContext requireAuth(String userId, String role, String merchantId) {
    AuthContext auth = optionalAuth(userId, role, merchantId);
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user headers are required");
    }
    return auth;
  }

  private void requireCustomerOwner(AuthContext auth, Long ownerUserId) {
    if (!auth.isCustomer() || !auth.userId().equals(ownerUserId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner customer can access this resource");
    }
  }

  private void requireOrderAccess(AuthContext auth, CommerceOrder order) {
    if (auth.isAdmin()) {
      return;
    }
    if (auth.isCustomer() && auth.userId().equals(order.getUserId())) {
      return;
    }
    if (auth.isMerchant() && auth.merchantIdOrUserId().equals(order.getMerchantId())) {
      return;
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Order is outside current user scope");
  }

  private void requireMerchantOrderAccess(AuthContext auth, CommerceOrder order) {
    if (auth.isAdmin()) {
      return;
    }
    if (auth.isMerchant() && auth.merchantIdOrUserId().equals(order.getMerchantId())) {
      return;
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owning merchant can manage this order");
  }

  private void requireAfterSalesAccess(AuthContext auth, AfterSalesCase afterSalesCase) {
    if (auth.isAdmin()) {
      return;
    }
    if (auth.isCustomer() && auth.userId().equals(afterSalesCase.getUserId())) {
      return;
    }
    if (auth.isMerchant() && auth.merchantIdOrUserId().equals(afterSalesCase.getMerchantId())) {
      return;
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "After-sales case is outside current user scope");
  }

  private void requireMerchantAfterSalesAccess(AuthContext auth, AfterSalesCase afterSalesCase) {
    if (auth.isAdmin()) {
      return;
    }
    if (auth.isMerchant() && auth.merchantIdOrUserId().equals(afterSalesCase.getMerchantId())) {
      return;
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owning merchant can manage this after-sales case");
  }

  private record AuthContext(Long userId, String role, Long merchantId) {
    boolean isCustomer() {
      return "CUSTOMER".equals(role);
    }

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
