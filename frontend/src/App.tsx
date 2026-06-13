import { LogoutOutlined, ShopOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Space, Typography, type MenuProps } from 'antd';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useState, type ReactElement } from 'react';
import { clearSession, currentUser } from './api/client';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import type { Role, UserProfile } from './types';

const { Header, Content } = Layout;
const OPS_ROLES: Role[] = ['MERCHANT', 'ADMIN'];

function isOpsUser(user: UserProfile | null) {
  return !!user && OPS_ROLES.includes(user.role);
}

function homeFor(user: UserProfile | null) {
  if (!user) {
    return '/products';
  }
  return isOpsUser(user) ? '/dashboard' : '/products';
}

function ProtectedRoute({
  user,
  allowedRoles,
  children
}: {
  user: UserProfile | null;
  allowedRoles?: Role[];
  children: ReactElement;
}) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeFor(user)} replace />;
  }
  return children;
}

function Shell() {
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(currentUser());

  const logout = () => {
    clearSession();
    setUser(null);
  };

  const menuItems: MenuProps['items'] = [
    { key: '/products', label: <Link to="/products">Products</Link> },
    ...(user?.role === 'CUSTOMER' ? [{ key: '/cart', label: <Link to="/cart">Cart</Link> }] : []),
    ...(user ? [{ key: '/orders', label: <Link to="/orders">Orders</Link> }] : []),
    ...(isOpsUser(user) ? [{ key: '/dashboard', label: <Link to="/dashboard">Ops Dashboard</Link> }] : []),
    ...(user ? [{ key: '/profile', label: <Link to="/profile">Profile</Link> }] : [])
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
          <Route
            path="/login"
            element={user ? <Navigate to={homeFor(user)} replace /> : <LoginPage onAuthenticated={setUser} />}
          />
          <Route path="/products" element={<ProductsPage user={user} />} />
          <Route path="/products/:productId" element={<ProductDetailPage user={user} />} />
          <Route
            path="/profile"
            element={(
              <ProtectedRoute user={user}>
                <ProfilePage user={user as UserProfile} onProfileUpdated={setUser} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/cart"
            element={(
              <ProtectedRoute user={user} allowedRoles={['CUSTOMER']}>
                <CartPage user={user as UserProfile} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/orders"
            element={(
              <ProtectedRoute user={user}>
                <OrdersPage user={user as UserProfile} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute user={user} allowedRoles={OPS_ROLES}>
                <DashboardPage />
              </ProtectedRoute>
            )}
          />
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
