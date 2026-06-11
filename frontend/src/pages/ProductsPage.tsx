import { AppstoreOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Space, Statistic, Tag, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { catalogApi, orderApi } from '../api/client';
import type { Product, UserProfile } from '../types';

interface Props {
  user: UserProfile | null;
}

export default function ProductsPage({ user }: Props) {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const productsQuery = useQuery({ queryKey: ['products'], queryFn: catalogApi.products });

  const addCartMutation = useMutation({
    mutationFn: (productId: number) => {
      if (!user) {
        throw new Error('Login required');
      }
      return orderApi.addToCart({ userId: user.id, productId, quantity: 1 });
    },
    onSuccess: () => messageApi.success('Added to cart'),
    onError: (error) => messageApi.error(error.message)
  });

  const createProductMutation = useMutation({
    mutationFn: catalogApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      messageApi.success('Product created');
    }
  });

  const canManage = user?.role === 'MERCHANT' || user?.role === 'ADMIN';

  return (
    <Space direction="vertical" size="large" className="page">
      {contextHolder}
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>Product Marketplace</Typography.Title>
          <Typography.Text type="secondary">Customer storefront backed by catalog-service inventory APIs.</Typography.Text>
        </div>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New Product</Button>
        )}
      </div>

      <Row gutter={[16, 16]}>
        {(productsQuery.data ?? []).map((product: Product) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={product.id}>
            <Card
              title={product.name}
              extra={<Tag color={product.stockQuantity <= product.lowStockThreshold ? 'red' : 'green'}>{product.category}</Tag>}
              actions={[
                <Button type="text" icon={<ShoppingCartOutlined />} onClick={() => addCartMutation.mutate(product.id)} disabled={!user}>
                  Add
                </Button>
              ]}
            >
              <Typography.Paragraph ellipsis={{ rows: 2 }}>{product.description}</Typography.Paragraph>
              <Space className="product-stats">
                <Statistic title="Price" value={product.price} prefix="$" precision={2} />
                <Statistic title="Stock" value={product.stockQuantity} />
                <Statistic title="Rating" value={product.averageRating} suffix="/5" />
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal title="Create Product" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form
          layout="vertical"
          initialValues={{ active: true, stockQuantity: 20, lowStockThreshold: 8 }}
          onFinish={(values) => createProductMutation.mutate(values)}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input prefix={<AppstoreOutlined />} />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="price" label="Price" rules={[{ required: true }]}>
                <InputNumber min={0.01} precision={2} className="full-width" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stockQuantity" label="Stock">
                <InputNumber min={0} className="full-width" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lowStockThreshold" label="Low stock">
                <InputNumber min={0} className="full-width" />
              </Form.Item>
            </Col>
          </Row>
          <Button htmlType="submit" type="primary" loading={createProductMutation.isPending}>Create</Button>
        </Form>
      </Modal>
    </Space>
  );
}
