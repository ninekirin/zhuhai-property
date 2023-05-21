import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import { apiBaseUrl } from '@/assets/js/config.js';
import { Space, Card, Form, Input, Button, Result, message } from 'antd';

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [form] = Form.useForm();

  const [announcement, setAnnouncement] = useState({
    title: '',
    content: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const onChangeTitle = e => {
    setAnnouncement({
      ...announcement,
      title: e.target.value,
    });
  };

  const onChangeContent = e => {
    setAnnouncement({
      ...announcement,
      content: e.target.value,
    });
  };

  const onFinish = values => {
    // console.log('Received values of form: ', values);
    fetch(apiBaseUrl + '/api/manage/announcement/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      // convert Object to JSON string
      body: JSON.stringify(values),
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
    // console.log('CreateAnnouncement page loaded.');
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
          title="Successfully Created a New Announcement!"
          subTitle="Please check the announcement list."
          extra={[
            <Button type="primary" key="home" onClick={() => navigate('/manage/announcement/announcement-detail')}>
              View Announcements
            </Button>,
            <Button key="buy" onClick={() => setIsSubmitted(false)}>
              Go Back
            </Button>,
          ]}
        />
      ) : (
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <Card title="Create Announcement" size="default" headStyle={{ fontSize: '20px' }}>
            <Form form={form} name="create_announcement" onFinish={onFinish}>
              <Form.Item
                name="title"
                rules={[{ required: true, message: 'Please input announcement title!' }]}
              >
                <Input placeholder="Announcement Title" onChange={onChangeTitle} />
              </Form.Item>
              <Form.Item name="content">
                <Input.TextArea
                  showCount
                  maxLength={65535}
                  style={{ height: '200px' }}
                  placeholder="Announcement Content (Markdown supported)"
                  onChange={onChangeContent}
                  rules={[{ required: true, message: 'Please input announcement content!' }]}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Create Announcement
                </Button>
              </Form.Item>
            </Form>
          </Card>
          <Card title={announcement.title} size="default" headStyle={{ fontSize: '20px' }}>
            <ReactMarkdown remarkPlugins={[gfm]}>{announcement.content}</ReactMarkdown>
          </Card>
        </Space>
      )}
    </>
  );
};

export default CreateAnnouncement;
