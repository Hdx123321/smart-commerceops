package com.smartcommerce.order.api;

import com.smartcommerce.order.domain.CartItem;
import com.smartcommerce.order.domain.CommerceOrder;
import com.smartcommerce.order.domain.OrderStatus;
import com.smartcommerce.order.repository.CartItemRepository;
import com.smartcommerce.order.repository.CommerceOrderRepository;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class OrderController {
  private final CartItemRepository cartItems;
  private final CommerceOrderRepository orders;
  private final RestClient catalogClient;

  public OrderController(CartItemRepository cartItems, CommerceOrderRepository orders, RestClient catalogClient) {
    this.cartItems = cartItems;
    this.orders = orders;
    this.catalogClient = catalogClient;
  }

  @GetMapping("/cart/{userId}")
  public List<CartItem> getCart(@PathVariable Long userId) {
    return cartItems.findByUserId(userId);
  }

  @PostMapping("/cart/items")
  public CartItem addToCart(@Valid @RequestBody AddCartItemRequest request) {
    ProductSnapshot product = catalogClient.get().uri("/products/{id}", request.productId()).retrieve().body(ProductSnapshot.class);
    if (product == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
    }
    CartItem item = cartItems.findByUserIdAndProductId(request.userId(), request.productId())
        .map(existing -> {
          existing.addQuantity(request.quantity());
          return existing;
        })
        .orElseGet(() -> new CartItem(request.userId(), product.id(), product.name(), product.price(), request.quantity()));
    return cartItems.save(item);
  }

  @DeleteMapping("/cart/{userId}")
  @Transactional
  public void clearCart(@PathVariable Long userId) {
    cartItems.deleteByUserId(userId);
  }

  @PostMapping("/checkout")
  @Transactional
  public OrderResponse checkout(@Valid @RequestBody CheckoutRequest request) {
    List<CartItem> items = cartItems.findByUserId(request.userId());
    if (items.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
    }
    CommerceOrder order = new CommerceOrder(request.userId(), request.shippingAddress(), request.phoneNumber());
    for (CartItem item : items) {
      catalogClient.post()
          .uri("/products/{id}/reserve", item.getProductId())
          .body(Map.of("quantity", item.getQuantity()))
          .retrieve()
          .toBodilessEntity();
      order.addLine(item.getProductId(), item.getProductName(), item.getQuantity(), item.getUnitPrice());
    }
    CommerceOrder saved = orders.save(order);
    cartItems.deleteByUserId(request.userId());
    return OrderResponse.from(saved);
  }

  @GetMapping("/orders")
  @Transactional(readOnly = true)
  public List<OrderResponse> listOrders(@RequestParam(required = false) Long userId) {
    List<CommerceOrder> result = userId == null ? orders.findAll() : orders.findByUserIdOrderByCreatedAtDesc(userId);
    return result.stream().map(OrderResponse::from).toList();
  }

  @PutMapping("/orders/{id}/status/{status}")
  @Transactional
  public OrderResponse updateStatus(@PathVariable Long id, @PathVariable OrderStatus status) {
    CommerceOrder order = orders.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    order.transitionTo(status);
    return OrderResponse.from(order);
  }
}
