package com.smartcommerce.chat.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ChatJwtVerifier {
  private final ObjectMapper objectMapper;
  private final String secret;

  public ChatJwtVerifier(ObjectMapper objectMapper,
                         @Value("${security.jwt.secret:dev-secret-change-me}") String secret) {
    this.objectMapper = objectMapper;
    this.secret = secret;
  }

  public ChatPrincipal verify(String token) {
    try {
      String[] parts = token.split("\\.");
      if (parts.length != 3 || !sign(parts[0] + "." + parts[1]).equals(parts[2])) {
        throw new IllegalArgumentException("Invalid token signature");
      }
      Map<String, Object> claims = objectMapper.readValue(
          Base64.getUrlDecoder().decode(parts[1]), new TypeReference<>() {});
      Number exp = (Number) claims.get("exp");
      Number uid = (Number) claims.get("uid");
      String role = String.valueOf(claims.get("role"));
      String username = String.valueOf(claims.get("sub"));
      if (exp == null || exp.longValue() < Instant.now().getEpochSecond() || uid == null
          || !(role.equals("CUSTOMER") || role.equals("MERCHANT") || role.equals("ADMIN"))) {
        throw new IllegalArgumentException("Invalid token claims");
      }
      return new ChatPrincipal(uid.longValue(), role, username);
    } catch (Exception error) {
      throw new IllegalArgumentException("Invalid token", error);
    }
  }

  private String sign(String unsignedToken) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return Base64.getUrlEncoder().withoutPadding()
          .encodeToString(mac.doFinal(unsignedToken.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception error) {
      throw new IllegalStateException("Failed to verify token", error);
    }
  }
}
