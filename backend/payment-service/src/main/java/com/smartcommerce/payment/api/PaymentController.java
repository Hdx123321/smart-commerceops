package com.smartcommerce.payment.api;

import com.smartcommerce.payment.domain.Payment;
import com.smartcommerce.payment.repository.PaymentRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class PaymentController {
  private static final String USER_ID_HEADER = "X-User-Id";
  private static final String USER_ROLE_HEADER = "X-User-Role";
  private static final String INTERNAL_TOKEN_HEADER = "X-Internal-Token";

  private final PaymentRepository payments;
  private final RestClient orderClient;
  private final String internalToken;

  public PaymentController(PaymentRepository payments, RestClient orderClient,
                           @Value("${app.internal-token:dev-internal-payment-token}") String internalToken) {
    this.payments = payments;
    this.orderClient = orderClient;
    this.internalToken = internalToken;
  }

  @PostMapping("/payments")
  public PaymentResponse createPayment(@Valid @RequestBody PaymentRequest request,
                                       @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                       @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole) {
    Long userId = requireCustomer(currentUserId, currentRole);
    OrderVerificationResponse order = fetchOrder(request.orderId(), userId);
    Payment payment = payments.findByOrderId(request.orderId())
        .map(existing -> handleExisting(existing, order))
        .orElseGet(() -> createProcessingPayment(request, userId, order));

    if ("PAID".equals(order.paymentStatus())) {
      payment.markSuccess();
      return saveSuccess(payment);
    }
    if (!"PENDING_PAYMENT".equals(order.status())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not pending payment");
    }
    if (!"UNPAID".equals(order.paymentStatus())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not payable");
    }

    simulateProcessing();
    markOrderPaid(order.id());
    payment.markSuccess();
    return saveSuccess(payment);
  }

  @GetMapping("/payments/{id}")
  public PaymentResponse getPayment(@PathVariable Long id,
                                    @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                    @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole) {
    Long userId = requireCustomer(currentUserId, currentRole);
    Payment payment = payments.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    if (!payment.getUserId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Payment is outside current user scope");
    }
    return PaymentResponse.from(payment);
  }

  private Payment handleExisting(Payment payment, OrderVerificationResponse order) {
    if (payment.isSuccess()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Order has already been paid");
    }
    if (!payment.isProcessing()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Order has a failed payment record");
    }
    if (payment.getAmount().compareTo(order.totalAmount()) != 0) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Existing payment amount does not match order amount");
    }
    return payment;
  }

  private Payment createProcessingPayment(PaymentRequest request, Long userId, OrderVerificationResponse order) {
    if ("PAID".equals(order.paymentStatus())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Order has already been paid");
    }
    if (!"PENDING_PAYMENT".equals(order.status())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not pending payment");
    }
    try {
      return payments.save(new Payment(request.orderId(), userId, order.totalAmount(),
          request.paymentMethod() == null ? order.paymentMethod() : request.paymentMethod()));
    } catch (DataIntegrityViolationException error) {
      Payment existing = payments.findByOrderId(request.orderId())
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Payment already exists", error));
      return handleExisting(existing, order);
    }
  }

  private PaymentResponse saveSuccess(Payment payment) {
    try {
      return PaymentResponse.from(payments.save(payment));
    } catch (ObjectOptimisticLockingFailureException error) {
      Payment latest = payments.findByOrderId(payment.getOrderId())
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Payment changed during processing", error));
      if (latest.isSuccess()) {
        return PaymentResponse.from(latest);
      }
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment changed during processing", error);
    }
  }

  private Long requireCustomer(String currentUserId, String currentRole) {
    if (currentUserId == null || currentRole == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user headers are required");
    }
    if (!"CUSTOMER".equals(currentRole)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only customers can pay orders");
    }
    return Long.parseLong(currentUserId);
  }

  private OrderVerificationResponse fetchOrder(Long orderId, Long userId) {
    try {
      OrderVerificationResponse order = orderClient.get()
          .uri("/orders/{id}", orderId)
          .header(USER_ID_HEADER, String.valueOf(userId))
          .header(USER_ROLE_HEADER, "CUSTOMER")
          .retrieve()
          .body(OrderVerificationResponse.class);
      if (order == null) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
      }
      if (!order.userId().equals(userId)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the order owner can pay this order");
      }
      return order;
    } catch (HttpClientErrorException.NotFound error) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found", error);
    } catch (HttpClientErrorException.Forbidden error) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the order owner can pay this order", error);
    }
  }

  private void markOrderPaid(Long orderId) {
    try {
      orderClient.put()
          .uri("/internal/orders/{id}/mark-paid", orderId)
          .header(INTERNAL_TOKEN_HEADER, internalToken)
          .retrieve()
          .toBodilessEntity();
    } catch (HttpClientErrorException.Conflict error) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Order could not be marked paid", error);
    } catch (HttpClientErrorException.BadRequest error) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order could not be marked paid", error);
    } catch (HttpClientErrorException.Forbidden error) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Internal payment callback was rejected", error);
    } catch (HttpClientErrorException.NotFound error) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found", error);
    }
  }

  private void simulateProcessing() {
    try {
      Thread.sleep(1000L);
    } catch (InterruptedException error) {
      Thread.currentThread().interrupt();
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Payment processing interrupted", error);
    }
  }
}
