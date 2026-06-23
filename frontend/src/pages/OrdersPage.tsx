import { useQuery } from '@tanstack/react-query';
import { Button, Card, Space, Table, Tabs, Tag, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/client';
import type { Order, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

type OrderTab = 'ALL' | Order['status'];

const statusLabels: Record<Order['status'], string> = {
  PENDING_PAYMENT: '待付款',
  PENDING_SHIPMENT: '待发货',
  PENDING_RECEIPT: '待收货',
  COMPLETED: '已完成',
  AFTER_SALES: '退款/售后',
  CANCELLED: '已取消'
};

const statusColors: Record<Order['status'], string> = {
  PENDING_PAYMENT: 'gold',
  PENDING_SHIPMENT: 'orange',
  PENDING_RECEIPT: 'blue',
  COMPLETED: 'green',
  AFTER_SALES: 'purple',
  CANCELLED: 'default'
};

const tabs: Array<{ key: OrderTab; label: string }> = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING_PAYMENT', label: '待付款' },
  { key: 'PENDING_SHIPMENT', label: '待发货' },
  { key: 'PENDING_RECEIPT', label: '待收货' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'AFTER_SALES', label: '退款/售后' },
  { key: 'CANCELLED', label: '已取消' }
];

export default function OrdersPage({ user }: Props) {
  const canManage = user.role === 'MERCHANT' || user.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<OrderTab>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const ordersQuery = useQuery({
    queryKey: ['orders', user.role, user.role === 'MERCHANT' ? (user.merchantId ?? user.id) : user.id, activeTab, page, pageSize],
    queryFn: () => {
      const pagination = { page: page - 1, size: pageSize, ...(activeTab === 'ALL' ? {} : { status: activeTab }) };
      if (user.role === 'ADMIN') return orderApi.orders(pagination);
      if (user.role === 'MERCHANT') return orderApi.orders({ merchantId: user.merchantId ?? user.id, ...pagination });
      return orderApi.orders({ userId: user.id, ...pagination });
    }
  });

  const orders = ordersQuery.data?.content ?? [];

  const tableFor = (tab: OrderTab) => {
    const rows = tab === activeTab ? orders : [];
    return (
      <Table<Order>
        rowKey="id"
        dataSource={rows}
        loading={ordersQuery.isLoading}
        pagination={{
          current: page,
          pageSize,
          total: ordersQuery.data?.totalElements ?? rows.length,
          showSizeChanger: true,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          }
        }}
        columns={[
          { title: 'Order', dataIndex: 'id', render: (id) => <Link to={`/orders/${id}`}>#{id}</Link> },
          ...(canManage ? [{ title: 'User', dataIndex: 'userId' }] : []),
          ...(user.role === 'ADMIN' ? [{ title: 'Merchant', dataIndex: 'merchantName' }] : []),
          { title: 'Total', dataIndex: 'totalAmount', render: (value) => `$${Number(value).toFixed(2)}` },
          { title: 'Status', dataIndex: 'status', render: (status: Order['status']) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag> },
          { title: 'Address', dataIndex: 'shippingAddress' },
          { title: 'Items', render: (_, row) => row.lines.map((line) => `${line.productName} x${line.quantity}`).join(', ') },
          {
            title: 'Action',
            render: (_, row) => (
              <Button size="small">
                <Link to={row.status === 'AFTER_SALES' && row.latestAfterSalesCaseId ? `/after-sales/${row.latestAfterSalesCaseId}` : `/orders/${row.id}`}>
                  {row.status === 'AFTER_SALES' && row.latestAfterSalesCaseId ? (canManage ? '处理售后' : '查看售后') : (canManage ? '处理订单' : '查看详情')}
                </Link>
              </Button>
            )
          }
        ]}
      />
    );
  };

  return (
    <Space direction="vertical" size="large" className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>{canManage ? 'Order Operations' : 'My Orders'}</Typography.Title>
          <Typography.Text type="secondary">
            {canManage ? 'Open an order to manage fulfillment and customer delivery details.' : 'Open an order to view item, payment, delivery, and after-sales actions.'}
          </Typography.Text>
        </div>
      </div>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as OrderTab);
            setPage(1);
          }}
          items={tabs.map((tab) => ({ ...tab, children: tableFor(tab.key) }))}
        />
      </Card>
    </Space>
  );
}
