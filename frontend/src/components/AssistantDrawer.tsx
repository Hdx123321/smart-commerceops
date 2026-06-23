import { useState, useRef, useCallback } from 'react';
import {
  Alert,
  Button,
  Drawer,
  Input,
  message,
  Space,
  Spin,
  Typography,
} from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import type { UserProfile, AssistantRecommendResult } from '../types';
import { streamAssistantRecommend } from '../api/assistantStream';
import { orderApi, apiErrorMessage } from '../api/client';
import AssistantRecommendationCard from './AssistantRecommendationCard';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface Props {
  user: UserProfile | null;
  open: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  result?: AssistantRecommendResult;
  error?: string;
  isStreaming?: boolean;
}

export default function AssistantDrawer({ user, open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const canAddToCart = user?.role === 'CUSTOMER';

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    setQuery('');

    const userMsg: ChatMessage = { role: 'user', text: trimmed };
    const assistantMsg: ChatMessage = { role: 'assistant', text: '', isStreaming: true };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);
    scrollToBottom();

    const controller = streamAssistantRecommend(
      { query: trimmed },
      // onToken
      (text) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.isStreaming) {
            updated[updated.length - 1] = { ...last, text: last.text + text };
          }
          return updated;
        });
        scrollToBottom();
      },
      // onResult
      (result) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.isStreaming) {
            updated[updated.length - 1] = {
              ...last,
              isStreaming: false,
              result,
              text: result.summary || last.text,
            };
          }
          return updated;
        });
        setIsLoading(false);
        scrollToBottom();
      },
      // onError
      (errorMsg) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.isStreaming) {
            updated[updated.length - 1] = {
              ...last,
              isStreaming: false,
              error: errorMsg,
            };
          }
          return updated;
        });
        setIsLoading(false);
        scrollToBottom();
      },
      // onDone
      () => {
        setIsLoading(false);
      },
    );

    abortRef.current = controller;
  }, [query, isLoading, scrollToBottom]);

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    onClose();
  }, [onClose]);

  const handleAddToCart = useCallback(
    async (productId: number) => {
      if (!user) {
        messageApi.info('请先登录后再加入购物车');
        return;
      }
      try {
        await orderApi.addToCart({ userId: user.id, productId, quantity: 1 });
        messageApi.success('已加入购物车');
      } catch (err) {
        messageApi.error(apiErrorMessage(err, '加入购物车失败'));
      }
    },
    [user, messageApi],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <>
      {contextHolder}
      <Drawer
        title={
          <Space>
            <RobotOutlined />
            <span>AI 智能导购</span>
          </Space>
        }
        placement="right"
        width={480}
        open={open}
        onClose={handleClose}
        styles={{
          body: {
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          },
          wrapper: {
            maxWidth: '100vw',
          },
        }}
      >
        {/* Messages area */}
        <div className="assistant-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', marginTop: 80 }}>
              <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <Paragraph type="secondary">
                告诉我你想买什么，我来帮你从真实商品中智能推荐~
              </Paragraph>
              <Text type="secondary" style={{ fontSize: 12 }}>
                示例：我想买适合跑步的鞋，预算100新币
              </Text>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`assistant-message ${msg.role}`}>
              <div className="assistant-message-avatar">
                {msg.role === 'user' ? (
                  <UserOutlined style={{ fontSize: 16 }} />
                ) : (
                  <RobotOutlined style={{ fontSize: 16 }} />
                )}
              </div>
              <div className="assistant-message-bubble">
                {msg.text && (
                  <Text style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                    {msg.isStreaming && <span className="assistant-cursor">▌</span>}
                  </Text>
                )}
                {msg.isStreaming && !msg.text && <Spin size="small" />}
                {msg.error && (
                  <Alert
                    type="error"
                    message={msg.error}
                    style={{ marginTop: 8 }}
                    showIcon
                  />
                )}
                {msg.result && msg.result.recommendations.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {msg.result.recommendations.map((item) => (
                      <AssistantRecommendationCard
                        key={item.productId}
                        item={item}
                        canAddToCart={canAddToCart}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                )}
                {msg.result && msg.result.recommendations.length === 0 && !msg.error && (
                  <Alert
                    type="info"
                    message="没有找到完全匹配的商品，请尝试调整需求描述。"
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="assistant-input">
          <TextArea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你想买的商品…"
            maxLength={500}
            autoSize={{ minRows: 1, maxRows: 3 }}
            disabled={isLoading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isLoading}
            disabled={!query.trim()}
          />
        </div>
      </Drawer>
    </>
  );
}
