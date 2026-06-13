import { Button, Card, Form, Input, Select, Space, Tabs, Typography, message } from 'antd';
import { apiErrorMessage, authApi, saveSession } from '../api/client';
import type { UserProfile } from '../types';

interface Props {
  onAuthenticated: (user: UserProfile) => void;
}

export default function LoginPage({ onAuthenticated }: Props) {
  const [messageApi, contextHolder] = message.useMessage();

  const finishLogin = async (values: { username: string; password: string }) => {
    try {
      const auth = await authApi.login(values);
      saveSession(auth);
      onAuthenticated(auth.user);
      messageApi.success('Signed in');
    } catch (error) {
      messageApi.error(apiErrorMessage(error, 'Sign in failed'));
    }
  };

  const finishRegister = async (values: { username: string; email: string; password: string; role: string }) => {
    try {
      const auth = await authApi.register(values);
      saveSession(auth);
      onAuthenticated(auth.user);
      messageApi.success('Account created');
    } catch (error) {
      messageApi.error(apiErrorMessage(error, 'Account creation failed'));
    }
  };

  return (
    <div className="auth-page">
      {contextHolder}
      <Card className="auth-card">
        <Typography.Title level={3}>CommerceOps Access</Typography.Title>
        <Tabs
          items={[
            {
              key: 'login',
              label: 'Login',
              children: (
                <Form layout="vertical" onFinish={finishLogin}>
                  <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                    <Input.Password />
                  </Form.Item>
                  <Button htmlType="submit" type="primary" block>Login</Button>
                </Form>
              )
            },
            {
              key: 'register',
              label: 'Register',
              children: (
                <Form layout="vertical" onFinish={finishRegister} initialValues={{ role: 'CUSTOMER' }}>
                  <Form.Item name="username" label="Username" rules={[{ required: true, min: 3 }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
                    <Input.Password />
                  </Form.Item>
                  <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                    <Select options={[
                      { value: 'CUSTOMER', label: 'Customer' },
                      { value: 'MERCHANT', label: 'Merchant' },
                      { value: 'ADMIN', label: 'Admin' }
                    ]} />
                  </Form.Item>
                  <Space direction="vertical" className="full-width">
                    <Button htmlType="submit" type="primary" block>Create account</Button>
                  </Space>
                </Form>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
