CREATE INDEX idx_conversations_customer_last_message ON conversations(customer_id, last_message_at, updated_at);
CREATE INDEX idx_conversations_merchant_last_message ON conversations(merchant_id, last_message_at, updated_at);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id, id);
CREATE INDEX idx_conversation_reads_reader ON conversation_reads(reader_id);
