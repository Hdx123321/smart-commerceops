import { ShoppingOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Checkbox, Descriptions, Empty, Image, Space, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiErrorMessage, authApi, orderApi } from '../api/client';
import type { CartItem, UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

interface MerchantCartGroup {
  key: string;
  merchantName: string;
  items: CartItem[];
}

const EMPTY_CART: CartItem[] = [];

export default function CartPage({ user }: Props) {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const cartQuery = useQuery({ queryKey: ['cart', user.id], queryFn: () => orderApi.cart(user.id) });
  const profileQuery = useQuery({ queryKey: ['profile', user.id], queryFn: authApi.me, initialData: user });

  const cartItems = cartQuery.data ?? EMPTY_CART;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedItems = cartItems.filter((item) => selectedSet.has(item.id));
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const allItemIds = useMemo(() => cartItems.map((item) => item.id), [cartItems]);
  const allSelected = cartItems.length > 0 && selectedIds.length === cartItems.length;

  const groups = useMemo<MerchantCartGroup[]>(() => {
    const byMerchant = new Map<string, MerchantCartGroup>();
    cartItems.forEach((item) => {
      const merchantName = item.merchantName || 'Smart CommerceOps';
      const key = item.merchantId ? `merchant-${item.merchantId}` : merchantName;
      const group = byMerchant.get(key) ?? { key, merchantName, items: [] };
      group.items.push(item);
      byMerchant.set(key, group);
    });
    return Array.from(byMerchant.values());
  }, [cartItems]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => allItemIds.includes(id)));
  }, [allItemIds]);

  const profile = profileQuery.data;
  const hasShippingProfile = !!profile.shippingAddress?.trim() && !!profile.phoneNumber?.trim();

  const checkoutMutation = useMutation({
    mutationFn: () => orderApi.checkout({
      userId: user.id,
      shippingAddress: profile.shippingAddress ?? '',
      phoneNumber: profile.phoneNumber ?? '',
      paymentMethod: profile.paymentMethod,
      cartItemIds: selectedIds
    }),
    onSuccess: () => {
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      messageApi.success('Order created');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Checkout failed'))
  });

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? allItemIds : []);
  }

  function toggleMerchant(group: MerchantCartGroup, checked: boolean) {
    const groupIds = group.items.map((item) => item.id);
    setSelectedIds((current) => {
      const next = new Set(current);
      groupIds.forEach((id) => checked ? next.add(id) : next.delete(id));
      return Array.from(next);
    });
  }

  function toggleItem(itemId: number, checked: boolean) {
    setSelectedIds((current) => checked ? [...current, itemId] : current.filter((id) => id !== itemId));
  }

  return (
    <Space direction="vertical" size="large" className="page">
      {contextHolder}
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>Cart & Checkout</Typography.Title>
          <Typography.Text type="secondary">Select items by merchant and checkout only what you need now.</Typography.Text>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <Card>
          <Empty description="Your cart is empty" />
        </Card>
      ) : (
        <Space direction="vertical" size="middle" className="full-width">
          <div className="cart-toolbar">
            <Checkbox
              checked={allSelected}
              indeterminate={selectedIds.length > 0 && !allSelected}
              onChange={(event) => toggleAll(event.target.checked)}
            >
              Select all
            </Checkbox>
            <Typography.Text type="secondary">{selectedIds.length} selected</Typography.Text>
          </div>

          {groups.map((group) => {
            const groupIds = group.items.map((item) => item.id);
            const selectedCount = groupIds.filter((id) => selectedSet.has(id)).length;
            const groupSelected = selectedCount === groupIds.length;
            return (
              <Card
                key={group.key}
                className="merchant-cart-card"
                title={(
                  <Checkbox
                    checked={groupSelected}
                    indeterminate={selectedCount > 0 && !groupSelected}
                    onChange={(event) => toggleMerchant(group, event.target.checked)}
                  >
                    {group.merchantName}
                  </Checkbox>
                )}
              >
                <Space direction="vertical" className="full-width" size={0}>
                  {group.items.map((item) => (
                    <div className="cart-item-row" key={item.id}>
                      <Checkbox checked={selectedSet.has(item.id)} onChange={(event) => toggleItem(item.id, event.target.checked)} />
                      <Link to={`/products/${item.productId}`} className="cart-product-link">
                        {item.imageUrls?.[0] ? (
                          <Image src={item.imageUrls[0]} alt={item.productName} className="cart-product-image" preview={false} />
                        ) : (
                          <div className="cart-product-image cart-product-image-empty">No image</div>
                        )}
                        <div className="cart-product-info">
                          <Typography.Text strong>{item.productName}</Typography.Text>
                          <Typography.Text type="secondary">Unit price ${Number(item.unitPrice).toFixed(2)}</Typography.Text>
                        </div>
                      </Link>
                      <Typography.Text className="cart-quantity">x{item.quantity}</Typography.Text>
                      <Typography.Text strong className="cart-subtotal">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </Typography.Text>
                    </div>
                  ))}
                </Space>
              </Card>
            );
          })}

          <div className="cart-summary-bar">
            <Typography.Text>{selectedIds.length} selected</Typography.Text>
            <Typography.Title level={4} className="cart-total">Total ${selectedTotal.toFixed(2)}</Typography.Title>
          </div>
        </Space>
      )}

      <Card title="Shipping Details">
        {!hasShippingProfile && (
          <Alert
            type="warning"
            showIcon
            className="stacked-alert"
            message="Complete shipping address and phone number in Profile before checkout."
            action={<Link to="/profile">Edit Profile</Link>}
          />
        )}
        {selectedIds.length === 0 && cartItems.length > 0 && (
          <Alert
            type="info"
            showIcon
            className="stacked-alert"
            message="Select one or more cart items before checkout."
          />
        )}
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Shipping address">
            <Space>
              <ShoppingOutlined />
              <Typography.Text>{profile.shippingAddress || 'Not set'}</Typography.Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Phone number">{profile.phoneNumber || 'Not set'}</Descriptions.Item>
          <Descriptions.Item label="Payment method">{profile.paymentMethod || 'Not set'}</Descriptions.Item>
        </Descriptions>
        <Button
          type="primary"
          disabled={!cartItems.length || !selectedIds.length || !hasShippingProfile}
          loading={checkoutMutation.isPending}
          onClick={() => checkoutMutation.mutate()}
          style={{ marginTop: 16 }}
        >
          Checkout selected
        </Button>
      </Card>
    </Space>
  );
}
