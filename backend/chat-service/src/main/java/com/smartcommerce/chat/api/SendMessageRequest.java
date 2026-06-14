package com.smartcommerce.chat.api;

import com.smartcommerce.chat.domain.SenderRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
    @NotNull Long senderId,
    @NotNull SenderRole senderRole,
    @NotBlank String senderName,
    @NotBlank @Size(max = 2000) String content
) {
}
