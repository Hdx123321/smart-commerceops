import { Alert, Card, Col, Row, Space, Statistic, Table, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/client';
import type { InventoryRecommendation } from '../types';

export default function DashboardPage() {
  const dashboardQuery = useQuery({ queryKey: ['dashboard'], queryFn: analyticsApi.dashboard });
  const data = dashboardQuery.data;

  return (
    <Space direction="vertical" size="large" className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>Operations Dashboard</Typography.Title>
          <Typography.Text type="secondary">Analytics service combines orders, catalog inventory, and replenishment rules.</Typography.Text>
        </div>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}><Card><Statistic title="GMV" value={data?.gmv ?? 0} prefix="$" precision={2} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Orders" value={data?.orderCount ?? 0} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="AOV" value={data?.averageOrderValue ?? 0} prefix="$" precision={2} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Low Stock SKUs" value={data?.lowStockCount ?? 0} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Top Products">
            {(data?.topProducts ?? []).map((product) => (
              <Alert
                key={product.productId}
                className="stacked-alert"
                message={`${product.name} - ${product.salesCount} sold - ${product.averageRating}/5`}
                type="info"
                showIcon
              />
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Inventory Recommendations">
            <Table<InventoryRecommendation>
              rowKey="productId"
              size="small"
              pagination={false}
              dataSource={data?.inventoryRecommendations ?? []}
              columns={[
                { title: 'Product', dataIndex: 'productName' },
                { title: 'Stock', dataIndex: 'stockQuantity' },
                { title: 'Threshold', dataIndex: 'lowStockThreshold' },
                { title: 'Restock', dataIndex: 'recommendedRestock' }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
