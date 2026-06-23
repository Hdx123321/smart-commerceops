package com.smartcommerce.chat.repository;

import com.smartcommerce.chat.domain.Conversation;
import com.smartcommerce.chat.domain.ConversationContextType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
  Optional<Conversation> findFirstByCustomerIdAndMerchantIdAndContextTypeAndContextIdOrderByCreatedAtDesc(
      Long customerId, Long merchantId, ConversationContextType contextType, Long contextId);
  List<Conversation> findByCustomerIdOrderByLastMessageAtDescUpdatedAtDesc(Long customerId);
  List<Conversation> findByMerchantIdOrderByLastMessageAtDescUpdatedAtDesc(Long merchantId);
  List<Conversation> findAllByOrderByLastMessageAtDescUpdatedAtDesc();
  Page<Conversation> findByCustomerId(Long customerId, Pageable pageable);
  Page<Conversation> findByMerchantId(Long merchantId, Pageable pageable);
}
