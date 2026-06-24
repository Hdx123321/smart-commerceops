import {
  CheckCircleOutlined,
  CreditCardOutlined,
  MessageOutlined,
  ReloadOutlined,
  RollbackOutlined,
  ShoppingOutlined,
  TruckOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Empty, Form, Image, Input, Modal, Rate, Select, Space, Steps, Tag, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { apiErrorMessage, catalogApi, chatApi, orderApi, paymentApi } from '../api/client';
import type { AfterSalesType, Order, OrderLine, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

interface MerchantOrderGroup {
  key: string;
  merchantName: string;
  lines: OrderLine[];
}

interface AfterSalesFormValues {
  type: AfterSalesType;
  reason: string;
  description?: string;
  contactMethod?: string;
}

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

const afterSalesTypeLabels: Record<AfterSalesType, string> = {
  RETURN: '退货',
  EXCHANGE: '换货',
  REFUND_ONLY: '仅退款',
  CONTACT_MERCHANT: '与商家联系'
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : 'Not available';
}

function groupLines(lines: OrderLine[]): MerchantOrderGroup[] {
  const byMerchant = new Map<string, MerchantOrderGroup>();
  lines.forEach((line) => {
    const merchantName = line.merchantName || 'DailyHaven';
    const key = line.merchantId ? `merchant-${line.merchantId}` : merchantName;
    const group = byMerchant.get(key) ?? { key, merchantName, lines: [] };
    group.lines.push(line);
    byMerchant.set(key, group);
  });
  return Array.from(byMerchant.values());
}

function statusStep(status: Order['status']) {
  if (status === 'PENDING_PAYMENT') return 0;
  if (status === 'PENDING_SHIPMENT') return 1;
  if (status === 'PENDING_RECEIPT') return 2;
  if (status === 'COMPLETED') return 3;
  if (status === 'CANCELLED') return 0;
  return 1;
}

export default function OrderDetailPage({ user }: Props) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [afterSalesOpen, setAfterSalesOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<OrderLine | null>(null);
  const [afterSalesForm] = Form.useForm<AfterSalesFormValues>();
  const [reviewForm] = Form.useForm<{ rating: number; comment?: string }>();
  const selectedAfterSalesType = Form.useWatch('type', afterSalesForm);
  const id = Number(orderId);
  const isOpsUser = user.role === 'MERCHANT' || user.role === 'ADMIN';

  const orderQuery = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.order(id),
    enabled: Number.isFinite(id)
  });

  const afterSalesQuery = useQuery({
    queryKey: ['order-after-sales', id],
    queryFn: () => orderApi.orderAfterSales(id),
    enabled: Number.isFinite(id)
  });

  const order = orderQuery.data;
  const afterSalesCases = afterSalesQuery.data ?? [];
  const latestAfterSales = afterSalesCases.find((afterSalesCase) => afterSalesCase.type !== 'CONTACT_MERCHANT');
  const ownsMerchantOrder = !!order && user.role === 'MERCHANT' && order.merchantId === (user.merchantId ?? user.id);
  const canManageOrder = !!order && (user.role === 'ADMIN' || ownsMerchantOrder);
  const canViewOrder = !order || canManageOrder || order.userId === user.id;
  const canPayOrder =
    !!order &&
    !isOpsUser &&
    order.userId === user.id &&
    order.status === 'PENDING_PAYMENT' &&
    order.paymentStatus === 'UNPAID';
  const groups = order ? groupLines(order.lines) : [];

  const refreshOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['order', id] });
    queryClient.invalidateQueries({ queryKey: ['order-after-sales', id] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const shipOrder = useMutation({
    mutationFn: orderApi.shipOrder,
    onSuccess: () => {
      refreshOrders();
      messageApi.success('Order shipped');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Ship order failed'))
  });

  const confirmReceipt = useMutation({
    mutationFn: orderApi.confirmReceipt,
    onSuccess: () => {
      refreshOrders();
      messageApi.success('Receipt confirmed');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Confirm receipt failed'))
  });

  const cancelOrder = useMutation({
    mutationFn: orderApi.cancelOrder,
    onSuccess: () => {
      refreshOrders();
      messageApi.success('Order cancelled');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Cancel order failed'))
  });

  const createPayment = useMutation({
    mutationFn: (sourceOrder: Order) => paymentApi.createPayment({
      orderId: sourceOrder.id,
      paymentMethod: sourceOrder.paymentMethod || user.paymentMethod || 'Simulated payment'
    }),
    onSuccess: () => {
      refreshOrders();
      messageApi.success('Payment successful');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Payment failed'))
  });

  const createAfterSales = useMutation({
    mutationFn: (values: AfterSalesFormValues) => orderApi.createAfterSales(id, { userId: user.id, ...values }),
    onSuccess: (afterSalesCase) => {
      setAfterSalesOpen(false);
      afterSalesForm.resetFields();
      refreshOrders();
      if (afterSalesCase.type === 'CONTACT_MERCHANT') {
        messageApi.success('已记录联系商家请求');
      } else {
        messageApi.success('售后申请已提交');
        navigate(`/after-sales/${afterSalesCase.id}`);
      }
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, '售后申请提交失败'))
  });

  const contactMerchant = useMutation({
    mutationFn: async (sourceOrder: Order) => chatApi.createConversation({
      customerId: user.id,
      merchantId: sourceOrder.merchantId ?? 0,
      merchantName: sourceOrder.merchantName,
      contextType: 'ORDER',
      contextId: sourceOrder.id,
      contextTitle: `Order #${sourceOrder.id}`
    }),
    onSuccess: (conversation) => navigate(`/chat/${conversation.id}`),
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Contact merchant failed'))
  });

  const createReview = useMutation({
    mutationFn: (values: { rating: number; comment?: string }) => {
      if (!order || !reviewTarget) throw new Error('No order item selected');
      return catalogApi.createReview(reviewTarget.productId, {
        orderId: order.id,
        orderLineId: reviewTarget.id,
        rating: values.rating,
        comment: values.comment
      });
    },
    onSuccess: () => {
      setReviewTarget(null);
      reviewForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
      messageApi.success('Review submitted');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Review failed'))
  });

  const reorder = useMutation({
    mutationFn: async (sourceOrder: Order) => {
      for (const line of sourceOrder.lines) {
        await orderApi.addToCart({ userId: user.id, productId: line.productId, quantity: line.quantity });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
      messageApi.success('Added order items to cart');
      navigate('/cart');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Reorder failed'))
  });

  const openAfterSales = () => {
    afterSalesForm.setFieldsValue({
      type: 'REFUND_ONLY',
      contactMethod: user.phoneNumber || user.email
    });
    setAfterSalesOpen(true);
  };

  return (
    <Space direction="vertical" size="large" className="page">
      {contextHolder}
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>{isOpsUser ? 'Order Fulfillment Detail' : 'Order Detail'}</Typography.Title>
          <Typography.Text type="secondary">
            {isOpsUser ? 'Review customer delivery information and fulfill the order.' : 'Review merchant, item, payment, delivery, and after-sales actions.'}
          </Typography.Text>
        </div>
        <Button onClick={() => navigate('/orders')}>Back to orders</Button>
      </div>

      {orderQuery.isError && (
        <Alert type="error" showIcon message={apiErrorMessage(orderQuery.error, 'Order detail failed to load')} />
      )}

      {!canViewOrder && (
        <Alert type="error" showIcon message="You do not have access to this order." />
      )}

      <Card loading={orderQuery.isLoading}>
        {order && canViewOrder && (
          <Space direction="vertical" size="large" className="full-width">
            <div className="order-detail-header">
              <Space direction="vertical" size={4}>
                <Typography.Title level={4} className="cart-total">Order #{order.id}</Typography.Title>
                <Typography.Text type="secondary">Created at {formatDate(order.createdAt)}</Typography.Text>
              </Space>
              <Tag color={statusColors[order.status]}>{statusLabels[order.status]}</Tag>
            </div>

            <Steps
              current={statusStep(order.status)}
              status={order.status === 'AFTER_SALES' || order.status === 'CANCELLED' ? 'error' : 'process'}
              items={[
                { title: '待付款' },
                { title: '待发货' },
                { title: '待收货' },
                { title: '已完成' }
              ]}
            />

            <div className="order-action-bar">
              {canPayOrder && (
                <Button
                  type="primary"
                  icon={<CreditCardOutlined />}
                  loading={createPayment.isPending}
                  onClick={() => createPayment.mutate(order)}
                >
                  Pay Now
                </Button>
              )}
              {canPayOrder && (
                <Button danger loading={cancelOrder.isPending} onClick={() => cancelOrder.mutate(order.id)}>
                  Cancel order
                </Button>
              )}
              {!isOpsUser && order.status === 'PENDING_RECEIPT' && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={confirmReceipt.isPending}
                  onClick={() => confirmReceipt.mutate(order.id)}
                >
                  确认收货
                </Button>
              )}
              {!isOpsUser && (
                <Button icon={<ReloadOutlined />} loading={reorder.isPending} onClick={() => reorder.mutate(order)}>
                  再来一单
                </Button>
              )}
              {!isOpsUser && (
                <Button icon={<MessageOutlined />} loading={contactMerchant.isPending} onClick={() => contactMerchant.mutate(order)}>
                  联系商家
                </Button>
              )}
              {!isOpsUser && order.status !== 'AFTER_SALES' && order.status !== 'PENDING_PAYMENT' && (
                <Button icon={<RollbackOutlined />} onClick={openAfterSales}>
                  退款/售后
                </Button>
              )}
              {!isOpsUser && order.status === 'AFTER_SALES' && latestAfterSales && (
                <Button icon={<RollbackOutlined />}>
                  <Link to={`/after-sales/${latestAfterSales.id}`}>查看售后</Link>
                </Button>
              )}
              {canManageOrder && order.status === 'PENDING_SHIPMENT' && (
                <Button
                  type="primary"
                  icon={<TruckOutlined />}
                  loading={shipOrder.isPending}
                  onClick={() => shipOrder.mutate(order.id)}
                >
                  确认发货
                </Button>
              )}
              {canManageOrder && order.status === 'PENDING_RECEIPT' && (
                <Alert type="info" showIcon message="Order has shipped. Waiting for customer receipt confirmation." />
              )}
              {canManageOrder && order.status === 'AFTER_SALES' && latestAfterSales && (
                <Button icon={<RollbackOutlined />}>
                  <Link to={`/after-sales/${latestAfterSales.id}`}>处理售后</Link>
                </Button>
              )}
            </div>

            {afterSalesCases.length > 0 && (
              <Card size="small" title="售后记录">
                <Space wrap>
                  {afterSalesCases.map((afterSalesCase) => (
                    <Button key={afterSalesCase.id} size="small">
                      <Link to={`/after-sales/${afterSalesCase.id}`}>
                        #{afterSalesCase.id} {afterSalesTypeLabels[afterSalesCase.type]}
                      </Link>
                    </Button>
                  ))}
                </Space>
              </Card>
            )}
          </Space>
        )}
      </Card>

      {order && canViewOrder && (
        <>
          <Card title={isOpsUser ? 'Customer & Payment' : '订单信息'}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="订单编号">#{order.id}</Descriptions.Item>
              <Descriptions.Item label="Payment status">{order.paymentStatus}</Descriptions.Item>
              <Descriptions.Item label="付款时间">{order.paymentStatus === 'PAID' ? formatDate(order.paidAt) : 'Unpaid'}</Descriptions.Item>
              <Descriptions.Item label="收货信息">
                <Space>
                  <ShoppingOutlined />
                  <Typography.Text>{order.shippingAddress}</Typography.Text>
                  <Typography.Text type="secondary">{order.phoneNumber}</Typography.Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="支付方式">{order.paymentMethod || 'Profile payment method'}</Descriptions.Item>
              {isOpsUser && <Descriptions.Item label="Merchant">{order.merchantName}</Descriptions.Item>}
              {isOpsUser && <Descriptions.Item label="Customer ID">{order.userId}</Descriptions.Item>}
              {isOpsUser && <Descriptions.Item label="Last updated">{formatDate(order.updatedAt)}</Descriptions.Item>}
            </Descriptions>
          </Card>

          {groups.length === 0 ? (
            <Card>
              <Empty description="No order items" />
            </Card>
          ) : (
            groups.map((group) => (
              <Card key={group.key} title={group.merchantName} className="merchant-cart-card">
                <Space direction="vertical" className="full-width" size={0}>
                  {group.lines.map((line) => (
                    <div className="cart-item-row" key={`${line.productId}-${line.productName}`}>
                      <div />
                      <Link to={`/products/${line.productId}`} className="cart-product-link">
                        <Image
                          src={line.imageUrls?.[0] || ''}
                          alt={line.productName}
                          className="cart-product-image"
                          preview={false}
                          loading="lazy"
                          fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72'%3E%3Crect fill='%23f5f5f5' width='72' height='72'/%3E%3Ctext x='36' y='40' text-anchor='middle' fill='%23bfbfbf' font-size='10'%3ENo img%3C/text%3E%3C/svg%3E"
                        />
                        <div className="cart-product-info">
                          <Typography.Text strong>{line.productName}</Typography.Text>
                          <Typography.Text type="secondary">Unit price ${Number(line.unitPrice).toFixed(2)}</Typography.Text>
                          {!isOpsUser && order.status === 'COMPLETED' && (
                            <Button
                              size="small"
                              onClick={(event) => {
                                event.preventDefault();
                                setReviewTarget(line);
                                reviewForm.setFieldsValue({ rating: 5, comment: undefined });
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </Link>
                      <Typography.Text className="cart-quantity">x{line.quantity}</Typography.Text>
                      <Typography.Text strong className="cart-subtotal">
                        ${(line.unitPrice * line.quantity).toFixed(2)}
                      </Typography.Text>
                    </div>
                  ))}
                </Space>
              </Card>
            ))
          )}

          <Card>
            <div className="cart-summary-bar">
              <Typography.Text>Total</Typography.Text>
              <Typography.Title level={4} className="cart-total">${Number(order.totalAmount).toFixed(2)}</Typography.Title>
            </div>
          </Card>
        </>
      )}

      <Modal
        title="申请退款/售后"
        open={afterSalesOpen}
        okText={selectedAfterSalesType === 'CONTACT_MERCHANT' ? '提交联系请求' : '提交售后申请'}
        confirmLoading={createAfterSales.isPending}
        onCancel={() => setAfterSalesOpen(false)}
        onOk={() => afterSalesForm.submit()}
      >
        <Form form={afterSalesForm} layout="vertical" onFinish={(values) => createAfterSales.mutate(values)}>
          <Form.Item name="type" label="售后类型" rules={[{ required: true, message: '请选择售后类型' }]}>
            <Select
              options={[
                { value: 'RETURN', label: '退货' },
                { value: 'EXCHANGE', label: '换货' },
                { value: 'REFUND_ONLY', label: '仅退款' },
                { value: 'CONTACT_MERCHANT', label: '与商家联系' }
              ]}
            />
          </Form.Item>
          {selectedAfterSalesType === 'RETURN' && (
            <Alert className="stacked-alert" type="info" showIcon message="退货申请通过后，商家会在售后详情中补充寄回说明。请保留商品包装和物流凭证。" />
          )}
          {selectedAfterSalesType === 'EXCHANGE' && (
            <Alert className="stacked-alert" type="info" showIcon message="换货申请通过后，商家会确认可替换商品和重新发货安排。请在说明中写清尺码、颜色或型号需求。" />
          )}
          <Form.Item name="reason" label="原因" rules={[{ required: true, message: '请填写原因' }]}>
            <Input placeholder={selectedAfterSalesType === 'CONTACT_MERCHANT' ? '例如：想确认发货时间' : '例如：尺码不合适、商品损坏、未收到货'} />
          </Form.Item>
          <Form.Item name="description" label="补充说明">
            <Input.TextArea rows={4} placeholder="描述问题、期望处理方式或换货要求" />
          </Form.Item>
          <Form.Item name="contactMethod" label="联系方式">
            <Input prefix={<MessageOutlined />} placeholder="手机号、邮箱或其他联系方式" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={reviewTarget ? `Review ${reviewTarget.productName}` : 'Review item'}
        open={!!reviewTarget}
        okText="Submit review"
        confirmLoading={createReview.isPending}
        onCancel={() => setReviewTarget(null)}
        onOk={() => reviewForm.submit()}
      >
        <Form form={reviewForm} layout="vertical" initialValues={{ rating: 5 }} onFinish={(values) => createReview.mutate(values)}>
          <Form.Item name="rating" label="Rating" rules={[{ required: true }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="comment" label="Comment">
            <Input.TextArea rows={4} maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
