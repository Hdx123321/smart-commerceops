package com.smartcommerce.identity.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateProfileRequest(
    @NotBlank @Size(min = 3, max = 80) String username,
    @Size(max = 30) String gender,
    @Min(50) @Max(260) Integer heightCm,
    @Min(20) @Max(350) Integer weightKg,
    @DecimalMin("1.0") BigDecimal shoeSize,
    @Size(max = 500) String shippingAddress,
    @Size(max = 40) String phoneNumber,
    @Size(max = 120) String paymentMethod
) {
}
