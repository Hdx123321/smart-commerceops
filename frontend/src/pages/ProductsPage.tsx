import {
  AppstoreOutlined, CoffeeOutlined, FilterOutlined, HomeOutlined,
  LaptopOutlined, PictureOutlined, PlusOutlined, RobotOutlined, SearchOutlined,
  ShoppingOutlined, SkinOutlined, SmileOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import {
  Button, Card, Col, Drawer, Form, Image, Input, InputNumber,
  Modal, Radio, Row, Select, Skeleton, Space, Tag, Typography,
  Upload, message
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AssistantDrawer from '../components/AssistantDrawer';
import { apiErrorMessage, catalogApi } from '../api/client';

import type { Product, ProductRequest, UserProfile } from '../types';

interface Props {
  user: UserProfile | null;
}

// ── 分类图标映射（淘宝式图标分类） ──
const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string }> = {
  'Beverages':   { icon: <CoffeeOutlined />,      color: '#8B4513' },
  'Groceries':   { icon: <ShoppingOutlined />,     color: '#4CAF50' },
  'Lifestyle':   { icon: <SmileOutlined />,        color: '#FF9800' },
  'Electronics': { icon: <ThunderboltOutlined />,  color: '#2196F3' },
  'Home':        { icon: <HomeOutlined />,         color: '#795548' },
  'Apparel':     { icon: <SkinOutlined />,         color: '#E91E63' },
  'Other':       { icon: <AppstoreOutlined />,     color: '#9E9E9E' }
};

const CATEGORY_OPTIONS = [
  { value: 'Beverages',   label: 'Beverages' },
  { value: 'Groceries',   label: 'Groceries' },
  { value: 'Lifestyle',   label: 'Lifestyle' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Home',        label: 'Home' },
  { value: 'Apparel',     label: 'Apparel' },
  { value: 'Other',       label: 'Other' }
];

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
type ProductSort = 'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_ASC' | 'RATING_DESC' | 'SALES_DESC' | 'NAME_ASC';

const STOCK_FILTER_OPTIONS = [
  { value: 'ALL',        label: 'All stock' },
  { value: 'IN_STOCK',   label: 'In stock' },
  { value: 'LOW_STOCK',  label: 'Low stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of stock' }
];

const SORT_OPTIONS = [
  { value: 'DEFAULT',     label: 'Default' },
  { value: 'PRICE_ASC',   label: 'Price: Low → High' },
  { value: 'PRICE_DESC',  label: 'Price: High → Low' },
  { value: 'STOCK_ASC',   label: 'Stock: Low first' },
  { value: 'RATING_DESC', label: 'Rating: High first' },
  { value: 'SALES_DESC',  label: 'Sales: High first' },
  { value: 'NAME_ASC',    label: 'Name: A → Z' }
];

export default function ProductsPage({ user }: Props) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ProductRequest>();
  const [messageApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const selectedCategory = Form.useWatch('category', form);
  const canManage = user?.role === 'MERCHANT' || user?.role === 'ADMIN';
  const isMerchant = user?.role === 'MERCHANT';
  const isAdmin = user?.role === 'ADMIN';

  // ── 筛选状态 ──
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [searchFilter, setSearchFilter] = useState<string | undefined>();
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const [sortBy, setSortBy] = useState<ProductSort>('DEFAULT');
  const [priceMin, setPriceMin] = useState<number | undefined>();
  const [priceMax, setPriceMax] = useState<number | undefined>();
  const [merchantFilter, setMerchantFilter] = useState<string | undefined>();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(100);

  const productsQuery = useQuery({
    queryKey: ['products', user?.role, user?.merchantId, user?.id, { category: categoryFilter, search: searchFilter, displayCount }],
    queryFn: () => {
      if (canManage) {
        return catalogApi.adminProducts({ size: displayCount });
      }
      return catalogApi.products({ category: categoryFilter, search: searchFilter, size: displayCount });
    }
  });

  const createProductMutation = useMutation({
    mutationFn: catalogApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      form.resetFields();
      setFileList([]);
      setOpen(false);
      messageApi.success('Product created');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Product creation failed'))
  });

  // ── 筛选条件变化时重置展示数量 ──
  useEffect(() => {
    setDisplayCount(100);
  }, [categoryFilter, searchFilter, stockFilter, sortBy, priceMin, priceMax, merchantFilter]);

  // ── 客户端筛选 + 排序 ──
  const visibleProducts = useMemo(() => {
    const search = searchFilter?.trim().toLowerCase();
    const result = (productsQuery.data?.content ?? []).filter((product) => {
      const matchesCategory = !categoryFilter || product.category === categoryFilter;
      const matchesSearch = !search
        || product.name.toLowerCase().includes(search)
        || (product.description ?? '').toLowerCase().includes(search)
        || product.merchantName.toLowerCase().includes(search);
      const matchesStock = stockFilter === 'ALL'
        || (stockFilter === 'IN_STOCK' && product.stockQuantity > product.lowStockThreshold)
        || (stockFilter === 'LOW_STOCK' && product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold)
        || (stockFilter === 'OUT_OF_STOCK' && product.stockQuantity <= 0);
      const matchesPriceMin = priceMin === undefined || product.price >= priceMin;
      const matchesPriceMax = priceMax === undefined || product.price <= priceMax;
      const matchesMerchant = !merchantFilter || product.merchantName === merchantFilter;
      return matchesCategory && matchesSearch && matchesStock && matchesPriceMin && matchesPriceMax && matchesMerchant;
    });
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'PRICE_ASC':   return a.price - b.price;
        case 'PRICE_DESC':  return b.price - a.price;
        case 'STOCK_ASC':   return a.stockQuantity - b.stockQuantity;
        case 'RATING_DESC': return b.averageRating - a.averageRating;
        case 'SALES_DESC':  return b.salesCount - a.salesCount;
        case 'NAME_ASC':    return a.name.localeCompare(b.name);
        default:            return 0;
      }
    });
  }, [categoryFilter, productsQuery.data, searchFilter, sortBy, stockFilter, priceMin, priceMax, merchantFilter]);

  const totalProducts = productsQuery.data?.totalElements ?? visibleProducts.length;
  const displayedProducts = visibleProducts;
  const hasMore = displayCount < totalProducts;

  // ── 从产品列表中提取不重复的商家名 ──
  const merchantOptions = useMemo(() => {
    const names = [...new Set((productsQuery.data?.content ?? []).map(p => p.merchantName).filter(Boolean))];
    return names.map(n => ({ value: n, label: n }));
  }, [productsQuery.data]);

  return (
    <>
      {contextHolder}

      <Space direction="vertical" size="large" className="page">
        {/* ── 页面标题行 ── */}
        <div className="page-heading">
          {canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New Product</Button>
          )}
        </div>

        {/* ── Slogan 艺术字 ── */}
        <div className="slogan-hero">
          <h1 className="slogan-text">Haven for Your Daily Life</h1>
        </div>

        {/* ── 显眼的搜索栏 ── */}
        <div className="search-bar-hero">
          <Input.Search
            prefix={<SearchOutlined />}
            placeholder="Search products by name, description, or merchant..."
            allowClear
            size="large"
            onSearch={(value) => setSearchFilter(value || undefined)}
            onChange={(event) => setSearchFilter(event.target.value || undefined)}
            className="search-bar-input"
          />
        </div>
      </Space>

      {/* ── 分类图标行 + Filters（吸顶 — 在 Space 外部避免被 ant-space-item 包裹） ── */}
      <div className="category-icon-row">
        {/* AI 导购按钮 — 固定最左侧 */}
        <div className="category-ai-btn" onClick={() => setAssistantOpen(true)}>
          <span className="category-ai-circle">
            <RobotOutlined />
          </span>
          <span className="category-ai-label">AI 导购</span>
        </div>

        <div className="category-icon-center">
          <div
            className={`category-icon-item ${!categoryFilter ? 'category-icon-item--active' : ''}`}
            onClick={() => setCategoryFilter(undefined)}
          >
            <span className="category-icon-circle" style={{ background: '#f0f0f0', color: '#666' }}>
              <AppstoreOutlined />
            </span>
            <span className="category-icon-label">All</span>
          </div>
          {CATEGORY_OPTIONS.map((cat) => {
            const meta = CATEGORY_META[cat.value];
            const isActive = categoryFilter === cat.value;
            return (
              <div
                key={cat.value}
                className={`category-icon-item ${isActive ? 'category-icon-item--active' : ''}`}
                onClick={() => setCategoryFilter(isActive ? undefined : cat.value)}
              >
                <span
                  className="category-icon-circle"
                  style={{ background: isActive ? meta.color : '#f5f5f5', color: isActive ? '#fff' : meta.color }}
                >
                  {meta.icon}
                </span>
                <span className="category-icon-label">{cat.label}</span>
              </div>
            );
          })}
        </div>
        <Button
          icon={<FilterOutlined />}
          onClick={() => setFilterDrawerOpen(true)}
          className="category-filter-btn"
        >
          Filters
        </Button>
      </div>

      <Space direction="vertical" size="large" className="page">
        {/* ── 产品卡片网格 ── */}
        <Row gutter={[16, 16]}>
        {displayedProducts.map((product: Product) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={product.id}>
            <Card
              className="product-card-fixed"
              title={product.name}
              extra={<Tag className={product.stockQuantity <= product.lowStockThreshold ? 'pill-tag-shade' : 'pill-tag-mint'}>{product.category}</Tag>}
              cover={
                product.imageUrls?.[0] ? (
                  <Image
                    src={product.imageUrls[0]}
                    alt={product.name}
                    className="product-image-fixed"
                    placeholder={<Skeleton.Image active className="product-image-skeleton" />}
                    preview={false}
                    loading="lazy"
                    fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'%3E%3Crect fill='%23f5f5f5' width='320' height='180'/%3E%3Ctext x='160' y='90' text-anchor='middle' fill='%23bfbfbf' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E"
                  />
                ) : (
                  <div className="product-image-placeholder">
                    <PictureOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />
                  </div>
                )
              }
              actions={[
                <Link to={`/products/${product.id}`}>View details</Link>
              ]}
            >
              <div className="product-card-body">
                <Typography.Paragraph ellipsis={{ rows: 2 }} className="product-card-desc">
                  {product.description || 'No description'}
                </Typography.Paragraph>
                <Typography.Text type="secondary" className="product-card-merchant">{product.merchantName}</Typography.Text>
                <Space className="product-stats">
                  <div className="product-stat-item">
                    <Typography.Text type="secondary" className="product-stat-label">Price</Typography.Text>
                    <Typography.Text strong className="product-stat-value">${product.price.toFixed(2)}</Typography.Text>
                  </div>
                  <div className="product-stat-item">
                    <Typography.Text type="secondary" className="product-stat-label">Stock</Typography.Text>
                    <Typography.Text strong className="product-stat-value">{product.stockQuantity}</Typography.Text>
                  </div>
                  <div className="product-stat-item">
                    <Typography.Text type="secondary" className="product-stat-label">Rating</Typography.Text>
                    <Typography.Text strong className="product-stat-value">{product.averageRating}/5</Typography.Text>
                  </div>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Show more 按钮 ── */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button
            size="large"
            onClick={() => setDisplayCount((c) => c + 100)}
          >
            Show more products ({Math.max(totalProducts - displayCount, 0)} remaining)
          </Button>
        </div>
      )}

      {/* ── 筛选 Drawer ── */}
      <Drawer
        title="Filters"
        placement="right"
        width={360}
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        extra={
          <Button
            type="link"
            onClick={() => {
              setStockFilter('ALL');
              setSortBy('DEFAULT');
              setPriceMin(undefined);
              setPriceMax(undefined);
              setMerchantFilter(undefined);
            }}
          >
            Reset all
          </Button>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 库存筛选 */}
          <div>
            <Typography.Title level={5} style={{ marginBottom: 12 }}>Stock Status</Typography.Title>
            <Radio.Group
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {STOCK_FILTER_OPTIONS.map(opt => (
                  <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>

          {/* 排序 */}
          <div>
            <Typography.Title level={5} style={{ marginBottom: 12 }}>Sort By</Typography.Title>
            <Radio.Group
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {SORT_OPTIONS.map(opt => (
                  <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>

          {/* 价格区间 */}
          <div>
            <Typography.Title level={5} style={{ marginBottom: 12 }}>Price Range</Typography.Title>
            <Space>
              <InputNumber
                placeholder="Min"
                min={0}
                precision={2}
                value={priceMin}
                onChange={(v) => setPriceMin(v ?? undefined)}
                style={{ width: 130 }}
                prefix="$"
              />
              <Typography.Text type="secondary">–</Typography.Text>
              <InputNumber
                placeholder="Max"
                min={0}
                precision={2}
                value={priceMax}
                onChange={(v) => setPriceMax(v ?? undefined)}
                style={{ width: 130 }}
                prefix="$"
              />
            </Space>
          </div>

          {/* 按商家筛选 */}
          <div>
            <Typography.Title level={5} style={{ marginBottom: 12 }}>Merchant</Typography.Title>
            <Select
              placeholder="All merchants"
              allowClear
              style={{ width: '100%' }}
              options={merchantOptions}
              value={merchantFilter}
              onChange={(value) => setMerchantFilter(value)}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>
        </Space>
      </Drawer>

      {/* ── 新建产品 Modal ── */}
      <Modal title="Create Product" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ active: true, category: 'Beverages', stockQuantity: 20, lowStockThreshold: 8 }}
          onFinish={(values) => {
            const imageUrls = fileList
              .filter((f) => f.status === 'done')
              .map((f: any) => f.response?.url as string);
            createProductMutation.mutate({
              ...values,
              imageUrls,
              ...(isMerchant ? {
                merchantId: user.merchantId ?? user.id,
                merchantName: user.merchantName || `${user.username} Store`,
                merchantDescription: user.merchantDescription,
                merchantContact: user.merchantContact
              } : {})
            });
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input prefix={<AppstoreOutlined />} />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select options={CATEGORY_OPTIONS} />
          </Form.Item>
          {selectedCategory === 'Other' && (
            <Form.Item name="customCategory" label="Custom category" rules={[{ required: true, whitespace: true }]}>
              <Input />
            </Form.Item>
          )}
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Product Images">
            <Upload
              listType="picture-card"
              multiple
              maxCount={5}
              accept="image/*"
              fileList={fileList}
              customRequest={async ({ file, onSuccess, onError }: any) => {
                try {
                  const urls = await catalogApi.uploadImages([file as File]);
                  onSuccess({ url: urls[0] });
                } catch (err) { onError(err); }
              }}
              onChange={({ fileList: newList }) => setFileList(newList)}
            >
              <div><PlusOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>
            </Upload>
          </Form.Item>
          {isAdmin && (
            <>
              <Form.Item name="merchantId" label="Merchant ID">
                <InputNumber min={1} className="full-width" />
              </Form.Item>
              <Form.Item name="merchantName" label="Merchant name">
                <Input placeholder="DailyHaven" />
              </Form.Item>
              <Form.Item name="merchantDescription" label="Merchant description">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item name="merchantContact" label="Merchant contact">
                <Input />
              </Form.Item>
            </>
          )}
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

      {/* AI 导购 Drawer */}
      <AssistantDrawer user={user} open={assistantOpen} onClose={() => setAssistantOpen(false)} />

    </>
  );
}
