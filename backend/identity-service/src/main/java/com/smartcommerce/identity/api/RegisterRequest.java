package com.smartcommerce.identity.api;

import com.smartcommerce.identity.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Size(min = 3, max = 80) String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 80) String password,
    Role role
) {
}
