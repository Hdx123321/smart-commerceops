package com.smartcommerce.identity.api;

import com.smartcommerce.identity.domain.Role;
import com.smartcommerce.identity.domain.UserAccount;
import com.smartcommerce.identity.repository.UserAccountRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/merchants")
public class MerchantController {
  private final UserAccountRepository users;

  public MerchantController(UserAccountRepository users) {
    this.users = users;
  }

  @GetMapping("/{merchantId}")
  public MerchantResponse merchant(@PathVariable Long merchantId) {
    UserAccount merchant = users.findByIdAndRole(merchantId, Role.MERCHANT)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Merchant not found"));
    return MerchantResponse.from(merchant);
  }

  @GetMapping
  public PageResponse<MerchantResponse> merchants(@RequestParam(required = false) String search,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "12") int size) {
    PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 50)), Sort.by(Sort.Direction.ASC, "merchantName"));
    Page<UserAccount> result = search == null || search.isBlank()
        ? users.findByRole(Role.MERCHANT, pageable)
        : users.searchMerchants(Role.MERCHANT, search.trim(), pageable);
    return PageResponse.from(result, result.stream().map(MerchantResponse::from).toList());
  }
}
