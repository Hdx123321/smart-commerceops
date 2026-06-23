import { Alert, Card, Col, Row, Space, Table, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/client';
import BlurText from '../components/react-bits/BlurText';
import Counter from '../components/react-bits/Counter';
import StarBorder from '../components/react-bits/StarBorder';
import type { InventoryRecommendation, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

export default function DashboardPage({ user }: Props) {
  const merchantId = user.role === 'MERCHANT' ? (user.merchantId ?? user.id) : undefined;
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', merchantId ?? 'all'],
    queryFn: () => analyticsApi.dashboard(merchantId ? { merchantId } : undefined)
  });
  const data = dashboardQuery.data;

  return (
    <Space direction="vertical" size="large" className="page">
      <div className="page-heading">
        <div>
          <BlurText text="Operations Dashboard" className="page-title-blur" delay={150} />
          <Typography.Text type="secondary">
            {merchantId ? 'Merchant-scoped analytics for your products, orders, and replenishment rules.' : 'Platform analytics combining orders, catalog inventory, and replenishment rules.'}
          </Typography.Text>
        </div>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <StarBorder as="div" color="#c1fbd4" speed="8s" thickness={1}>
            <div style={{ padding: 16, minWidth: 130 }}>
              <Typography.Text type="secondary">GMV</Typography.Text>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 400, marginRight: 2 }}>$</span>
                <Counter value={data?.gmv ?? 0} fontSize={28} padding={4} textColor="#000000" gradientFrom="#fbfbf5" gradientTo="transparent" />
              </div>
            </div>
          </StarBorder>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StarBorder as="div" color="#c1fbd4" speed="7s" thickness={1}>
            <div style={{ padding: 16, minWidth: 100 }}>
              <Typography.Text type="secondary">Orders</Typography.Text>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>
                <Counter value={data?.orderCount ?? 0} fontSize={28} padding={4} textColor="#000000" gradientFrom="#fbfbf5" gradientTo="transparent" />
              </div>
            </div>
          </StarBorder>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StarBorder as="div" color="#c1fbd4" speed="9s" thickness={1}>
            <div style={{ padding: 16, minWidth: 130 }}>
              <Typography.Text type="secondary">AOV</Typography.Text>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 400, marginRight: 2 }}>$</span>
                <Counter value={data?.averageOrderValue ?? 0} fontSize={28} padding={4} textColor="#000000" gradientFrom="#fbfbf5" gradientTo="transparent" />
              </div>
            </div>
          </StarBorder>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StarBorder as="div" color={(data?.lowStockCount ?? 0) > 0 ? '#d4d4d8' : '#c1fbd4'} speed="10s" thickness={1}>
            <div style={{ padding: 16, minWidth: 100 }}>
              <Typography.Text type="secondary">Low Stock SKUs</Typography.Text>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>
                <Counter value={data?.lowStockCount ?? 0} fontSize={28} padding={4} textColor="#000000" gradientFrom="#fbfbf5" gradientTo="transparent" />
              </div>
            </div>
          </StarBorder>
        </Col>
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
