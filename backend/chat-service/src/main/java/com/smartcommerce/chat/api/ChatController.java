package com.smartcommerce.chat.api;

import com.smartcommerce.chat.domain.SenderRole;
import com.smartcommerce.chat.service.ChatService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/chat")
public class ChatController {
  private static final String USER_ID_HEADER = "X-User-Id";
  private static final String USER_ROLE_HEADER = "X-User-Role";
  private static final String MERCHANT_ID_HEADER = "X-Merchant-Id";

  private final ChatService chatService;

  public ChatController(ChatService chatService) {
    this.chatService = chatService;
  }

  @PostMapping("/conversations")
  public ConversationResponse createConversation(@Valid @RequestBody CreateConversationRequest request,
                                                 @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                                 @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                                 @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireAuth(currentUserId, currentRole, currentMerchantId);
    if (!auth.isCustomer() || !auth.userId().equals(request.customerId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the customer can create this conversation");
    }
    return chatService.createOrReuse(request);
  }

  @GetMapping("/conversations")
  public List<ConversationResponse> conversations(@RequestParam(required = false) Long customerId,
                                                  @RequestParam(required = false) Long merchantId,
                                                  @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                                  @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                                  @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireAuth(currentUserId, currentRole, currentMerchantId);
    if (auth.isCustomer()) {
      customerId = auth.userId();
      merchantId = null;
    } else if (auth.isMerchant()) {
      customerId = null;
      merchantId = auth.merchantIdOrUserId();
    }
    return chatService.list(customerId, merchantId);
  }

  @GetMapping("/conversations/{id}")
  public ConversationResponse conversation(@PathVariable Long id, @RequestParam(required = false) Long readerId,
                                           @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                           @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                           @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireAuth(currentUserId, currentRole, currentMerchantId);
    ConversationResponse conversation = chatService.get(id, auth.readerId());
    requireConversationAccess(auth, conversation);
    return conversation;
  }

  @GetMapping("/conversations/{id}/messages")
  public List<ChatMessageResponse> messages(@PathVariable Long id,
                                            @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                            @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                            @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireAuth(currentUserId, currentRole, currentMerchantId);
    requireConversationAccess(auth, chatService.get(id, auth.readerId()));
    return chatService.messages(id);
  }

  @PostMapping("/conversations/{id}/messages")
  public ChatMessageResponse sendMessage(@PathVariable Long id, @Valid @RequestBody SendMessageRequest request,
                                         @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                         @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                         @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireAuth(currentUserId, currentRole, currentMerchantId);
    requireConversationAccess(auth, chatService.get(id, auth.readerId()));
    if (auth.isAdmin()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin users can only audit conversations");
    }
    SendMessageRequest trustedRequest = new SendMessageRequest(
        auth.readerId(),
        SenderRole.valueOf(auth.role()),
        request.senderName(),
        request.content()
    );
    return chatService.send(id, trustedRequest);
  }

  @PutMapping("/conversations/{id}/read")
  public ConversationResponse markRead(@PathVariable Long id, @RequestParam(required = false) Long readerId,
                                       @RequestHeader(name = USER_ID_HEADER, required = false) String currentUserId,
                                       @RequestHeader(name = USER_ROLE_HEADER, required = false) String currentRole,
                                       @RequestHeader(name = MERCHANT_ID_HEADER, required = false) String currentMerchantId) {
    AuthContext auth = requireAuth(currentUserId, currentRole, currentMerchantId);
    requireConversationAccess(auth, chatService.get(id, auth.readerId()));
    return chatService.markRead(id, auth.readerId());
  }

  private AuthContext requireAuth(String userId, String role, String merchantId) {
    if (userId == null || role == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user headers are required");
    }
    return new AuthContext(Long.parseLong(userId), role, merchantId == null || merchantId.isBlank() ? null : Long.parseLong(merchantId));
  }

  private void requireConversationAccess(AuthContext auth, ConversationResponse conversation) {
    if (auth.isAdmin()) {
      return;
    }
    if (auth.isCustomer() && auth.userId().equals(conversation.customerId())) {
      return;
    }
    if (auth.isMerchant() && auth.merchantIdOrUserId().equals(conversation.merchantId())) {
      return;
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation is outside current user scope");
  }

  private record AuthContext(Long userId, String role, Long merchantId) {
    boolean isCustomer() {
      return "CUSTOMER".equals(role);
    }

    boolean isMerchant() {
      return "MERCHANT".equals(role);
    }

    boolean isAdmin() {
      return "ADMIN".equals(role);
    }

    Long merchantIdOrUserId() {
      return merchantId == null ? userId : merchantId;
    }

    Long readerId() {
      return isMerchant() ? merchantIdOrUserId() : userId;
    }
  }
}
