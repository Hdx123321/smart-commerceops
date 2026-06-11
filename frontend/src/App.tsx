import { LogoutOutlined, ShopOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Space, Typography } from 'antd';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { clearSession, currentUser } from './api/client';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import type { UserProfile } from './types';

const { Header, Content } = Layout;

function Shell() {
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(currentUser());

  const logout = () => {
    clearSession();
    setUser(null);
  };

  const menuItems = [
    { key: '/products', label: <Link to="/products">Products</Link> },
    { key: '/cart', label: <Link to="/cart">Cart</Link> },
    { key: '/orders', label: <Link to="/orders">Orders</Link> },
    { key: '/dashboard', label: <Link to="/dashboard">Ops Dashboard</Link> }
  ];

  return (
    <Layout className="app-shell">
      <Header className="topbar">
        <Space className="brand">
          <ShopOutlined />
          <Typography.Text strong>Smart CommerceOps</Typography.Text>
        </Space>
        <Menu mode="horizontal" selectedKeys={[location.pathname]} items={menuItems} className="nav" />
        {user ? (
          <Space>
            <Typography.Text>{user.username} ({user.role})</Typography.Text>
            <Button icon={<LogoutOutlined />} onClick={logout}>Logout</Button>
          </Space>
        ) : (
          <Button type="primary">
            <Link to="/login">Login</Link>
          </Button>
        )}
      </Header>
      <Content className="content">
        <Routes>
          <Route path="/login" element={<LoginPage onAuthenticated={setUser} />} />
          <Route path="/products" element={<ProductsPage user={user} />} />
          <Route path="/cart" element={user ? <CartPage user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/orders" element={user ? <OrdersPage user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
