package com.smartcommerce.identity.api;

import com.smartcommerce.identity.domain.Role;

public record UserProfile(Long id, String username, String email, Role role) {
}
