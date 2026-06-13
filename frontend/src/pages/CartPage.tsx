import { ShoppingOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Space, Table, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { authApi, orderApi } from '../api/client';
import type { CartItem, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

export default function CartPage({ user }: Props) {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const cartQuery = useQuery({ queryKey: ['cart', user.id], queryFn: () => orderApi.cart(user.id) });
  const profileQuery = useQuery({ queryKey: ['profile', user.id], queryFn: authApi.me, initialData: user });
  const checkoutMutation = useMutation({
    mutationFn: () => orderApi.checkout({
      userId: user.id,
      shippingAddress: profile.shippingAddress ?? '',
      phoneNumber: profile.phoneNumber ?? ''
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      messageApi.success('Order created');
    }
  });

  const profile = profileQuery.data;
  const hasShippingProfile = !!profile.shippingAddress?.trim() && !!profile.phoneNumber?.trim();
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
        {!hasShippingProfile && (
          <Alert
            type="warning"
            showIcon
            className="stacked-alert"
            message="Complete shipping address and phone number in Profile before checkout."
            action={<Link to="/profile">Edit Profile</Link>}
          />
        )}
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Shipping address">
            <Space>
              <ShoppingOutlined />
              <Typography.Text>{profile.shippingAddress || 'Not set'}</Typography.Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Phone number">{profile.phoneNumber || 'Not set'}</Descriptions.Item>
          <Descriptions.Item label="Payment method">{profile.paymentMethod || 'Not set'}</Descriptions.Item>
        </Descriptions>
        <Button
          type="primary"
          disabled={!cartQuery.data?.length || !hasShippingProfile}
          loading={checkoutMutation.isPending}
          onClick={() => checkoutMutation.mutate()}
          style={{ marginTop: 16 }}
        >
          Checkout
        </Button>
      </Card>
    </Space>
  );
}
