import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Select, Space, Table, Tag, Typography } from 'antd';
import { orderApi } from '../api/client';
import type { Order, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

const statuses: Order['status'][] = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

export default function OrdersPage({ user }: Props) {
  const queryClient = useQueryClient();
  const canManage = user.role === 'MERCHANT' || user.role === 'ADMIN';
  const ordersQuery = useQuery({
    queryKey: ['orders', canManage ? 'all' : user.id],
    queryFn: () => orderApi.orders(canManage ? undefined : user.id)
  });
  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: Order['status'] }) => orderApi.updateStatus(orderId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  });

  return (
    <Space direction="vertical" size="large" className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>Order Operations</Typography.Title>
          <Typography.Text type="secondary">Status workflow for platform operations and merchant fulfilment.</Typography.Text>
        </div>
      </div>
      <Card>
        <Table<Order>
          rowKey="id"
          dataSource={ordersQuery.data ?? []}
          columns={[
            { title: 'Order', dataIndex: 'id', render: (id) => `#${id}` },
            { title: 'User', dataIndex: 'userId' },
            { title: 'Total', dataIndex: 'totalAmount', render: (value) => `$${Number(value).toFixed(2)}` },
            { title: 'Payment', dataIndex: 'paymentStatus', render: (value) => <Tag>{value}</Tag> },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (status, row) => canManage ? (
                <Select
                  value={status}
                  options={statuses.map((value) => ({ value, label: value }))}
                  onChange={(value) => updateStatus.mutate({ orderId: row.id, status: value })}
                  style={{ width: 150 }}
                />
              ) : <Tag color="blue">{status}</Tag>
            },
            { title: 'Items', render: (_, row) => row.lines.map((line) => `${line.productName} x${line.quantity}`).join(', ') }
          ]}
        />
      </Card>
    </Space>
  );
}
