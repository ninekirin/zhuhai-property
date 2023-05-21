import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Space, Card, Divider, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { apiBaseUrl } from '@/assets/js/config.js';

const ChangePassword = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const isLogin = () => {
    if (!token) {
      navigate('/login');
    } else {
      // 判断 token 有效性
      fetch(apiBaseUrl + '/api/users/keepalive', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        // body: JSON.stringify({}),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // console.log(data.message);
            localStorage.setItem('token', data.token);
          } else {
            // console.log(data.message);
            window.localStorage.clear();
            const payload = {
              callbackMsg: 'Login expired. Please re-login.',
            };
            navigate('/login', { state: payload });
          }
        })
        .catch(err => {
          // console.log(err);
          message.error(err);
          window.localStorage.clear();
          const payload = {
            callbackMsg: err,
          };
          navigate('/login', { state: payload });
        });
    }
  };

  useEffect(() => {
    // 判断是否登录
    isLogin();
    // console.log('ChangePassword page loaded.');
  }, []);
  const [form] = Form.useForm();
  const onFinish = values => {
    // console.log('Received values of form: ', values);
    fetch(apiBaseUrl + '/api/users/edit/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      // convert Object to JSON string
      body: JSON.stringify({
        old_password: values.old_password,
        new_password: values.new_password,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // console.log(data.message);
          message.info(data.message);
        } else {
          // console.log(data.message);
          message.info(data.message);
        }
      })
      .catch(err => {
        // console.log(err);
        message.error(err);
      });
  };
  return (
    <>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card title="Change Password" size="default" headStyle={{ fontSize: '20px' }}>
          <p>
            Please informed: Password must be at least 8 characters long and contain at least one
            number and one letter.
          </p>
          <Divider />
          <Form form={form} name="Change Password" onFinish={onFinish} scrollToFirstError>
            <Form.Item
              name="old_password"
              prefix={<LockOutlined className="site-form-item-icon" style={{ color: '#1890ff' }} />}
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: 'Please input your old password!',
                },
              ]}
              hasFeedback
            >
              <Input.Password
                size="large"
                type="password"
                prefix={<LockOutlined style={{ color: '#1890ff' }} />}
                placeholder="Enter your old password"
              />
            </Form.Item>
            <Form.Item
              name="new_password"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: 'Please input your new password!',
                },
              ]}
              hasFeedback
            >
              <Input.Password
                size="large"
                type="password"
                prefix={<LockOutlined style={{ color: '#1890ff' }} />}
                placeholder="Enter your new password"
              />
            </Form.Item>
            <Form.Item
              name="new_password_confirm"
              dependencies={['password']}
              hasFeedback
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: 'Please confirm your password!',
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('The two passwords that you entered do not match!')
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                size="large"
                type="password"
                prefix={<LockOutlined style={{ color: '#1890ff' }} />}
                placeholder="Confirm password"
              />
            </Form.Item>
            <Form.Item style={{ textAlign: 'right' }}>
              <Button type="primary" htmlType="submit">
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </>
  );
};
export default ChangePassword;
