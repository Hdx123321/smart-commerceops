package com.smartcommerce.identity.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;

class JwtSupportTest {
  @Test
  void createsAndVerifiesSignedToken() throws Exception {
    Class<?> jwtClass = Class.forName("com.smartcommerce.identity.security.JwtSupport");
    Class<?> roleClass = Class.forName("com.smartcommerce.identity.domain.Role");
    Object merchantRole = Enum.valueOf((Class<Enum>) roleClass.asSubclass(Enum.class), "MERCHANT");
    Object jwt = jwtClass
        .getConstructor(ObjectMapper.class, String.class, long.class)
        .newInstance(new ObjectMapper(), "test-secret-with-enough-length", 3600L);

    String token = (String) jwtClass
        .getMethod("createToken", Long.class, String.class, roleClass)
        .invoke(jwt, 42L, "merchant", merchantRole);
    Map<String, Object> claims = (Map<String, Object>) jwtClass
        .getMethod("verify", String.class)
        .invoke(jwt, token);

    assertThat(claims.get("sub")).isEqualTo("merchant");
    assertThat(claims.get("role")).isEqualTo("MERCHANT");
    assertThat(((Number) claims.get("uid")).longValue()).isEqualTo(42L);
  }
}
