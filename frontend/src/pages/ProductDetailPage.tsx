import { DeleteOutlined, MessageOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Carousel, Col, Descriptions, Form, Image, Input, InputNumber, List, Modal, Rate, Row, Skeleton, Space, Statistic, Tag, Typography, Upload, message } from 'antd';

import type { UploadFile } from 'antd';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiErrorMessage, catalogApi, chatApi, orderApi } from '../api/client';
import type { ProductReview, UserProfile } from '../types';

interface Props {
  user: UserProfile | null;
}

export default function ProductDetailPage({ user }: Props) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const id = Number(productId);
  const queryClient = useQueryClient();
  const [replyForm] = Form.useForm<{ reply: string }>();
  const [cartForm] = Form.useForm<{ quantity: number }>();
  const [messageApi, contextHolder] = message.useMessage();
  const [replyTarget, setReplyTarget] = useState<ProductReview | null>(null);
  const productQuery = useQuery({ queryKey: ['product', id], queryFn: () => catalogApi.product(id), enabled: Number.isFinite(id) });
  const reviewsQuery = useQuery({ queryKey: ['product-reviews', id], queryFn: () => catalogApi.reviews(id), enabled: Number.isFinite(id) });
  const product = productQuery.data;
  const canShop = user?.role === 'CUSTOMER';
  const canManage = user?.role === 'ADMIN' || (user?.role === 'MERCHANT' && product?.merchantId === (user.merchantId ?? user.id));
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([]);

  const updateImages = useMutation({
    mutationFn: async ({ imageUrls }: { imageUrls: string[] }) => {
      if (!product) throw new Error('No product loaded');
      return catalogApi.updateProductImages(product.id, imageUrls);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setUploadFileList([]);
      messageApi.success('Images updated');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Image update failed')),
  });

  const addToCart = useMutation({
    mutationFn: ({ quantity }: { quantity: number }) => {
      if (!user || !product) {
        throw new Error('Login required');
      }
      return orderApi.addToCart({ userId: user.id, productId: product.id, quantity });
    },
    onSuccess: () => {
      messageApi.success('Added to cart');
      cartForm.setFieldsValue({ quantity: 1 });
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Add to cart failed'))
  });

  const contactMerchant = useMutation({
    mutationFn: async () => {
      if (!user || !product) {
        throw new Error('Login required');
      }
      return chatApi.createConversation({
        customerId: user.id,
        merchantId: product.merchantId ?? 0,
        merchantName: product.merchantName,
        contextType: 'PRODUCT',
        contextId: product.id,
        contextTitle: product.name
      });
    },
    onSuccess: (conversation) => navigate(`/chat/${conversation.id}`),
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Contact merchant failed'))
  });

  const replyToReview = useMutation({
    mutationFn: (values: { reply: string }) => {
      if (!replyTarget) throw new Error('No review selected');
      return catalogApi.replyToReview(id, replyTarget.id, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', id] });
      setReplyTarget(null);
      replyForm.resetFields();
      messageApi.success('Reply saved');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Reply failed'))
  });

  if (!productQuery.isLoading && !product) {
    return (
      <Space direction="vertical" size="large" className="page">
        <Alert type="error" showIcon message="Product not found" />
        <Link to="/products">Back to products</Link>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" className="page">
      {contextHolder}
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>{product?.name ?? 'Product details'}</Typography.Title>
          <Typography.Text type="secondary">Review the product, merchant, inventory, and customer feedback before checkout.</Typography.Text>
        </div>
        <Link to="/products">Back to marketplace</Link>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card loading={productQuery.isLoading}>
            {product && (
              <Space direction="vertical" size="large" className="full-width">
                {product.imageUrls && product.imageUrls.length > 0 && (
                  <Image.PreviewGroup>
                    <Carousel
                      arrows
                      dots={product.imageUrls.length > 1}
                      infinite
                      className="product-image-carousel"
                    >
                      {product.imageUrls.map((url, i) => (
                        <div key={i} className="product-image-slide">
                          <div className="product-image-wrapper">
                            <Image
                              src={url}
                              alt={`${product.name} - Image ${i + 1}`}
                              className="product-detail-image"
                              placeholder={<Skeleton.Image active />}
                              preview={false}
                              loading="lazy"
                              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f5f5f5' width='400' height='300'/%3E%3Ctext x='200' y='155' text-anchor='middle' fill='%23bfbfbf' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E"
                            />
                            {canManage && (
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                className="product-image-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const filtered = product.imageUrls!.filter((_, j) => j !== i);
                                  updateImages.mutate({ imageUrls: filtered });
                                }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </Carousel>
                  </Image.PreviewGroup>
                )}

                {canManage && (
                  <div className="product-image-upload-section">
                    <Upload
                      listType="picture-card"
                      multiple
                      accept="image/*"
                      fileList={uploadFileList}
                      showUploadList={{ showPreviewIcon: false }}
                      customRequest={async ({ file, onSuccess, onError }: any) => {
                        try {
                          const urls = await catalogApi.uploadImages([file as File]);
                          onSuccess({ url: urls[0] });
                        } catch (err) { onError(err); }
                      }}
                      onChange={({ fileList: newList }) => setUploadFileList(newList)}
                    >
                      {(uploadFileList.length + (product?.imageUrls?.length ?? 0)) < 5 && (
                        <div><PlusOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>
                      )}
                    </Upload>
                    {uploadFileList.some(f => f.status === 'done') && (
                      <Button
                        type="primary"
                        loading={updateImages.isPending}
                        style={{ marginTop: 8 }}
                        onClick={() => {
                          const newUrls = uploadFileList
                            .filter(f => f.status === 'done')
                            .map((f: any) => f.response?.url as string);
                          const merged = [...(product?.imageUrls ?? []), ...newUrls];
                          updateImages.mutate({ imageUrls: merged });
                        }}
                      >
                        Save Images
                      </Button>
                    )}
                  </div>
                )}
                <Space>
                  <Tag className="pill-tag-mint">{product.category}</Tag>
                  <Tag className={product.stockQuantity <= product.lowStockThreshold ? 'pill-tag-shade' : 'pill-tag-mint'}>
                    {product.stockQuantity <= product.lowStockThreshold ? 'Low stock' : 'In stock'}
                  </Tag>
                </Space>
                <Typography.Paragraph>{product.description}</Typography.Paragraph>
                <Row gutter={[16, 16]}>
                  <Col xs={12} md={6}><Statistic title="Price" value={product.price} prefix="$" precision={2} /></Col>
                  <Col xs={12} md={6}><Statistic title="Stock" value={product.stockQuantity} /></Col>
                  <Col xs={12} md={6}><Statistic title="Rating" value={product.averageRating} suffix="/5" /></Col>
                  <Col xs={12} md={6}><Statistic title="Reviews" value={product.ratingCount} /></Col>
                </Row>
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Merchant" loading={productQuery.isLoading}>
            {product && (
              <Space direction="vertical" className="full-width">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Name">
                    {product.merchantId ? <Link to={`/merchants/${product.merchantId}`}>{product.merchantName}</Link> : product.merchantName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Contact">{product.merchantContact || 'Not provided'}</Descriptions.Item>
                  <Descriptions.Item label="About">{product.merchantDescription || 'Platform managed merchant profile.'}</Descriptions.Item>
                </Descriptions>
                <Button
                  icon={<MessageOutlined />}
                  disabled={!canShop}
                  loading={contactMerchant.isPending}
                  onClick={() => contactMerchant.mutate()}
                >
                  Contact merchant
                </Button>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Add to cart">
        {!user && <Alert type="info" showIcon className="stacked-alert" message="Login as a customer to add this product to cart." />}
        {user && !canShop && <Alert type="warning" showIcon className="stacked-alert" message="Only customer accounts can add products to cart." />}
        <Form form={cartForm} layout="inline" initialValues={{ quantity: 1 }} onFinish={(values) => addToCart.mutate(values)}>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true, type: 'number', min: 1 }]}>
            <InputNumber min={1} max={product?.stockQuantity ?? undefined} />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<ShoppingCartOutlined />} disabled={!canShop || !product} loading={addToCart.isPending}>
            Add to cart
          </Button>
        </Form>
      </Card>

      <Card title="Customer Reviews">
        {canShop && <Alert type="info" showIcon className="stacked-alert" message="Only purchased items can be reviewed. Open a completed order and review from the order item row." />}
        <List
          loading={reviewsQuery.isLoading}
          dataSource={reviewsQuery.data ?? []}
          locale={{ emptyText: 'No reviews yet' }}
          renderItem={(review) => (
            <List.Item>
              <List.Item.Meta
                title={<Space><Typography.Text>{review.username}</Typography.Text><Rate disabled value={review.rating} /></Space>}
                description={(
                  <Space direction="vertical" size={8}>
                    <Typography.Text>{review.comment || 'No comment'}</Typography.Text>
                    {review.merchantReply && (
                      <Alert type="success" showIcon message="Merchant reply" description={review.merchantReply} />
                    )}
                    {canManage && (
                      <Button
                        size="small"
                        onClick={() => {
                          setReplyTarget(review);
                          replyForm.setFieldsValue({ reply: review.merchantReply });
                        }}
                      >
                        {review.merchantReply ? 'Edit reply' : 'Reply'}
                      </Button>
                    )}
                  </Space>
                )}
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="Reply to review"
        open={!!replyTarget}
        okText="Save reply"
        confirmLoading={replyToReview.isPending}
        onCancel={() => setReplyTarget(null)}
        onOk={() => replyForm.submit()}
      >
        <Form form={replyForm} layout="vertical" onFinish={(values) => replyToReview.mutate(values)}>
          <Form.Item name="reply" label="Merchant reply" rules={[{ required: true, max: 1000 }]}>
            <Input.TextArea rows={4} maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
