import { MessageOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Empty, List, Space, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { chatApi } from '../api/client';
import { subscribeChat } from '../api/chatSocketClient';
import { useChatSocket } from '../hooks/useChatSocket';
import type { Conversation, ConversationContextType, PageResponse, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

const contextLabels: Record<ConversationContextType, string> = {
  PRODUCT: '商品',
  ORDER: '订单',
  AFTER_SALES: '售后',
  GENERAL: '普通'
};
const CHAT_FALLBACK_POLL_INTERVAL_MS = 15000;

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '暂无消息';
}

export default function ChatListPage({ user }: Props) {
  const queryClient = useQueryClient();
  const { connected } = useChatSocket();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const conversationQueryKey = ['chat-conversations', user.role, user.role === 'MERCHANT' ? (user.merchantId ?? user.id) : user.id, page, pageSize];
  const conversationsQuery = useQuery({
    queryKey: conversationQueryKey,
    queryFn: () => {
      const pagination = { page: page - 1, size: pageSize };
      if (user.role === 'ADMIN') return chatApi.conversations(pagination);
      if (user.role === 'MERCHANT') return chatApi.conversations({ merchantId: user.merchantId ?? user.id, ...pagination });
      return chatApi.conversations({ customerId: user.id, ...pagination });
    },
    refetchInterval: connected ? false : CHAT_FALLBACK_POLL_INTERVAL_MS
  });

  useEffect(() => {
    if (!connected) return;
    const subscription = subscribeChat('/user/queue/chat-events', (event) => {
      if (!event.conversation) return;
      queryClient.setQueryData<PageResponse<Conversation>>(conversationQueryKey, (current) => {
        const currentPage = current ?? { content: [], totalElements: 0, totalPages: 0, page: page - 1, size: pageSize };
        const next = currentPage.content.filter((item) => item.id !== event.conversation?.id);
        next.push(event.conversation as Conversation);
        const content = next.sort((left, right) => {
          const leftTime = new Date(left.lastMessageAt ?? left.updatedAt).getTime();
          const rightTime = new Date(right.lastMessageAt ?? right.updatedAt).getTime();
          return rightTime - leftTime;
        }).slice(0, pageSize);
        return { ...currentPage, content, totalElements: Math.max(currentPage.totalElements, content.length) };
      });
    });
    return () => subscription.unsubscribe();
  }, [connected, conversationQueryKey, page, queryClient, user.id, user.merchantId, user.role]);

  const conversations = conversationsQuery.data?.content ?? [];

  return (
    <Space direction="vertical" size="large" className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>Messages</Typography.Title>
          <Typography.Text type="secondary">
            {user.role === 'CUSTOMER' ? 'Chat with merchants about products, orders, and after-sales.' : 'Review customer conversations and reply from your merchant inbox.'}
          </Typography.Text>
          <div><Tag color={connected ? 'green' : 'orange'}>{connected ? 'Live' : 'Reconnecting'}</Tag></div>
        </div>
      </div>

      <Card loading={conversationsQuery.isLoading}>
        {conversations.length === 0 ? (
          <Empty description="No conversations yet" />
        ) : (
          <List<Conversation>
            dataSource={conversations}
            pagination={{
              current: page,
              pageSize,
              total: conversationsQuery.data?.totalElements ?? conversations.length,
              onChange: setPage
            }}
            renderItem={(conversation) => (
              <List.Item
                actions={[
                  <Button key="open" type="link">
                    <Link to={`/chat/${conversation.id}`}>Open</Link>
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Badge count={conversation.unreadCount} size="small"><MessageOutlined className="chat-list-icon" /></Badge>}
                  title={(
                    <Space wrap>
                      <Link to={`/chat/${conversation.id}`}>{conversation.merchantName}</Link>
                      <Tag>{contextLabels[conversation.contextType]}</Tag>
                    </Space>
                  )}
                  description={(
                    <Space direction="vertical" size={2}>
                      <Typography.Text>{conversation.contextTitle || 'General conversation'}</Typography.Text>
                      <Typography.Text type="secondary">{conversation.lastMessagePreview || 'No messages yet'}</Typography.Text>
                      <Typography.Text type="secondary">{formatDate(conversation.lastMessageAt ?? conversation.updatedAt)}</Typography.Text>
                    </Space>
                  )}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  );
}
