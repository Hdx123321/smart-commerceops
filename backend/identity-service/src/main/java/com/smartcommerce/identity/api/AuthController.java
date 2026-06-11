package com.smartcommerce.identity.api;

import com.smartcommerce.identity.domain.Role;
import com.smartcommerce.identity.domain.UserAccount;
import com.smartcommerce.identity.repository.UserAccountRepository;
import com.smartcommerce.identity.security.JwtSupport;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final UserAccountRepository users;
  private final BCryptPasswordEncoder passwordEncoder;
  private final JwtSupport jwtSupport;

  public AuthController(UserAccountRepository users, BCryptPasswordEncoder passwordEncoder, JwtSupport jwtSupport) {
    this.users = users;
    this.passwordEncoder = passwordEncoder;
    this.jwtSupport = jwtSupport;
  }

  @PostMapping("/register")
  public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
    if (users.existsByUsername(request.username()) || users.existsByEmail(request.email())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username or email already exists");
    }
    Role role = request.role() == null ? Role.CUSTOMER : request.role();
    UserAccount user = users.save(new UserAccount(
        request.username(),
        request.email(),
        passwordEncoder.encode(request.password()),
        role
    ));
    return authResponse(user);
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest request) {
    UserAccount user = users.findByUsername(request.username())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    return authResponse(user);
  }

  @GetMapping("/me")
  public UserProfile me(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
    String token = authorization.replace("Bearer ", "");
    Map<String, Object> claims = jwtSupport.verify(token);
    Number uid = (Number) claims.get("uid");
    return users.findById(uid.longValue()).map(this::profile)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
  }

  private AuthResponse authResponse(UserAccount user) {
    return new AuthResponse(jwtSupport.createToken(user.getId(), user.getUsername(), user.getRole()), profile(user));
  }

  private UserProfile profile(UserAccount user) {
    return new UserProfile(user.getId(), user.getUsername(), user.getEmail(), user.getRole());
  }
}
