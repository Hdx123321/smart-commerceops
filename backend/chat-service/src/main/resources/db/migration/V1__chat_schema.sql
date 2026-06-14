CREATE TABLE conversations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  merchant_id BIGINT NOT NULL,
  merchant_name VARCHAR(160) NOT NULL,
  context_type VARCHAR(30) NOT NULL,
  context_id BIGINT NULL,
  context_title VARCHAR(220) NULL,
  last_message_preview VARCHAR(300) NULL,
  last_message_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_merchant ON conversations(merchant_id);
CREATE INDEX idx_conversations_context ON conversations(customer_id, merchant_id, context_type, context_id);

CREATE TABLE chat_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  sender_role VARCHAR(30) NOT NULL,
  sender_name VARCHAR(120) NOT NULL,
  content VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);

CREATE TABLE conversation_reads (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  reader_id BIGINT NOT NULL,
  last_read_at TIMESTAMP NOT NULL,
  CONSTRAINT uk_conversation_reader UNIQUE (conversation_id, reader_id)
);
