package com.smartcommerce.identity.api;

import com.smartcommerce.identity.domain.UserAccount;

public record MerchantResponse(
    Long merchantId,
    String merchantName,
    String merchantDescription,
    String merchantContact,
    String merchantAddress
) {
  public static MerchantResponse from(UserAccount user) {
    String name = user.getMerchantName() == null || user.getMerchantName().isBlank()
        ? user.getUsername() + " Store"
        : user.getMerchantName();
    return new MerchantResponse(
        user.getId(),
        name,
        user.getMerchantDescription(),
        user.getMerchantContact(),
        user.getMerchantAddress()
    );
  }
}
