package com.smartcommerce.identity.repository;

import com.smartcommerce.identity.domain.UserAccount;
import com.smartcommerce.identity.domain.Role;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
  Optional<UserAccount> findByUsername(String username);
  boolean existsByUsername(String username);
  boolean existsByEmail(String email);
  Optional<UserAccount> findByIdAndRole(Long id, Role role);
  @Query("""
      select u from UserAccount u
      where u.role = :role
        and (
          lower(coalesce(u.merchantName, '')) like lower(concat('%', :search, '%'))
          or lower(coalesce(u.merchantDescription, '')) like lower(concat('%', :search, '%'))
        )
      """)
  Page<UserAccount> searchMerchants(@Param("role") Role role, @Param("search") String search, Pageable pageable);
  Page<UserAccount> findByRole(Role role, Pageable pageable);
}
