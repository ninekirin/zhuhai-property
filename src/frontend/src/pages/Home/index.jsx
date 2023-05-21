import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Space, Result, Tooltip, Popconfirm, Input, Typography, message } from 'antd';
import {
  UnorderedListOutlined,
  ProfileOutlined,
  UserOutlined,
  EditOutlined,
  SecurityScanOutlined,
  NotificationOutlined,
  TeamOutlined,
  BarsOutlined,
  AuditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import gfm from 'remark-gfm';
import { siteName, siteDescription, apiBaseUrl } from '@/assets/js/config.js';

const { Search } = Input;
const { Title } = Typography;

const gridStyle = {
  width: '25%',
  textAlign: 'center',
};

const Home = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

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
          />
        </Card>
      );
    } else {
      // is admin?
      const isAdmin = user_info.account_type === 'admin';
      if (isAdmin) {
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
      } else {
        return announcements.map(announcement => (
          <Card
            key={announcement.id}
            className={announcement.id}
            title={announcement.title}
            size="default"
            headStyle={{ fontSize: '20px' }}
          >
            <ReactMarkdown remarkPlugins={[gfm]}>{announcement.content}</ReactMarkdown>
          </Card>
        ));
      }
    }
  };

  const deleteAnnouncement = unique_id => {
    fetch(apiBaseUrl + '/api/manage/announcement/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        unique_id: unique_id,
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

  const getUserInfo = () => {
    // console.log('Loading user info...');
    if (!token) {
      // console.log('User info load failed: no token');
    } else {
      // 将数据存储到info中
      fetch(apiBaseUrl + '/api/users/get/info', {
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
            setUserInfo(data.info.user_info);
            // console.log('User info loaded.');
          } else {
            // console.log('User info load failed.');
          }
        })
        .catch(err => {
          // console.log(err);
        });
    }
  };

  const onSearch = value => {
    if (value !== '') {
      navigate(`/property/property-analysis?search=${value}`);
    }
  };

  useEffect(() => {
    // 判断是否登录
    isLogin();
    // getUserInfo
    getUserInfo();
    // getHelperInfo
    getAnnouncements();
    // console.log('Home page loaded.');
  }, []);

  return (
    <>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card title="Dashboard" size="default" headStyle={{ fontSize: '20px' }}>
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Card style={{ backgroundColor: '#f0f2f5' }}>
              <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                <Title level={2} style={{ textAlign: 'center' }}>
                  Zhuhai Property Pulse
                </Title>
                <Title level={4} style={{ textAlign: 'center' }}>
                  Welcome to Zhuhai Property Pulse, a property management system for Zhuhai.
                </Title>
                <Search
                  placeholder="Please input community name (Example: 翠湖)"
                  allowClear
                  enterButton="Search"
                  size="large"
                  onSearch={onSearch}
                />
                {/* 热门搜索：翠湖香山、云顶澜山、海怡湾畔、格力海岸 */}
                {/* 文字居中 */}
                <Title level={5} style={{ textAlign: 'center', color: 'gray' }}>
                  Hot Search:
                  <Link to="/property/property-analysis?search=翠湖香山"> 翠湖香山</Link>
                  <Link to="/property/property-analysis?search=云顶澜山"> 云顶澜山</Link>
                  <Link to="/property/property-analysis?search=海怡湾畔"> 海怡湾畔</Link>
                  <Link to="/property/property-analysis?search=格力海岸"> 格力海岸</Link>
                </Title>
              </Space>
            </Card>
          </Space>
        </Card>
        <Card title="Real Estate News" size="default" headStyle={{ fontSize: '20px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {mapAnnouncements()}
          </Space>
        </Card>
      </Space>
    </>
  );
};

export default Home;
