package com.smartcommerce.chat.api;

import com.smartcommerce.chat.domain.ConversationContextType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateConversationRequest(
    @NotNull Long customerId,
    @NotNull Long merchantId,
    @NotBlank String merchantName,
    @NotNull ConversationContextType contextType,
    Long contextId,
    String contextTitle
) {
}
