import { SendOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Empty, Form, Input, Space, Tag, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { apiErrorMessage, chatApi } from '../api/client';
import { publishChat, subscribeChat } from '../api/chatSocketClient';
import { useChatSocket } from '../hooks/useChatSocket';
import type { ChatMessage, ConversationContextType, SenderRole, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

interface MessageFormValues {
  content: string;
}

const contextLabels: Record<ConversationContextType, string> = {
  PRODUCT: '商品',
  ORDER: '订单',
  AFTER_SALES: '售后',
  GENERAL: '普通'
};
const CHAT_FALLBACK_POLL_INTERVAL_MS = 15000;

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '';
}

function contextLink(contextType: ConversationContextType, contextId?: number) {
  if (!contextId) return null;
  if (contextType === 'PRODUCT') return `/products/${contextId}`;
  if (contextType === 'ORDER') return `/orders/${contextId}`;
  if (contextType === 'AFTER_SALES') return `/after-sales/${contextId}`;
  return null;
}

export default function ChatDetailPage({ user }: Props) {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<MessageFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const { connected } = useChatSocket();
  const lastMarkedReadId = useRef<number | null>(null);
  const id = Number(conversationId);

  const conversationQuery = useQuery({
    queryKey: ['chat-conversation', id, user.id],
    queryFn: () => chatApi.conversation(id, user.id),
    enabled: Number.isFinite(id),
    refetchInterval: connected ? false : CHAT_FALLBACK_POLL_INTERVAL_MS
  });

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', id],
    queryFn: () => chatApi.messages(id, { limit: 50 }),
    enabled: Number.isFinite(id),
    refetchInterval: connected ? false : CHAT_FALLBACK_POLL_INTERVAL_MS
  });

  const conversation = conversationQuery.data;
  const ownsConversation = !!conversation && (
    user.role === 'ADMIN'
    || (user.role === 'CUSTOMER' && conversation.customerId === user.id)
    || (user.role === 'MERCHANT' && conversation.merchantId === (user.merchantId ?? user.id))
  );

  const markRead = useMutation({
    mutationFn: async () => {
      if (connected) {
        publishChat(`/app/chat/conversations/${id}/read`);
        return;
      }
      await chatApi.markRead(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversation', id, user.id] });
    }
  });

  useEffect(() => {
    const latest = messagesQuery.data?.at(-1);
    if (ownsConversation && latest && latest.id !== lastMarkedReadId.current) {
      lastMarkedReadId.current = latest.id;
      markRead.mutate();
    }
  }, [messagesQuery.data?.at(-1)?.id, ownsConversation, connected]);

  useEffect(() => {
    if (!connected || !ownsConversation) return;
    const subscription = subscribeChat(`/topic/chat/conversations/${id}`, (event) => {
      if (!event.message) return;
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', id], (current = []) => {
        if (current.some((item) => item.id === event.message?.id)) return current;
        return [...current, event.message as ChatMessage];
      });
      if (event.conversation) {
        queryClient.setQueryData(['chat-conversation', id, user.id], event.conversation);
      }
    });
    void queryClient.invalidateQueries({ queryKey: ['chat-messages', id] });
    return () => subscription.unsubscribe();
  }, [connected, id, ownsConversation, queryClient, user.id]);

  const sendMessage = useMutation({
    mutationFn: async (values: MessageFormValues) => {
      if (connected) {
        publishChat(`/app/chat/conversations/${id}/messages`, { content: values.content });
        return true;
      }
      await chatApi.sendMessage(id, {
        senderId: user.id,
        senderRole: user.role as SenderRole,
        senderName: user.username,
        content: values.content
      });
      return false;
    },
    onSuccess: (realtime) => {
      form.resetFields();
      if (!realtime) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', id] });
        queryClient.invalidateQueries({ queryKey: ['chat-conversation', id, user.id] });
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      }
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Send message failed'))
  });

  const link = conversation ? contextLink(conversation.contextType, conversation.contextId) : null;
  const canSend = ownsConversation && user.role !== 'ADMIN';
  const messages = messagesQuery.data ?? [];

  return (
    <Space direction="vertical" size="large" className="page">
      {contextHolder}
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>Conversation</Typography.Title>
          <Typography.Text type="secondary">Messages are persisted and delivered in real time.</Typography.Text>
          <div><Tag color={connected ? 'green' : 'orange'}>{connected ? 'Live' : 'Reconnecting; REST fallback active'}</Tag></div>
        </div>
        <Button onClick={() => navigate('/chat')}>Back to messages</Button>
      </div>

      {conversationQuery.isError && (
        <Alert type="error" showIcon message={apiErrorMessage(conversationQuery.error, 'Conversation failed to load')} />
      )}
      {!ownsConversation && conversation && (
        <Alert type="error" showIcon message="You do not have access to this conversation." />
      )}

      <Card loading={conversationQuery.isLoading}>
        {conversation && ownsConversation && (
          <Space direction="vertical" size={4}>
            <Space wrap>
              <Typography.Title level={4} className="cart-total">{conversation.merchantName}</Typography.Title>
              <Tag>{contextLabels[conversation.contextType]}</Tag>
            </Space>
            <Typography.Text type="secondary">
              {link ? <Link to={link}>{conversation.contextTitle || 'Open related context'}</Link> : (conversation.contextTitle || 'General conversation')}
            </Typography.Text>
          </Space>
        )}
      </Card>

      {conversation && ownsConversation && (
        <Card>
          {messages.length === 0 ? (
            <Empty description="No messages yet" />
          ) : (
            <Space direction="vertical" size="middle" className="full-width">
              {messages.map((item: ChatMessage) => {
                const mine = item.senderId === user.id;
                return (
                  <div key={item.id} className={mine ? 'chat-message chat-message-mine' : 'chat-message'}>
                    <Space direction="vertical" size={2}>
                      <Typography.Text type="secondary">{item.senderName} · {formatDate(item.createdAt)}</Typography.Text>
                      <Typography.Text>{item.content}</Typography.Text>
                    </Space>
                  </div>
                );
              })}
            </Space>
          )}
        </Card>
      )}

      {conversation && ownsConversation && (
        <Card>
          {canSend ? (
            <Form form={form} layout="inline" onFinish={(values) => sendMessage.mutate(values)} className="chat-compose">
              <Form.Item name="content" rules={[{ required: true, message: 'Please enter a message' }]} className="chat-compose-input">
                <Input.TextArea rows={2} maxLength={2000} placeholder="Type a message" />
              </Form.Item>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sendMessage.isPending}>
                Send
              </Button>
            </Form>
          ) : (
            <Alert type="info" showIcon message="Admin view is read-only in v1." />
          )}
        </Card>
      )}
    </Space>
  );
}
