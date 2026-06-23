package com.smartcommerce.chat.security;

import java.security.Principal;

public record ChatPrincipal(Long userId, String role, String username) implements Principal {
  @Override
  public String getName() {
    return principalName(role, userId);
  }

  public static String principalName(String role, Long userId) {
    return role + ":" + userId;
  }
}
