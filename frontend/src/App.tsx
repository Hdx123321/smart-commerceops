import { LogoutOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Skeleton, Space, Typography, type MenuProps } from 'antd';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useState, type ReactElement } from 'react';
import { clearSession, currentUser } from './api/client';
import { disconnectChatSocket } from './api/chatSocketClient';
import ClickSpark from './components/react-bits/ClickSpark';
import type { Role, UserProfile } from './types';

const { Header, Content } = Layout;
const OPS_ROLES: Role[] = ['MERCHANT', 'ADMIN'];
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AfterSalesDetailPage = lazy(() => import('./pages/AfterSalesDetailPage'));
const ChatDetailPage = lazy(() => import('./pages/ChatDetailPage'));
const ChatListPage = lazy(() => import('./pages/ChatListPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

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
    void disconnectChatSocket();
    clearSession();
    setUser(null);
  };

  const menuItems: MenuProps['items'] = [
    { key: '/products', label: <Link to="/products">Products</Link> },
    ...(user?.role === 'CUSTOMER' ? [{ key: '/cart', label: <Link to="/cart">Cart</Link> }] : []),
    ...(user ? [{ key: '/orders', label: <Link to="/orders">Orders</Link> }] : []),
    ...(user ? [{ key: '/chat', label: <Link to="/chat">Messages</Link> }] : []),
    ...(isOpsUser(user) ? [{ key: '/dashboard', label: <Link to="/dashboard">Ops Dashboard</Link> }] : []),
    ...(user ? [{ key: '/profile', label: <Link to="/profile">Profile</Link> }] : [])
  ];
  const selectedMenuKey = location.pathname.startsWith('/chat') ? '/chat' : location.pathname;

  return (
    <Layout className="app-shell">
      <Header className="topbar">
        <Space className="brand">
          <img src="/logo.png" alt="DailyHaven" className="brand-logo" />
        </Space>
        <Menu mode="horizontal" selectedKeys={[selectedMenuKey]} items={menuItems} className="nav" />
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
        <ClickSpark sparkColor="#000000" sparkCount={6} sparkSize={8} sparkRadius={12} duration={350}>
        <Suspense fallback={<div className="page"><Skeleton active paragraph={{ rows: 8 }} /></div>}>
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
            path="/orders/:orderId"
            element={(
              <ProtectedRoute user={user}>
                <OrderDetailPage user={user as UserProfile} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/after-sales/:caseId"
            element={(
              <ProtectedRoute user={user}>
                <AfterSalesDetailPage user={user as UserProfile} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/chat"
            element={(
              <ProtectedRoute user={user}>
                <ChatListPage user={user as UserProfile} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/chat/:conversationId"
            element={(
              <ProtectedRoute user={user}>
                <ChatDetailPage user={user as UserProfile} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute user={user} allowedRoles={OPS_ROLES}>
                <DashboardPage user={user as UserProfile} />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
        </Suspense>
        </ClickSpark>
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
