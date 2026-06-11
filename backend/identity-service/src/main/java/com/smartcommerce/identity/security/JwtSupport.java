package com.smartcommerce.identity.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcommerce.identity.domain.Role;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtSupport {
  private final ObjectMapper objectMapper;
  private final String secret;
  private final long ttlSeconds;

  public JwtSupport(ObjectMapper objectMapper,
                    @Value("${security.jwt.secret:dev-secret-change-me}") String secret,
                    @Value("${security.jwt.ttl-seconds:7200}") long ttlSeconds) {
    this.objectMapper = objectMapper;
    this.secret = secret;
    this.ttlSeconds = ttlSeconds;
  }

  public String createToken(Long userId, String username, Role role) {
    Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("sub", username);
    payload.put("uid", userId);
    payload.put("role", role.name());
    payload.put("iat", Instant.now().getEpochSecond());
    payload.put("exp", Instant.now().plusSeconds(ttlSeconds).getEpochSecond());
    String unsigned = encode(header) + "." + encode(payload);
    return unsigned + "." + sign(unsigned);
  }

  public Map<String, Object> verify(String token) {
    try {
      String[] parts = token.split("\\.");
      if (parts.length != 3 || !sign(parts[0] + "." + parts[1]).equals(parts[2])) {
        throw new IllegalArgumentException("Invalid token signature");
      }
      Map<String, Object> claims = objectMapper.readValue(Base64.getUrlDecoder().decode(parts[1]), new TypeReference<>() {});
      Number exp = (Number) claims.get("exp");
      if (exp == null || exp.longValue() < Instant.now().getEpochSecond()) {
        throw new IllegalArgumentException("Token expired");
      }
      return claims;
    } catch (Exception ex) {
      throw new IllegalArgumentException("Invalid token", ex);
    }
  }

  private String encode(Object value) {
    try {
      return Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(value));
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to encode token", ex);
    }
  }

  private String sign(String unsignedToken) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(unsignedToken.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to sign token", ex);
    }
  }
}
