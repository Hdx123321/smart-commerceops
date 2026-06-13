package com.smartcommerce.identity.api;

import com.smartcommerce.identity.domain.Role;
import java.math.BigDecimal;

public record UserProfile(
    Long id,
    String username,
    String email,
    Role role,
    String gender,
    Integer heightCm,
    Integer weightKg,
    BigDecimal shoeSize,
    String shippingAddress,
    String phoneNumber,
    String paymentMethod
) {
}
