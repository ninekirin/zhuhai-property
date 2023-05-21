import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiBaseUrl } from '@/assets/js/config.js';
import { Space, Card, Form, Input, Button, Result, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const UserPassword = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [form] = Form.useForm();

  const [user_info, setUserInfo] = useState({
    user_id: '',
    username: '',
    last_online: '',
    created_at: '',
    email: '',
    account_type: '',
    account_status: '',
    jwt_auth_active: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const { user_id } = useParams();

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

  const getUser = () => {
    fetch(apiBaseUrl + `/api/manage/users/get/basic?user_id=${user_id}`, {
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
          setUserInfo(data.user);
        } else {
          navigate('/404');
        }
      })
      .catch(err => {
        // console.log(err);
        message.error(err);
        navigate('/404');
      });
  };

  const onFinish = values => {
    // console.log('Received values of form: ', values);
    fetch(apiBaseUrl + '/api/manage/users/edit/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      // convert Object to JSON string
      body: JSON.stringify({
        user_id: parseInt(user_id),
        new_password: values.new_password,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // console.log(data.message);
          setIsSubmitted(true);
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

  useEffect(() => {
    // 判断是否登录
    isLogin();
    // const urlParams = new URL(window.location.href);
    // const pathname = urlParams?.pathname;
    // console.log('pathname:', pathname);
    getUser();
    // console.log('UserPassword page loaded.');
  }, []);

  return (
    <>
      {localStorage.getItem('account_type') !== 'admin' ? (
        <Result
          status="404"
          title="404"
          subTitle="Sorry, the page you visited does not exist."
          extra={
            <Button type="primary">
              <Link to="/home">Back Home</Link>
            </Button>
          }
        />
      ) : isSubmitted ? (
        <Result
          status="success"
          title="Successfully Reset User Password"
          subTitle="Please notify the user to use the new password to login and change the password immediately."
          extra={[
            <Button type="primary" key="home" onClick={() => navigate('/home')}>
              Go Home
            </Button>,
            <Button key="buy" onClick={() => setIsSubmitted(false)}>
              Go Back
            </Button>,
          ]}
        />
      ) : (
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <Card title="Basic User Information" size="default" headStyle={{ fontSize: '20px' }}>
            <p>
              Username: <b>{user_info.username}</b>
            </p>
            <p>
              Account Type: <b>{user_info.account_type}</b>.
            </p>
            <p>
              Account Status: <b>{user_info.account_status}</b>.
            </p>
            <p>
              Last Online: <b>{user_info.last_online}</b>
            </p>
          </Card>
          <Card title="Reset User Password" size="default" headStyle={{ fontSize: '20px' }}>
            <Form form={form} name="reset_user_password" onFinish={onFinish}>
              <Form.Item
                name="new_password"
                rules={[{ required: true, message: 'Please input the new password!' }]}
              >
                <Input.Password
                  size="large"
                  type="password"
                  prefix={<LockOutlined style={{ color: '#1890ff' }} />}
                  placeholder="Enter user's new password"
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Reset User Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Space>
      )}
    </>
  );
};

export default UserPassword;
