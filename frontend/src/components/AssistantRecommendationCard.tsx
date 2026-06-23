import { Button, Card, Image, Space, Tag, Typography } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import type { AssistantRecommendationItem } from '../types';

const { Text } = Typography;

interface Props {
  item: AssistantRecommendationItem;
  canAddToCart: boolean;
  onAddToCart?: (productId: number) => void;
}

export default function AssistantRecommendationCard({ item, canAddToCart, onAddToCart }: Props) {
  return (
    <Card size="small" className="assistant-recommendation-card">
      <div style={{ display: 'flex', gap: 12 }}>
        {item.imageUrls?.[0] ? (
          <Image
            src={item.imageUrls[0]}
            alt={item.name}
            width={80}
            height={80}
            style={{ objectFit: 'cover', borderRadius: 6 }}
            preview={false}
            loading="lazy"
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23f5f5f5' width='80' height='80' rx='6'/%3E%3Ctext x='40' y='42' text-anchor='middle' fill='%23bfbfbf' font-size='11'%3ENo img%3C/text%3E%3C/svg%3E"
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 80,
              background: '#f5f5f5',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bfbfbf',
              fontSize: 24,
            }}
          >
            📦
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text strong ellipsis style={{ display: 'block' }}>
            {item.name}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {item.merchantName}
          </Text>
          <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text strong style={{ color: '#cf1322', fontSize: 16 }}>
              ${item.price.toFixed(2)}
            </Text>
            <Tag>{item.category}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ⭐ {item.averageRating.toFixed(1)} · 售 {item.salesCount}
            </Text>
          </div>
          <Text
            type="success"
            style={{ fontSize: 12, display: 'block', marginTop: 4 }}
            ellipsis
          >
            💡 {item.reason}
          </Text>
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <Link to={`/products/${item.productId}`}>
          <Button size="small">查看详情</Button>
        </Link>
        {canAddToCart && (
          <Button
            type="primary"
            size="small"
            icon={<ShoppingCartOutlined />}
            onClick={() => onAddToCart?.(item.productId)}
            disabled={item.stockQuantity <= 0}
          >
            加入购物车
          </Button>
        )}
      </div>
    </Card>
  );
}
