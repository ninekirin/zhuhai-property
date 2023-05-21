import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Space, Popconfirm, Tooltip, Result, message } from 'antd';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import { apiBaseUrl } from '@/assets/js/config.js';
import { Link } from 'react-router-dom';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

const AnnouncementDetail = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [announcements, setAnnouncements] = useState([]);

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

  const getAnnouncements = () => {
    // console.log('Loading announcement...');
    fetch(apiBaseUrl + '/api/announcement/get/all', {
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
          setAnnouncements(data.announcements);
          // console.log('Announcement loaded.');
        } else {
          // console.log('Announcement load failed.');
        }
      })
      .catch(err => {
        // console.log(err);
        message.error(err);
      });
  };

  const mapAnnouncements = () => {
    if (announcements.length === 0) {
      return (
        <Card>
          <Result
            status="404"
            title="No announcement here."
            subTitle="Sorry, there is no announcement here."
            extra={[
              <Button key="create" type="primary">
                <Link to="/manage/announcement/create-announcement">Create One</Link>
              </Button>,
              <Button key="back">
                <Link to="/home">Back Home</Link>
              </Button>,
            ]}
          />
        </Card>
      );
    } else {
      return announcements.map(announcement => (
        <Card
          key={announcement.id}
          className={announcement.id}
          title={announcement.title}
          size="default"
          headStyle={{ fontSize: '20px' }}
          extra={
            <Space size="middle">
              <Tooltip title="Edit">
                <Link
                  to={{
                    pathname: `/manage/announcement/edit-announcement/${announcement.id}`,
                  }}
                >
                  <EditOutlined /> Edit
                </Link>
              </Tooltip>
              <Popconfirm
                title="Sure to delete?"
                onConfirm={() => deleteAnnouncement(announcement.id)}
              >
                <Tooltip title="Delete">
                  <Link>
                    <DeleteOutlined />
                    Delete
                  </Link>
                </Tooltip>
              </Popconfirm>
            </Space>
          }
        >
          <ReactMarkdown remarkPlugins={[gfm]}>{announcement.content}</ReactMarkdown>
        </Card>
      ));
    }
  };

  const deleteAnnouncement = id => {
    fetch(apiBaseUrl + '/api/manage/announcement/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        id: id,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // console.log(data.message);
          message.success(data.message);
          getAnnouncements();
        } else {
          // console.log(data.message);
          message.error(data.message);
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
    // getAnnouncement()
    getAnnouncements();
    // console.log('Announcement page loaded.');
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
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          {mapAnnouncements()}
        </Space>
      )}
    </>
  );
};

export default AnnouncementDetail;
