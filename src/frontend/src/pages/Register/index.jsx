import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './index.css';
import 'antd/dist/antd.css';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, SecurityScanOutlined } from '@ant-design/icons';
import { siteDescription, apiBaseUrl } from '@/assets/js/config.js';

const Register = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const onFinish = values => {
    // console.log('Received values of form: ', values);
    // Register
    // api: apiBaseUrl + '/api/users/register'
    // method: POST
    // body: {username, password}
    // response: {success, user[user_id, username], message}
    // navigate to /login
    fetch(apiBaseUrl + '/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: values.username,
        password: values.password,
      }),
    })
      .then(res => res.json())
      .then(data => {
        // // console.log(data);
        if (data.success) {
          // console.log(data.message);
          message.info(data.message);
          // react state 传值到 login 页面，显示注册成功并自动填充用户名
          const payload = {
            username: values.username,
            // callbackMsg: 'Register success, please login.',
          };
          // navigate to /login
          navigate('/login', { state: payload });
        } else {
          // console.log(data.message);
          message.info(data.message);
        }
      })
      .catch(err => {
        // console.log(err);
        message.info(err);
      });
  };
  return (
    <div className="app">
      <div
        style={{
          width: '100%',
          height: '40px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      />
      <div
        style={{
          flex: '1',
          height: '100%',
          margin: '0 auto',
          width: '328px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              paddingTop: '20px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <span className="title-span">Register</span>
          </div>
          <div
            style={{
              margin: '20px 0px 40px 0px',
              color: 'rgba(0, 0, 0, 0.45)',
            }}
          >
            {siteDescription}
          </div>
        </div>
        <Form
          name="normal_register"
          className="register-form"
          initialValues={{
            remember: true,
          }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'You must enter your username!',
              },
            ]}
          >
            <Input
              allowClear
              size="large"
              prefix={<UserOutlined className="site-form-item-icon" style={{ color: '#1890ff' }} />}
              placeholder="Username"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'You must input your Password!',
              },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined className="site-form-item-icon" style={{ color: '#1890ff' }} />}
              type="password"
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item
            name="confirm"
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
                  if (!value || getFieldValue('password') === value) {
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
              prefix={
                <SecurityScanOutlined
                  className="site-form-item-icon"
                  style={{ color: '#1890ff' }}
                />
              }
              type="password"
              placeholder="Confirm Password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="register-form-button"
              style={{ width: '100%' }}
              size="large"
            >
              Register
            </Button>
          </Form.Item>
        </Form>
        <Link
          to="/login"
          style={{
            display: 'flex',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 1)',
            fontSize: '18px',
          }}
        >
          Already have an account? Login
        </Link>
      </div>
      <div className="footer">
        <div className="footer-top" style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: '8px' }}>
          <div className="site-desc">{siteDescription}</div>
        </div>
      </div>
    </div>
  );
};

export default Register;
