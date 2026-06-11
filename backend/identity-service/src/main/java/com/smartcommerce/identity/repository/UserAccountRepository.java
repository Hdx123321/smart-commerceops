package com.smartcommerce.identity.repository;

import com.smartcommerce.identity.domain.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
  Optional<UserAccount> findByUsername(String username);
  boolean existsByUsername(String username);
  boolean existsByEmail(String email);
}
