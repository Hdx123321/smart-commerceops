import {
  CloseCircleOutlined,
  MessageOutlined,
  RollbackOutlined,
  SwapOutlined,
  UndoOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Empty, Form, Image, Input, Modal, Space, Tag, Timeline, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiErrorMessage, chatApi, orderApi } from '../api/client';
import type { AfterSalesCase, AfterSalesStatus, AfterSalesType, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

interface DecisionValues {
  note?: string;
}

const typeLabels: Record<AfterSalesType, string> = {
  RETURN: '退货',
  EXCHANGE: '换货',
  REFUND_ONLY: '仅退款',
  CONTACT_MERCHANT: '与商家联系'
};

const statusLabels: Record<AfterSalesStatus, string> = {
  PENDING_MERCHANT: '待商家确认',
  MERCHANT_REJECTED: '商家拒绝',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
};

const statusColors: Record<AfterSalesStatus, string> = {
  PENDING_MERCHANT: 'orange',
  MERCHANT_REJECTED: 'red',
  COMPLETED: 'green',
  CANCELLED: 'default'
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : 'Not available';
}

function specialGuidance(afterSalesCase: AfterSalesCase) {
  if (afterSalesCase.type === 'RETURN') {
    return {
      icon: <UndoOutlined />,
      title: '退货处理',
      message: '请保留商品原包装、配件和物流凭证。商家确认后会在处理备注中补充寄回地址、收件人和退款安排。'
    };
  }
  if (afterSalesCase.type === 'EXCHANGE') {
    return {
      icon: <SwapOutlined />,
      title: '换货处理',
      message: '请在申请说明中写清要更换的尺码、颜色或型号。商家确认后会在处理备注中说明可替换库存和重新发货安排。'
    };
  }
  if (afterSalesCase.type === 'REFUND_ONLY') {
    return {
      icon: <RollbackOutlined />,
      title: '仅退款处理',
      message: '仅退款不会要求寄回商品。商家确认后会在处理备注中说明退款原因、金额和预计完成方式。'
    };
  }
  return {
    icon: <MessageOutlined />,
    title: '联系商家',
    message: '该记录用于保存联系请求，不改变订单履约状态。商家可根据联系方式继续沟通。'
  };
}

export default function AfterSalesDetailPage({ user }: Props) {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [decisionForm] = Form.useForm<DecisionValues>();
  const id = Number(caseId);

  const afterSalesQuery = useQuery({
    queryKey: ['after-sales', id],
    queryFn: () => orderApi.afterSalesCase(id),
    enabled: Number.isFinite(id)
  });

  const afterSalesCase = afterSalesQuery.data;
  const ownsCase = !!afterSalesCase && user.role === 'CUSTOMER' && afterSalesCase.userId === user.id;
  const ownsMerchantCase = !!afterSalesCase && user.role === 'MERCHANT' && afterSalesCase.merchantId === (user.merchantId ?? user.id);
  const canManageCase = !!afterSalesCase && (user.role === 'ADMIN' || ownsMerchantCase);
  const canViewCase = !afterSalesCase || ownsCase || canManageCase;
  const guidance = afterSalesCase ? specialGuidance(afterSalesCase) : null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['after-sales', id] });
    if (afterSalesCase) {
      queryClient.invalidateQueries({ queryKey: ['order', afterSalesCase.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-after-sales', afterSalesCase.orderId] });
    }
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const cancelAfterSales = useMutation({
    mutationFn: () => orderApi.cancelAfterSales(id, user.id),
    onSuccess: () => {
      refresh();
      messageApi.success('售后申请已取消');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, '取消售后失败'))
  });

  const completeAfterSales = useMutation({
    mutationFn: (values: DecisionValues) => orderApi.completeAfterSales(id, { merchantId: user.role === 'MERCHANT' ? (user.merchantId ?? user.id) : undefined, note: values.note }),
    onSuccess: () => {
      refresh();
      decisionForm.resetFields();
      messageApi.success('售后已完成');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, '完成售后失败'))
  });

  const rejectAfterSales = useMutation({
    mutationFn: (values: DecisionValues) => orderApi.rejectAfterSales(id, { merchantId: user.role === 'MERCHANT' ? (user.merchantId ?? user.id) : undefined, note: values.note }),
    onSuccess: () => {
      refresh();
      decisionForm.resetFields();
      messageApi.success('售后已拒绝');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, '拒绝售后失败'))
  });

  const contactMerchant = useMutation({
    mutationFn: async () => {
      if (!afterSalesCase) {
        throw new Error('After-sales case is not loaded');
      }
      return chatApi.createConversation({
        customerId: afterSalesCase.userId,
        merchantId: afterSalesCase.merchantId ?? 0,
        merchantName: afterSalesCase.merchantName,
        contextType: 'AFTER_SALES',
        contextId: afterSalesCase.id,
        contextTitle: `After-sales #${afterSalesCase.id}`
      });
    },
    onSuccess: (conversation) => navigate(`/chat/${conversation.id}`),
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Contact merchant failed'))
  });

  const confirmDecision = (action: 'complete' | 'reject') => {
    decisionForm.validateFields().then((values) => {
      Modal.confirm({
        title: action === 'complete' ? '确认完成售后？' : '确认拒绝售后？',
        content: action === 'complete' ? '完成后客户会看到商家的处理备注。' : '拒绝后客户会看到拒绝原因。',
        onOk: () => {
          if (action === 'complete') {
            completeAfterSales.mutate(values);
          } else {
            rejectAfterSales.mutate(values);
          }
        }
      });
    });
  };

  return (
    <Space direction="vertical" size="large" className="page">
      {contextHolder}
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>售后详情</Typography.Title>
          <Typography.Text type="secondary">查看售后类型、申请说明、商家处理状态和相关商品。</Typography.Text>
        </div>
        <Space>
          {ownsCase && (
            <Button icon={<MessageOutlined />} loading={contactMerchant.isPending} onClick={() => contactMerchant.mutate()}>
              联系商家
            </Button>
          )}
          {afterSalesCase && <Button onClick={() => navigate(`/orders/${afterSalesCase.orderId}`)}>返回订单</Button>}
          <Button onClick={() => navigate('/orders')}>返回订单列表</Button>
        </Space>
      </div>

      {afterSalesQuery.isError && (
        <Alert type="error" showIcon message={apiErrorMessage(afterSalesQuery.error, '售后详情加载失败')} />
      )}

      {!canViewCase && (
        <Alert type="error" showIcon message="You do not have access to this after-sales case." />
      )}

      <Card loading={afterSalesQuery.isLoading}>
        {afterSalesCase && canViewCase && (
          <Space direction="vertical" size="large" className="full-width">
            <div className="order-detail-header">
              <Space direction="vertical" size={4}>
                <Typography.Title level={4} className="cart-total">After-sales #{afterSalesCase.id}</Typography.Title>
                <Typography.Text type="secondary">
                  Order <Link to={`/orders/${afterSalesCase.orderId}`}>#{afterSalesCase.orderId}</Link> · Created at {formatDate(afterSalesCase.createdAt)}
                </Typography.Text>
              </Space>
              <Space>
                <Tag>{typeLabels[afterSalesCase.type]}</Tag>
                <Tag color={statusColors[afterSalesCase.status]}>{statusLabels[afterSalesCase.status]}</Tag>
              </Space>
            </div>

            {guidance && (
              <Alert type="info" showIcon icon={guidance.icon} message={guidance.title} description={guidance.message} />
            )}

            <Timeline
              items={[
                { color: 'blue', children: `客户提交申请：${formatDate(afterSalesCase.createdAt)}` },
                {
                  color: afterSalesCase.status === 'PENDING_MERCHANT' ? 'gray' : statusColors[afterSalesCase.status],
                  children: afterSalesCase.status === 'PENDING_MERCHANT'
                    ? '等待商家确认'
                    : `${statusLabels[afterSalesCase.status]}：${formatDate(afterSalesCase.updatedAt)}`
                }
              ]}
            />
          </Space>
        )}
      </Card>

      {afterSalesCase && canViewCase && (
        <>
          <Card title="申请信息">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="售后类型">{typeLabels[afterSalesCase.type]}</Descriptions.Item>
              <Descriptions.Item label="申请原因">{afterSalesCase.reason}</Descriptions.Item>
              <Descriptions.Item label="补充说明">{afterSalesCase.description || '无'}</Descriptions.Item>
              <Descriptions.Item label="联系方式">{afterSalesCase.contactMethod || afterSalesCase.phoneNumber}</Descriptions.Item>
              <Descriptions.Item label="收货信息">{afterSalesCase.shippingAddress} · {afterSalesCase.phoneNumber}</Descriptions.Item>
              <Descriptions.Item label="商家">{afterSalesCase.merchantName}</Descriptions.Item>
              <Descriptions.Item label="订单金额">${Number(afterSalesCase.orderTotalAmount).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="商家处理备注">{afterSalesCase.merchantNote || '暂无'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="相关商品" className="merchant-cart-card">
            {afterSalesCase.lines.length === 0 ? (
              <Empty description="No order items" />
            ) : (
              <Space direction="vertical" className="full-width" size={0}>
                {afterSalesCase.lines.map((line) => (
                  <div className="cart-item-row" key={`${line.productId}-${line.productName}`}>
                    <div />
                    <Link to={`/products/${line.productId}`} className="cart-product-link">
                      {line.imageUrls?.[0] ? (
                        <Image src={line.imageUrls[0]} alt={line.productName} className="cart-product-image" preview={false} />
                      ) : (
                        <div className="cart-product-image cart-product-image-empty">No image</div>
                      )}
                      <div className="cart-product-info">
                        <Typography.Text strong>{line.productName}</Typography.Text>
                        <Typography.Text type="secondary">Unit price ${Number(line.unitPrice).toFixed(2)}</Typography.Text>
                      </div>
                    </Link>
                    <Typography.Text className="cart-quantity">x{line.quantity}</Typography.Text>
                    <Typography.Text strong className="cart-subtotal">
                      ${(line.unitPrice * line.quantity).toFixed(2)}
                    </Typography.Text>
                  </div>
                ))}
              </Space>
            )}
          </Card>

          {ownsCase && afterSalesCase.status === 'PENDING_MERCHANT' && (
            <Card>
              <Button danger icon={<CloseCircleOutlined />} loading={cancelAfterSales.isPending} onClick={() => cancelAfterSales.mutate()}>
                取消售后
              </Button>
            </Card>
          )}

          {canManageCase && afterSalesCase.status === 'PENDING_MERCHANT' && afterSalesCase.type !== 'CONTACT_MERCHANT' && (
            <Card title="商家处理">
              <Form form={decisionForm} layout="vertical">
                <Form.Item name="note" label="处理备注" rules={[{ required: true, message: '请填写处理备注' }]}>
                  <Input.TextArea
                    rows={4}
                    placeholder={afterSalesCase.type === 'RETURN' || afterSalesCase.type === 'EXCHANGE'
                      ? '填写寄回地址、换货安排、退款说明或拒绝原因'
                      : '填写退款安排或拒绝原因'}
                  />
                </Form.Item>
                <Space>
                  <Button type="primary" loading={completeAfterSales.isPending} onClick={() => confirmDecision('complete')}>
                    标记已完成
                  </Button>
                  <Button danger loading={rejectAfterSales.isPending} onClick={() => confirmDecision('reject')}>
                    拒绝申请
                  </Button>
                </Space>
              </Form>
            </Card>
          )}

          {canManageCase && afterSalesCase.type === 'CONTACT_MERCHANT' && (
            <Card title="联系请求">
              <Alert
                type="info"
                showIcon
                message="客户希望商家主动联系"
                description={`联系方式：${afterSalesCase.contactMethod || afterSalesCase.phoneNumber}`}
              />
            </Card>
          )}
        </>
      )}
    </Space>
  );
}
