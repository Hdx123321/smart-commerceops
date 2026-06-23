package com.smartcommerce.gateway;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class GatewayAuthenticationFilter extends OncePerRequestFilter {
  public static final String USER_ID_HEADER = "X-User-Id";
  public static final String USERNAME_HEADER = "X-Username";
  public static final String USER_ROLE_HEADER = "X-User-Role";
  public static final String MERCHANT_ID_HEADER = "X-Merchant-Id";

  private final JwtVerifier jwtVerifier;

  public GatewayAuthenticationFilter(JwtVerifier jwtVerifier) {
    this.jwtVerifier = jwtVerifier;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String path = request.getRequestURI();
    String method = request.getMethod();
    if (HttpMethod.OPTIONS.matches(method) || isPublicRequest(method, path)) {
      filterChain.doFilter(request, response);
      return;
    }

    String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing bearer token");
      return;
    }

    Map<String, Object> claims;
    try {
      claims = jwtVerifier.verify(authorization.substring("Bearer ".length()));
    } catch (IllegalArgumentException error) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid bearer token");
      return;
    }

    String role = String.valueOf(claims.get("role"));
    if (!isRoleAllowed(method, path, role)) {
      response.sendError(HttpServletResponse.SC_FORBIDDEN, "Role is not allowed for this endpoint");
      return;
    }

    Map<String, String> trustedHeaders = new HashMap<>();
    trustedHeaders.put(USER_ID_HEADER, String.valueOf(((Number) claims.get("uid")).longValue()));
    trustedHeaders.put(USERNAME_HEADER, String.valueOf(claims.get("sub")));
    trustedHeaders.put(USER_ROLE_HEADER, role);
    if ("MERCHANT".equals(role)) {
      trustedHeaders.put(MERCHANT_ID_HEADER, String.valueOf(((Number) claims.get("uid")).longValue()));
    }
    filterChain.doFilter(new TrustedHeaderRequest(request, trustedHeaders), response);
  }

  private boolean isPublicRequest(String method, String path) {
    if (path.startsWith("/actuator/") || path.equals("/actuator")) {
      return true;
    }
    if (path.equals("/auth/login") || path.equals("/auth/register")) {
      return true;
    }
    if (path.startsWith("/images/")) {
      return true;
    }
    if (path.startsWith("/assistant/")) {
      return true;
    }
    return HttpMethod.GET.matches(method)
        && (path.equals("/products") || path.matches("/products/\\d+") || path.matches("/products/\\d+/reviews"));
  }

  private boolean isRoleAllowed(String method, String path, String role) {
    if (path.startsWith("/internal/")) {
      return false;
    }
    if (path.startsWith("/admin/") || path.startsWith("/analytics/")) {
      return "MERCHANT".equals(role) || "ADMIN".equals(role);
    }
    if (path.equals("/payments") && HttpMethod.POST.matches(method)) {
      return "CUSTOMER".equals(role);
    }
    if (path.startsWith("/payments/")) {
      return "CUSTOMER".equals(role);
    }
    if (path.startsWith("/cart/") || path.equals("/checkout")) {
      return "CUSTOMER".equals(role);
    }
    if (path.matches("/products/\\d+/reviews") && HttpMethod.POST.matches(method)) {
      return "CUSTOMER".equals(role);
    }
    if (path.matches("/products/\\d+/ratings/\\d+") && HttpMethod.POST.matches(method)) {
      return "CUSTOMER".equals(role);
    }
    if (path.matches("/products/\\d+/reserve") && HttpMethod.POST.matches(method)) {
      return "CUSTOMER".equals(role) || "ADMIN".equals(role);
    }
    return "CUSTOMER".equals(role) || "MERCHANT".equals(role) || "ADMIN".equals(role);
  }

  private static class TrustedHeaderRequest extends HttpServletRequestWrapper {
    private final Map<String, String> trustedHeaders;

    TrustedHeaderRequest(HttpServletRequest request, Map<String, String> trustedHeaders) {
      super(request);
      this.trustedHeaders = trustedHeaders;
    }

    @Override
    public String getHeader(String name) {
      return trustedHeaders.getOrDefault(name, super.getHeader(name));
    }

    @Override
    public Enumeration<String> getHeaders(String name) {
      if (trustedHeaders.containsKey(name)) {
        return Collections.enumeration(Set.of(trustedHeaders.get(name)));
      }
      return super.getHeaders(name);
    }

    @Override
    public Enumeration<String> getHeaderNames() {
      Set<String> names = new LinkedHashSet<>(trustedHeaders.keySet());
      Enumeration<String> existing = super.getHeaderNames();
      while (existing.hasMoreElements()) {
        names.add(existing.nextElement());
      }
      return Collections.enumeration(names);
    }
  }
}
