import { ShoppingOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Space, Table, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../api/client';
import type { CartItem, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

export default function CartPage({ user }: Props) {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const cartQuery = useQuery({ queryKey: ['cart', user.id], queryFn: () => orderApi.cart(user.id) });
  const checkoutMutation = useMutation({
    mutationFn: orderApi.checkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      messageApi.success('Order created');
    }
  });

  const total = (cartQuery.data ?? []).reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <Space direction="vertical" size="large" className="page">
      {contextHolder}
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>Cart & Checkout</Typography.Title>
          <Typography.Text type="secondary">Checkout calls order-service, which reserves stock from catalog-service.</Typography.Text>
        </div>
      </div>
      <Card>
        <Table<CartItem>
          rowKey="id"
          dataSource={cartQuery.data ?? []}
          pagination={false}
          columns={[
            { title: 'Product', dataIndex: 'productName' },
            { title: 'Qty', dataIndex: 'quantity', width: 100 },
            { title: 'Unit Price', dataIndex: 'unitPrice', render: (value) => `$${Number(value).toFixed(2)}` },
            { title: 'Subtotal', render: (_, row) => `$${(row.unitPrice * row.quantity).toFixed(2)}` }
          ]}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}>Total</Table.Summary.Cell>
              <Table.Summary.Cell index={3}>${total.toFixed(2)}</Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
      <Card title="Shipping Details">
        <Form
          layout="vertical"
          onFinish={(values) => checkoutMutation.mutate({ userId: user.id, ...values })}
        >
          <Form.Item name="shippingAddress" label="Shipping address" rules={[{ required: true }]}>
            <Input prefix={<ShoppingOutlined />} />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Phone number" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" disabled={!cartQuery.data?.length} loading={checkoutMutation.isPending}>
            Checkout
          </Button>
        </Form>
      </Card>
    </Space>
  );
}
