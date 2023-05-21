import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import 'antd/dist/antd.css';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { siteName, siteDescription, apiBaseUrl } from '@/assets/js/config.js';

const Login = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();

  // react state 从 register 页面获取注册成功的用户名
  const { username, callbackMsg } = location.state || '';
  // 使用 react state 传值到 login 页面，显示注册成功并自动填充用户名
  // 使用 useEffect 监听 username 变化，自动填充用户名
  useEffect(() => {
    if (username) {
      form.setFieldsValue({
        username,
      });
    }
  }, [username]);

  useEffect(() => {
    if (callbackMsg) {
      message.info(callbackMsg);
    }
  }, [callbackMsg]);

  const afterLogin = data => {
    if (data.success) {
      // // account_status !== 'activated' 时，不允许登录
      // if (data.user.account_status !== 'activated') {
      //   // console.log(data.message);
      //   message.info(data.message);
      //   window.localStorage.clear();
      //   return;
      // }
      // 不需要登录，自动转到 /home
      // console.log(data.message);
      message.info(data.message);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_id', data.user.user_id);
      localStorage.setItem('username', data.user.username);
      if (data.user.account_type === 'admin') {
        localStorage.setItem('account_type', 'admin');
      }
      // navigate to /home
      window.location.href = '/home';
    } else {
      // 需要登录，不做任何操作
      // console.log(data.message);
      message.info(data.message);
      window.localStorage.clear();
    }
  };

  const isLogin = () => {
    // 判断 token 是否存在
    if (!token) {
      // 不需要登录，不做任何操作
      // console.log('Token does not exist.');
      window.localStorage.clear();
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
          // // console.log(data);
          afterLogin(data);
        })
        .catch(err => {
          // console.log(err);
          message.error(err);
          window.localStorage.clear();
        });
    }
  };

  useEffect(() => {
    // 判断是否需要登录(特化版)
    isLogin();
    // console.log('Login page loaded.');
  }, []);

  // onFinish 事件
  const onFinish = values => {
    // console.log('Received values of form: ', values);
    // Login
    // api: apiBaseUrl + '/api/users/login'
    // method: POST
    // body: {username, password}
    // response: {success, token, user[user_id, username], message}
    // navigate to /home
    fetch(apiBaseUrl + '/api/users/login', {
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
        afterLogin(data);
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
            <span className="title-span">{siteName}</span>
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
        <Form form={form} name="normal_login" className="login-form" onFinish={onFinish}>
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

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
              style={{ width: '100%' }}
              size="large"
            >
              Login
            </Button>
          </Form.Item>
        </Form>
        <Link
          to="/register"
          style={{
            display: 'flex',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 1)',
            fontSize: '18px',
          }}
        >
          Have no account? Register now!
        </Link>
      </div>
      <div className="footer">
        <div className="footer-top" style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: '8px' }} />
        <div className="site-desc">{siteDescription}</div>
      </div>
    </div>
  );
};

export default Login;
