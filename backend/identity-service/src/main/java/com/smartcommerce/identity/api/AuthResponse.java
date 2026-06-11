package com.smartcommerce.identity.api;

public record AuthResponse(String accessToken, UserProfile user) {
}
