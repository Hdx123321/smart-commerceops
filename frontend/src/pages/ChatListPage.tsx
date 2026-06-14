import { MessageOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Empty, List, Space, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { chatApi } from '../api/client';
import type { Conversation, ConversationContextType, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

const contextLabels: Record<ConversationContextType, string> = {
  PRODUCT: '商品',
  ORDER: '订单',
  AFTER_SALES: '售后',
  GENERAL: '普通'
};
const CHAT_POLL_INTERVAL_MS = 2000;

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '暂无消息';
}

export default function ChatListPage({ user }: Props) {
  const conversationsQuery = useQuery({
    queryKey: ['chat-conversations', user.role, user.role === 'MERCHANT' ? (user.merchantId ?? user.id) : user.id],
    queryFn: () => {
      if (user.role === 'ADMIN') return chatApi.conversations();
      if (user.role === 'MERCHANT') return chatApi.conversations({ merchantId: user.merchantId ?? user.id });
      return chatApi.conversations({ customerId: user.id });
    },
    refetchInterval: CHAT_POLL_INTERVAL_MS
  });

  const conversations = conversationsQuery.data ?? [];

  return (
    <Space direction="vertical" size="large" className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>Messages</Typography.Title>
          <Typography.Text type="secondary">
            {user.role === 'CUSTOMER' ? 'Chat with merchants about products, orders, and after-sales.' : 'Review customer conversations and reply from your merchant inbox.'}
          </Typography.Text>
        </div>
      </div>

      <Card loading={conversationsQuery.isLoading}>
        {conversations.length === 0 ? (
          <Empty description="No conversations yet" />
        ) : (
          <List<Conversation>
            dataSource={conversations}
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
