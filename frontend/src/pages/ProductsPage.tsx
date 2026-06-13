import { AppstoreOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Image, Input, InputNumber, Modal, Row, Select, Skeleton, Space, Statistic, Tag, Typography, Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiErrorMessage, catalogApi } from '../api/client';
import type { Product, ProductRequest, UserProfile } from '../types';

interface Props {
  user: UserProfile | null;
}

const CATEGORY_OPTIONS = [
  { value: 'Beverages', label: 'Beverages' },
  { value: 'Groceries', label: 'Groceries' },
  { value: 'Lifestyle', label: 'Lifestyle' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Home', label: 'Home' },
  { value: 'Apparel', label: 'Apparel' },
  { value: 'Other', label: 'Other' }
];

export default function ProductsPage({ user }: Props) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ProductRequest>();
  const [messageApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const selectedCategory = Form.useWatch('category', form);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [searchFilter, setSearchFilter] = useState<string | undefined>();
  const productsQuery = useQuery({
    queryKey: ['products', { category: categoryFilter, search: searchFilter }],
    queryFn: () => catalogApi.products({ category: categoryFilter, search: searchFilter }),
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

      <Space wrap className="product-filter-bar">
        <Input.Search
          prefix={<SearchOutlined />}
          placeholder="Search products by name or description..."
          allowClear
          onSearch={(value) => setSearchFilter(value || undefined)}
          style={{ width: 360 }}
        />
        <Select
          placeholder="All Categories"
          allowClear
          style={{ width: 180 }}
          options={CATEGORY_OPTIONS}
          value={categoryFilter}
          onChange={(value) => setCategoryFilter(value)}
        />
      </Space>

      <Row gutter={[16, 16]}>
        {(productsQuery.data ?? []).map((product: Product) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={product.id}>
            <Card
              title={product.name}
              extra={<Tag color={product.stockQuantity <= product.lowStockThreshold ? 'red' : 'green'}>{product.category}</Tag>}
              cover={product.imageUrls?.[0] ? (
                <Image
                  src={product.imageUrls[0]}
                  alt={product.name}
                  className="product-image"
                  placeholder={<Skeleton.Image active className="product-image-skeleton" />}
                  preview={false}
                  onError={(e) => {
                    // hide broken image so skeleton doesn't get stuck
                    const el = (e as React.SyntheticEvent<HTMLImageElement>).currentTarget;
                    el.style.display = 'none';
                  }}
                />
              ) : undefined}
              actions={[
                <Link to={`/products/${product.id}`}>View details</Link>
              ]}
            >
              <Typography.Paragraph ellipsis={{ rows: 2 }}>{product.description}</Typography.Paragraph>
              <Typography.Text type="secondary">{product.merchantName}</Typography.Text>
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
          form={form}
          layout="vertical"
          initialValues={{ active: true, category: 'Beverages', stockQuantity: 20, lowStockThreshold: 8 }}
          onFinish={(values) => {
            const imageUrls = fileList
              .filter((f) => f.status === 'done')
              .map((f: any) => f.response?.url as string);
            createProductMutation.mutate({ ...values, imageUrls });
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
          <Form.Item name="merchantName" label="Merchant name">
            <Input placeholder="Smart CommerceOps" />
          </Form.Item>
          <Form.Item name="merchantDescription" label="Merchant description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="merchantContact" label="Merchant contact">
            <Input />
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
