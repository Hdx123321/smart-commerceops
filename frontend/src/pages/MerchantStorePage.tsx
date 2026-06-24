import { MessageOutlined, ShopOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Descriptions, Image, Row, Skeleton, Space, Tag, Typography, message } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiErrorMessage, catalogApi, chatApi, merchantApi } from '../api/client';
import type { Product, UserProfile } from '../types';

interface Props {
  user: UserProfile | null;
}

export default function MerchantStorePage({ user }: Props) {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const id = Number(merchantId);

  const merchantQuery = useQuery({
    queryKey: ['merchant', id],
    queryFn: () => merchantApi.merchant(id),
    enabled: Number.isFinite(id)
  });

  const productsQuery = useQuery({
    queryKey: ['merchant-products', id],
    queryFn: () => catalogApi.products({ merchantId: id, size: 100 }),
    enabled: Number.isFinite(id)
  });

  const merchant = merchantQuery.data;
  const products = productsQuery.data?.content ?? [];

  const contactMerchant = useMutation({
    mutationFn: async () => {
      if (!user || user.role !== 'CUSTOMER' || !merchant) {
        throw new Error('Login as a customer to contact this merchant');
      }
      return chatApi.createConversation({
        customerId: user.id,
        merchantId: merchant.merchantId,
        merchantName: merchant.merchantName,
        contextType: 'GENERAL',
        contextTitle: merchant.merchantName
      });
    },
    onSuccess: (conversation) => navigate(`/chat/${conversation.id}`),
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Contact merchant failed'))
  });

  return (
    <Space direction="vertical" size="large" className="page">
      {contextHolder}
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>{merchant?.merchantName ?? 'Merchant Store'}</Typography.Title>
          <Typography.Text type="secondary">Browse store profile and active products from this merchant.</Typography.Text>
        </div>
        <Link to="/products">Back to marketplace</Link>
      </div>

      {merchantQuery.isError && <Alert type="error" showIcon message={apiErrorMessage(merchantQuery.error, 'Merchant failed to load')} />}

      <Card loading={merchantQuery.isLoading}>
        {merchant && (
          <Space direction="vertical" size="middle" className="full-width">
            <Space>
              <ShopOutlined />
              <Typography.Title level={4} className="cart-total">{merchant.merchantName}</Typography.Title>
            </Space>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="About">{merchant.merchantDescription || 'No store description yet.'}</Descriptions.Item>
              <Descriptions.Item label="Contact">{merchant.merchantContact || 'Not provided'}</Descriptions.Item>
              <Descriptions.Item label="Address">{merchant.merchantAddress || 'Not provided'}</Descriptions.Item>
            </Descriptions>
            <Button
              icon={<MessageOutlined />}
              disabled={user?.role !== 'CUSTOMER'}
              loading={contactMerchant.isPending}
              onClick={() => contactMerchant.mutate()}
            >
              Contact store
            </Button>
          </Space>
        )}
      </Card>

      <Typography.Title level={3}>Store Products</Typography.Title>
      <Row gutter={[16, 16]}>
        {productsQuery.isLoading && Array.from({ length: 4 }).map((_, index) => (
          <Col xs={24} sm={12} lg={6} key={index}><Card><Skeleton active /></Card></Col>
        ))}
        {products.map((product: Product) => (
          <Col xs={24} sm={12} lg={6} key={product.id}>
            <Card
              className="product-card-fixed"
              title={product.name}
              extra={<Tag className="pill-tag-mint">{product.category}</Tag>}
              cover={product.imageUrls?.[0] ? (
                <Image src={product.imageUrls[0]} alt={product.name} className="product-image-fixed" preview={false} loading="lazy" />
              ) : undefined}
              actions={[<Link to={`/products/${product.id}`}>View details</Link>]}
            >
              <Typography.Paragraph ellipsis={{ rows: 2 }}>{product.description || 'No description'}</Typography.Paragraph>
              <Typography.Text strong>${product.price.toFixed(2)}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
