import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MessageOutlined,
  RollbackOutlined,
  SwapOutlined,
  TruckOutlined,
  UndoOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Empty, Form, Image, Input, Modal, Space, Tag, Timeline, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiErrorMessage, chatApi, orderApi } from '../api/client';
import type { AfterSalesCase, AfterSalesStatus, AfterSalesType, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

interface DecisionValues {
  note?: string;
}

type MerchantDecision = 'approve' | 'reject' | 'returnReceived' | 'shipReplacement';

const typeLabels: Record<AfterSalesType, string> = {
  RETURN: 'Return',
  EXCHANGE: 'Exchange',
  REFUND_ONLY: 'Refund only',
  CONTACT_MERCHANT: 'Contact merchant'
};

const statusLabels: Record<AfterSalesStatus, string> = {
  PENDING_MERCHANT: 'Waiting for merchant review',
  MERCHANT_REJECTED: 'Rejected by merchant',
  RETURN_PENDING_RECEIPT: 'Waiting for merchant to receive return',
  EXCHANGE_PENDING_SHIPMENT: 'Waiting for replacement shipment',
  EXCHANGE_PENDING_RECEIPT: 'Waiting for customer receipt',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

const statusColors: Record<AfterSalesStatus, string> = {
  PENDING_MERCHANT: 'orange',
  MERCHANT_REJECTED: 'red',
  RETURN_PENDING_RECEIPT: 'blue',
  EXCHANGE_PENDING_SHIPMENT: 'purple',
  EXCHANGE_PENDING_RECEIPT: 'cyan',
  COMPLETED: 'green',
  CANCELLED: 'default'
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : 'Not available';
}

function guidance(afterSalesCase: AfterSalesCase) {
  if (afterSalesCase.type === 'RETURN') {
    return {
      icon: <UndoOutlined />,
      title: 'Return flow',
      message: 'The merchant must approve the request first. The case is completed only after the merchant confirms the returned goods were received.'
    };
  }
  if (afterSalesCase.type === 'EXCHANGE') {
    return {
      icon: <SwapOutlined />,
      title: 'Exchange flow',
      message: 'After approval, the merchant confirms receipt of returned goods, ships the replacement, and the customer confirms replacement receipt.'
    };
  }
  if (afterSalesCase.type === 'REFUND_ONLY') {
    return {
      icon: <RollbackOutlined />,
      title: 'Refund only flow',
      message: 'No returned goods are required. Merchant approval completes the refund-only case in this v1 workflow.'
    };
  }
  return {
    icon: <MessageOutlined />,
    title: 'Contact request',
    message: 'This record preserves the customer contact request. It does not change fulfillment or refund state.'
  };
}

function timelineItems(afterSalesCase: AfterSalesCase) {
  const items = [
    {
      color: 'blue',
      children: `Customer submitted request: ${formatDate(afterSalesCase.createdAt)}`
    }
  ];

  if (afterSalesCase.status === 'PENDING_MERCHANT') {
    items.push({ color: 'gray', children: 'Waiting for merchant review' });
    return items;
  }
  if (afterSalesCase.status === 'MERCHANT_REJECTED') {
    items.push({ color: 'red', children: `Merchant rejected: ${formatDate(afterSalesCase.updatedAt)}` });
    return items;
  }
  if (afterSalesCase.status === 'CANCELLED') {
    items.push({ color: 'gray', children: `Customer cancelled: ${formatDate(afterSalesCase.updatedAt)}` });
    return items;
  }
  if (afterSalesCase.type === 'RETURN' || afterSalesCase.type === 'EXCHANGE') {
    items.push({
      color: afterSalesCase.status === 'RETURN_PENDING_RECEIPT' ? 'blue' : 'green',
      children: 'Merchant approved; customer should return the goods'
    });
  }
  if (afterSalesCase.type === 'EXCHANGE') {
    if (afterSalesCase.status === 'RETURN_PENDING_RECEIPT') {
      items.push({ color: 'gray', children: 'Waiting for merchant to receive returned goods' });
    } else {
      items.push({ color: 'green', children: 'Merchant received returned goods' });
    }
    if (afterSalesCase.status === 'EXCHANGE_PENDING_SHIPMENT') {
      items.push({ color: 'blue', children: 'Waiting for merchant to ship replacement' });
    }
    if (afterSalesCase.status === 'EXCHANGE_PENDING_RECEIPT') {
      items.push({ color: 'green', children: 'Merchant shipped replacement' });
      items.push({ color: 'blue', children: 'Waiting for customer to confirm replacement receipt' });
    }
  }
  if (afterSalesCase.status === 'COMPLETED') {
    items.push({ color: 'green', children: `Completed: ${formatDate(afterSalesCase.updatedAt)}` });
  }
  return items;
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
  const merchantId = user.role === 'MERCHANT' ? (user.merchantId ?? user.id) : undefined;
  const pageGuidance = afterSalesCase ? guidance(afterSalesCase) : null;

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
      messageApi.success('After-sales request cancelled');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Cancel after-sales failed'))
  });

  const approveAfterSales = useMutation({
    mutationFn: (values: DecisionValues) => orderApi.approveAfterSales(id, { merchantId, note: values.note }),
    onSuccess: () => {
      refresh();
      decisionForm.resetFields();
      messageApi.success('After-sales request approved');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Approve after-sales failed'))
  });

  const rejectAfterSales = useMutation({
    mutationFn: (values: DecisionValues) => orderApi.rejectAfterSales(id, { merchantId, note: values.note }),
    onSuccess: () => {
      refresh();
      decisionForm.resetFields();
      messageApi.success('After-sales request rejected');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Reject after-sales failed'))
  });

  const confirmReturnReceived = useMutation({
    mutationFn: (values: DecisionValues) => orderApi.confirmReturnReceived(id, { merchantId, note: values.note }),
    onSuccess: () => {
      refresh();
      decisionForm.resetFields();
      messageApi.success('Returned goods confirmed');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Confirm returned goods failed'))
  });

  const shipReplacement = useMutation({
    mutationFn: (values: DecisionValues) => orderApi.shipReplacement(id, { merchantId, note: values.note }),
    onSuccess: () => {
      refresh();
      decisionForm.resetFields();
      messageApi.success('Replacement shipment recorded');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Ship replacement failed'))
  });

  const confirmReplacementReceived = useMutation({
    mutationFn: () => orderApi.confirmReplacementReceived(id),
    onSuccess: () => {
      refresh();
      messageApi.success('Replacement receipt confirmed');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Confirm replacement receipt failed'))
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

  const runMerchantDecision = (action: MerchantDecision) => {
    decisionForm.validateFields().then((values) => {
      const actionLabels: Record<MerchantDecision, string> = {
        approve: 'approve this request',
        reject: 'reject this request',
        returnReceived: 'confirm returned goods were received',
        shipReplacement: 'mark the replacement as shipped'
      };
      Modal.confirm({
        title: `Confirm to ${actionLabels[action]}?`,
        content: 'The customer will see the updated status and your processing note.',
        onOk: () => {
          if (action === 'approve') approveAfterSales.mutate(values);
          if (action === 'reject') rejectAfterSales.mutate(values);
          if (action === 'returnReceived') confirmReturnReceived.mutate(values);
          if (action === 'shipReplacement') shipReplacement.mutate(values);
        }
      });
    });
  };

  const renderMerchantAction = () => {
    if (!afterSalesCase || !canManageCase || afterSalesCase.type === 'CONTACT_MERCHANT') {
      return null;
    }
    let title = 'Merchant processing';
    let placeholder = 'Add processing note, return address, shipment details, or rejection reason';
    let buttons: ReactNode = null;

    if (afterSalesCase.status === 'PENDING_MERCHANT') {
      title = 'Review request';
      buttons = (
        <Space>
          <Button type="primary" icon={<CheckCircleOutlined />} loading={approveAfterSales.isPending} onClick={() => runMerchantDecision('approve')}>
            {afterSalesCase.type === 'REFUND_ONLY' ? 'Approve refund' : `Approve ${typeLabels[afterSalesCase.type].toLowerCase()}`}
          </Button>
          <Button danger icon={<CloseCircleOutlined />} loading={rejectAfterSales.isPending} onClick={() => runMerchantDecision('reject')}>
            Reject request
          </Button>
        </Space>
      );
    } else if (afterSalesCase.status === 'RETURN_PENDING_RECEIPT') {
      title = 'Returned goods receipt';
      placeholder = 'Record returned package condition, refund note, or next exchange step';
      buttons = (
        <Button type="primary" icon={<CheckCircleOutlined />} loading={confirmReturnReceived.isPending} onClick={() => runMerchantDecision('returnReceived')}>
          Confirm returned goods received
        </Button>
      );
    } else if (afterSalesCase.status === 'EXCHANGE_PENDING_SHIPMENT') {
      title = 'Replacement shipment';
      placeholder = 'Record replacement item and shipment note';
      buttons = (
        <Button type="primary" icon={<TruckOutlined />} loading={shipReplacement.isPending} onClick={() => runMerchantDecision('shipReplacement')}>
          Mark replacement shipped
        </Button>
      );
    }

    if (!buttons) {
      return null;
    }

    return (
      <Card title={title}>
        <Form form={decisionForm} layout="vertical">
          <Form.Item name="note" label="Processing note" rules={[{ required: true, message: 'Processing note is required' }]}>
            <Input.TextArea rows={4} placeholder={placeholder} />
          </Form.Item>
          {buttons}
        </Form>
      </Card>
    );
  };

  return (
    <Space direction="vertical" size="large" className="page">
      {contextHolder}
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>After-sales detail</Typography.Title>
          <Typography.Text type="secondary">Track request type, merchant handling, return flow, exchange flow, and related order items.</Typography.Text>
        </div>
        <Space>
          {ownsCase && (
            <Button icon={<MessageOutlined />} loading={contactMerchant.isPending} onClick={() => contactMerchant.mutate()}>
              Contact merchant
            </Button>
          )}
          <Button onClick={() => navigate('/orders')}>Back to orders</Button>
        </Space>
      </div>

      {afterSalesQuery.isError && (
        <Alert type="error" showIcon message={apiErrorMessage(afterSalesQuery.error, 'After-sales detail failed to load')} />
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
                  Related order <Link to={`/orders/${afterSalesCase.orderId}`}>#{afterSalesCase.orderId}</Link> | Created at {formatDate(afterSalesCase.createdAt)}
                </Typography.Text>
              </Space>
              <Space>
                <Tag>{typeLabels[afterSalesCase.type]}</Tag>
                <Tag color={statusColors[afterSalesCase.status]}>{statusLabels[afterSalesCase.status]}</Tag>
              </Space>
            </div>

            {pageGuidance && (
              <Alert type="info" showIcon icon={pageGuidance.icon} message={pageGuidance.title} description={pageGuidance.message} />
            )}

            <Timeline items={timelineItems(afterSalesCase)} />
          </Space>
        )}
      </Card>

      {afterSalesCase && canViewCase && (
        <>
          <Card title="Request information">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Type">{typeLabels[afterSalesCase.type]}</Descriptions.Item>
              <Descriptions.Item label="Reason">{afterSalesCase.reason}</Descriptions.Item>
              <Descriptions.Item label="Description">{afterSalesCase.description || 'None'}</Descriptions.Item>
              <Descriptions.Item label="Contact">{afterSalesCase.contactMethod || afterSalesCase.phoneNumber}</Descriptions.Item>
              <Descriptions.Item label="Shipping info">{afterSalesCase.shippingAddress} | {afterSalesCase.phoneNumber}</Descriptions.Item>
              <Descriptions.Item label="Merchant">{afterSalesCase.merchantName}</Descriptions.Item>
              <Descriptions.Item label="Order amount">${Number(afterSalesCase.orderTotalAmount).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Merchant note">{afterSalesCase.merchantNote || 'None'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Related products" className="merchant-cart-card">
            {afterSalesCase.lines.length === 0 ? (
              <Empty description="No order items" />
            ) : (
              <Space direction="vertical" className="full-width" size={0}>
                {afterSalesCase.lines.map((line) => (
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
                Cancel after-sales request
              </Button>
            </Card>
          )}

          {ownsCase && afterSalesCase.status === 'EXCHANGE_PENDING_RECEIPT' && (
            <Card title="Replacement receipt">
              <Space direction="vertical">
                <Typography.Text>Confirm only after you have received and checked the replacement goods.</Typography.Text>
                <Button type="primary" icon={<CheckCircleOutlined />} loading={confirmReplacementReceived.isPending} onClick={() => confirmReplacementReceived.mutate()}>
                  Confirm replacement received
                </Button>
              </Space>
            </Card>
          )}

          {renderMerchantAction()}

          {canManageCase && afterSalesCase.type === 'CONTACT_MERCHANT' && (
            <Card title="Contact request">
              <Alert
                type="info"
                showIcon
                message="Customer wants the merchant to follow up"
                description={`Contact method: ${afterSalesCase.contactMethod || afterSalesCase.phoneNumber}`}
              />
            </Card>
          )}
        </>
      )}
    </Space>
  );
}
