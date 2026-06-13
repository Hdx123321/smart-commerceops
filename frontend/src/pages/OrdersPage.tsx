import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { apiErrorMessage, orderApi } from '../api/client';
import type { Order, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

type OrderTab = 'ALL' | Order['status'];

const statusLabels: Record<Order['status'], string> = {
  PENDING_SHIPMENT: '待发货',
  PENDING_RECEIPT: '待收货',
  COMPLETED: '已完成',
  AFTER_SALES: '退款/售后'
};

const statusColors: Record<Order['status'], string> = {
  PENDING_SHIPMENT: 'orange',
  PENDING_RECEIPT: 'blue',
  COMPLETED: 'green',
  AFTER_SALES: 'purple'
};

const tabs: Array<{ key: OrderTab; label: string }> = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING_SHIPMENT', label: '待发货' },
  { key: 'PENDING_RECEIPT', label: '待收货' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'AFTER_SALES', label: '退款/售后' }
];

export default function OrdersPage({ user }: Props) {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const canManage = user.role === 'MERCHANT' || user.role === 'ADMIN';
  const ordersQuery = useQuery({
    queryKey: ['orders', canManage ? 'all' : user.id],
    queryFn: () => orderApi.orders(canManage ? undefined : user.id)
  });

  const shipOrder = useMutation({
    mutationFn: orderApi.shipOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      messageApi.success('Order shipped');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Ship order failed'))
  });

  const confirmReceipt = useMutation({
    mutationFn: orderApi.confirmReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      messageApi.success('Receipt confirmed');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Confirm receipt failed'))
  });

  const orders = ordersQuery.data ?? [];

  const tableFor = (tab: OrderTab) => {
    const rows = tab === 'ALL' ? orders : orders.filter((order) => order.status === tab);
    return (
      <Table<Order>
        rowKey="id"
        dataSource={rows}
        loading={ordersQuery.isLoading}
        columns={[
          { title: 'Order', dataIndex: 'id', render: (id) => `#${id}` },
          { title: 'User', dataIndex: 'userId' },
          { title: 'Total', dataIndex: 'totalAmount', render: (value) => `$${Number(value).toFixed(2)}` },
          { title: 'Status', dataIndex: 'status', render: (status: Order['status']) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag> },
          { title: 'Address', dataIndex: 'shippingAddress' },
          { title: 'Phone', dataIndex: 'phoneNumber' },
          { title: 'Items', render: (_, row) => row.lines.map((line) => `${line.productName} x${line.quantity}`).join(', ') },
          {
            title: 'Action',
            render: (_, row) => {
              if (canManage && row.status === 'PENDING_SHIPMENT') {
                return (
                  <Button size="small" type="primary" loading={shipOrder.isPending} onClick={() => shipOrder.mutate(row.id)}>
                    确认发货
                  </Button>
                );
              }
              if (!canManage && row.status === 'PENDING_RECEIPT') {
                return (
                  <Button size="small" type="primary" loading={confirmReceipt.isPending} onClick={() => confirmReceipt.mutate(row.id)}>
                    确认收货
                  </Button>
                );
              }
              return <Typography.Text type="secondary">-</Typography.Text>;
            }
          }
        ]}
      />
    );
  };

  return (
    <Space direction="vertical" size="large" className="page">
      {contextHolder}
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>{canManage ? 'Order Operations' : 'My Orders'}</Typography.Title>
          <Typography.Text type="secondary">
            {canManage ? 'Manage shipment progress and fulfillment status.' : 'Track shipment progress and confirm receipt.'}
          </Typography.Text>
        </div>
      </div>
      <Card>
        <Tabs defaultActiveKey="ALL" items={tabs.map((tab) => ({ ...tab, children: tableFor(tab.key) }))} />
      </Card>
    </Space>
  );
}
