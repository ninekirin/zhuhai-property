import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiBaseUrl } from '@/assets/js/config.js';
import {
  Col,
  Row,
  Space,
  Card,
  Image,
  Input,
  Button,
  Form,
  Descriptions,
  message,
  Divider,
  Typography,
  Grid,
} from 'antd';
import {
  HomeOutlined,
  AreaChartOutlined,
  BarsOutlined,
  FundViewOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';

const { Search } = Input;
const { Title } = Typography;

const PropertyAnalysis = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(true);

  const [PropertyAnalysisDict, setPropertyAnalysisDict] = useState({});

  const gridStyle = {
    width: '33.3%',
    textAlign: 'center',
  };

  const [searchText, setSearchText] = useState('');

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

  const fetchPropertyAnalysis = search => {
    fetch(apiBaseUrl + `/api/property/analysis` + (search ? `?keyword=${search}` : ''), {
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
          setPropertyAnalysisDict(data.analysis);
          setLoading(false);
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

  const mapPropertyAnalysisDict = Object.keys(PropertyAnalysisDict).map((key, index) => {
    return (
      <Col span={12}>
        <Card
          title={key}
          headStyle={{ fontSize: '28px', textAlign: 'Center' }}
          extra={
            <Space direction="horizontal" size="middle">
              <Link to={`/property/property-visualization?search=${key}`}>
                <Button type="primary" shape="round" icon={<FundViewOutlined />} size="large" />
              </Link>
              <Link to={`/property/property-list?search=${key}`}>
                <Button type="primary" shape="round" icon={<BarsOutlined />} size="large" />
              </Link>
              <a
                href={`https://ditu.amap.com/search?query=${key}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button type="primary" shape="round" icon={<EnvironmentOutlined />} size="large" />
              </a>
            </Space>
          }
          style={{
            width: '100%',
            height: '100%',
            textAlign: 'center',
          }}
        >
          <ReactMarkdown remarkPlugins={[gfm]}>{PropertyAnalysisDict[key]}</ReactMarkdown>
        </Card>
      </Col>
    );
  });

  useEffect(() => {
    isLogin();
    const urlParams = new URL(window.location.href);
    const search = urlParams?.searchParams?.get('search');
    console.log(search);
    if (search) {
      // 搜索框填充搜索关键词
      form.setFieldsValue({
        search: search,
      });
      setSearchText(search);
      fetchPropertyAnalysis(search);
    } else {
      fetchPropertyAnalysis();
    }
  }, []);

  // fetch pagination data
  useEffect(() => {
    const urlParams = new URL(window.location.href);
    if (searchText) {
      urlParams.searchParams.set('search', searchText);
    } else {
      urlParams.searchParams.delete('search');
    }
    history.pushState(null, '', urlParams.href);
  }, [searchText]);

  const onSearch = value => {
    // console.log(value);
    setSearchText(value);
    fetchPropertyAnalysis(value);
  };

  return (
    <>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card style={{ backgroundColor: '#f0f2f5' }}>
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            {/* 标题 */}
            <Title level={2} style={{ textAlign: 'center' }}>
              Search for Property
            </Title>
            <Form form={form} initialValues={{ remember: true }} style={{ width: '100%' }}>
              <Form.Item name="search" onChange={e => setSearchText(e.target.value)}>
                <Search
                  placeholder="Please input community name (Example: 翠湖)"
                  allowClear
                  enterButton="Search"
                  size="large"
                  onSearch={onSearch}
                />
              </Form.Item>
            </Form>
            <Card
              title="Quick Access (Use after search)"
              headStyle={{ fontSize: '20px', textAlign: 'Center' }}
            >
              <Card.Grid style={gridStyle}>
                <Space>
                  <FundViewOutlined />
                  Analysis Page (You are here)
                </Space>
              </Card.Grid>
              <Link
                to={`/property/property-visualization?${new URL(
                  window.location.href
                ).searchParams.toString()}`}
              >
                <Card.Grid style={gridStyle}>
                  <Space>
                    <AreaChartOutlined />
                    Visualization Page
                  </Space>
                </Card.Grid>
              </Link>
              <Link
                to={`/property/property-list?${new URL(
                  window.location.href
                ).searchParams.toString()}`}
              >
                <Card.Grid style={gridStyle}>
                  <Space>
                    <BarsOutlined />
                    List Page
                  </Space>
                </Card.Grid>
              </Link>
            </Card>
            <Card
              title="Properties Analysis"
              size="default"
              headStyle={{ fontSize: '20px', textAlign: 'Center' }}
              loading={loading}
            >
              <Row gutter={[16, 16]}> {mapPropertyAnalysisDict}</Row>
            </Card>
          </Space>
        </Card>
      </Space>
    </>
  );
};

export default PropertyAnalysis;
