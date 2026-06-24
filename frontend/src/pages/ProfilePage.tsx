import { SaveOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Typography, message } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiErrorMessage, authApi } from '../api/client';
import type { UpdateProfileRequest, UserProfile } from '../types';

interface Props {
  user: UserProfile;
  onProfileUpdated: (user: UserProfile) => void;
}

export default function ProfilePage({ user, onProfileUpdated }: Props) {
  const [form] = Form.useForm<UpdateProfileRequest>();
  const [messageApi, contextHolder] = message.useMessage();

  const profileQuery = useQuery({
    queryKey: ['profile', user.id],
    queryFn: authApi.me,
    initialData: user
  });

  useEffect(() => {
    form.setFieldsValue(profileQuery.data);
  }, [form, profileQuery.data]);

  const updateProfile = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updatedUser) => {
      onProfileUpdated(updatedUser);
      form.setFieldsValue(updatedUser);
      messageApi.success('Profile updated');
    },
    onError: (error) => messageApi.error(apiErrorMessage(error, 'Profile update failed'))
  });

  return (
    <Space direction="vertical" size="large" className="page">
      {contextHolder}
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>Profile</Typography.Title>
          <Typography.Text type="secondary">
            {user.role === 'MERCHANT' ? 'Manage your public store profile and contact details.' : 'Manage account, delivery address, and payment preference.'}
          </Typography.Text>
        </div>
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={(values) => updateProfile.mutate(values)}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="username" label="Account name" rules={[{ required: true, min: 3, max: 80 }]}>
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Email">
                <Input value={profileQuery.data.email} disabled />
              </Form.Item>
            </Col>
            {user.role === 'CUSTOMER' && (
              <>
                <Col xs={24}>
                  <Typography.Title level={4}>Customer Profile</Typography.Title>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="gender" label="Gender">
                    <Select
                      allowClear
                      options={[
                        { value: 'Female', label: 'Female' },
                        { value: 'Male', label: 'Male' },
                        { value: 'Non-binary', label: 'Non-binary' },
                        { value: 'Prefer not to say', label: 'Prefer not to say' }
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={4}>
                  <Form.Item name="heightCm" label="Height (cm)" rules={[{ type: 'number', min: 50, max: 260 }]}>
                    <InputNumber min={50} max={260} className="full-width" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={4}>
                  <Form.Item name="weightKg" label="Weight (kg)" rules={[{ type: 'number', min: 20, max: 350 }]}>
                    <InputNumber min={20} max={350} className="full-width" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={4}>
                  <Form.Item name="shoeSize" label="Shoe size" rules={[{ type: 'number', min: 1 }]}>
                    <InputNumber min={1} step={0.5} precision={1} className="full-width" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="shippingAddress" label="Shipping address" rules={[{ max: 500 }]}>
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="phoneNumber" label="Phone number" rules={[{ max: 40 }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="paymentMethod" label="Payment method" rules={[{ max: 120 }]}>
                    <Input placeholder="e.g. Card, PayNow, cash on delivery" />
                  </Form.Item>
                </Col>
              </>
            )}
            {user.role === 'MERCHANT' && (
              <>
                <Col xs={24}>
                  <Typography.Title level={4}>Merchant Profile</Typography.Title>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="merchantName" label="Merchant name" rules={[{ required: true, max: 160 }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="merchantContact" label="Merchant contact" rules={[{ max: 160 }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="merchantDescription" label="Merchant description" rules={[{ max: 800 }]}>
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="merchantAddress" label="Merchant address" rules={[{ max: 300 }]}>
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateProfile.isPending}>
            Save profile
          </Button>
        </Form>
      </Card>
    </Space>
  );
}
