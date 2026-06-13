import { ShoppingCartOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Descriptions, Form, Input, InputNumber, List, Rate, Row, Space, Statistic, Tag, Typography, message } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { apiErrorMessage, catalogApi, orderApi } from '../api/client';
import type { ProductReviewRequest, UserProfile } from '../types';

interface Props {
  user: UserProfile | null;
}

export default function ProductDetailPage({ user }: Props) {
  const { productId } = useParams();
  const id = Number(productId);
  const queryClient = useQueryClient();
  const [reviewForm] = Form.useForm<ProductReviewRequest>();
  const [cartForm] = Form.useForm<{ quantity: number }>();
  const [messageApi, contextHolder] = message.useMessage();
  const productQuery = useQuery({ queryKey: ['product', id], queryFn: () => catalogApi.product(id), enabled: Number.isFinite(id) });
  const reviewsQuery = useQuery({ queryKey: ['product-reviews', id], queryFn: () => catalogApi.reviews(id), enabled: Number.isFinite(id) });
  const product = productQuery.data;
  const canShop = user?.role === 'CUSTOMER';

  const addToCart = useMutation({
    mutationFn: ({ quantity }: { quantity: number }) => {
      if (!user || !product) {
        throw new Error('Login required');
      }
      return orderApi.addToCart({ userId: user.id, productId: product.id, quantity });
    },
    onSuccess: () => {
      messageApi.success('Added to cart');
      cartForm.setFieldsValue({ quantity: 1 });
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Add to cart failed'))
  });

  const createReview = useMutation({
    mutationFn: (values: ProductReviewRequest) => catalogApi.createReview(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-reviews', id] });
      reviewForm.resetFields();
      messageApi.success('Review submitted');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Review failed'))
  });

  if (!productQuery.isLoading && !product) {
    return (
      <Space direction="vertical" size="large" className="page">
        <Alert type="error" showIcon message="Product not found" />
        <Link to="/products">Back to products</Link>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" className="page">
      {contextHolder}
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>{product?.name ?? 'Product details'}</Typography.Title>
          <Typography.Text type="secondary">Review the product, merchant, inventory, and customer feedback before checkout.</Typography.Text>
        </div>
        <Link to="/products">Back to marketplace</Link>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card loading={productQuery.isLoading}>
            {product && (
              <Space direction="vertical" size="large" className="full-width">
                <Space>
                  <Tag>{product.category}</Tag>
                  <Tag color={product.stockQuantity <= product.lowStockThreshold ? 'red' : 'green'}>
                    {product.stockQuantity <= product.lowStockThreshold ? 'Low stock' : 'In stock'}
                  </Tag>
                </Space>
                <Typography.Paragraph>{product.description}</Typography.Paragraph>
                <Row gutter={[16, 16]}>
                  <Col xs={12} md={6}><Statistic title="Price" value={product.price} prefix="$" precision={2} /></Col>
                  <Col xs={12} md={6}><Statistic title="Stock" value={product.stockQuantity} /></Col>
                  <Col xs={12} md={6}><Statistic title="Rating" value={product.averageRating} suffix="/5" /></Col>
                  <Col xs={12} md={6}><Statistic title="Reviews" value={product.ratingCount} /></Col>
                </Row>
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Merchant" loading={productQuery.isLoading}>
            {product && (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Name">{product.merchantName}</Descriptions.Item>
                <Descriptions.Item label="Contact">{product.merchantContact || 'Not provided'}</Descriptions.Item>
                <Descriptions.Item label="About">{product.merchantDescription || 'Platform managed merchant profile.'}</Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Add to cart">
        {!user && <Alert type="info" showIcon className="stacked-alert" message="Login as a customer to add this product to cart." />}
        {user && !canShop && <Alert type="warning" showIcon className="stacked-alert" message="Only customer accounts can add products to cart." />}
        <Form form={cartForm} layout="inline" initialValues={{ quantity: 1 }} onFinish={(values) => addToCart.mutate(values)}>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true, type: 'number', min: 1 }]}>
            <InputNumber min={1} max={product?.stockQuantity ?? undefined} />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<ShoppingCartOutlined />} disabled={!canShop || !product} loading={addToCart.isPending}>
            Add to cart
          </Button>
        </Form>
      </Card>

      <Card title="Customer Reviews">
        {canShop && (
          <Form
            form={reviewForm}
            layout="vertical"
            initialValues={{ rating: 5 }}
            onFinish={(values) => createReview.mutate({ ...values, userId: user.id, username: user.username })}
          >
            <Form.Item name="rating" label="Rating" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
            <Form.Item name="comment" label="Comment">
              <Input.TextArea rows={3} maxLength={1000} />
            </Form.Item>
            <Button htmlType="submit" type="primary" loading={createReview.isPending}>Submit review</Button>
          </Form>
        )}
        <List
          loading={reviewsQuery.isLoading}
          dataSource={reviewsQuery.data ?? []}
          locale={{ emptyText: 'No reviews yet' }}
          renderItem={(review) => (
            <List.Item>
              <List.Item.Meta
                title={<Space><Typography.Text>{review.username}</Typography.Text><Rate disabled value={review.rating} /></Space>}
                description={review.comment || 'No comment'}
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
