import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiBaseUrl } from '@/assets/js/config.js';
import {
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
import { EyeOutlined, AreaChartOutlined, BarsOutlined, FundViewOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Title } = Typography;

const PropertyVisualization = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const gridStyle = {
    width: '33.3%',
    textAlign: 'center',
  };

  const [searchText, setSearchText] = useState('');

  // const [transaction_price_distribution, setTransactionPriceDistribution] = useState('');
  // const [area_vs_transaction_price, setAreaVsTransactionPrice] = useState('');
  // const [unit_price_distribution, setUnitPriceDistribution] = useState('');
  // const [transaction_cycle_distribution, setTransactionCycleDistribution] = useState('');

  const [PropertyVisualizationImage, setPropertyVisualizationImage] = useState({
    room_layout_distribution: '',
    average_price_by_month: '',
    transaction_price_distribution: '',
    area_vs_transaction_price: '',
    unit_price_distribution: '',
    transaction_cycle_distribution: '',
  });

  const fetchPropertyVisualization = value => {
    const apiList = [
      'room_layout_distribution',
      'average_price_by_month',
      'transaction_price_distribution',
      'area_vs_transaction_price',
      'unit_price_distribution',
      'transaction_cycle_distribution',
    ];
    // fetch property visualization data each by each
    apiList.forEach(api => {
      const txt = value ? '?search=' + value : '';
      fetch(apiBaseUrl + '/api/property/visualization/' + api + txt, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPropertyVisualizationImage(prevState => ({
              ...prevState,
              [api]: data.image,
            }));
          } else {
            // console.log(data.message);
            message.error(data.message);
          }
        })
        .catch(err => {
          message.error(err);
        });
    });
  };

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
      fetchPropertyVisualization(search);
    } else {
      fetchPropertyVisualization();
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
    fetchPropertyVisualization(value);
  };

  return (
    <>
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
            <Link
              to={`/property/property-analysis?${new URL(
                window.location.href
              ).searchParams.toString()}`}
            >
              <Card.Grid style={gridStyle}>
                <Space>
                  <FundViewOutlined />
                  Analysis Page
                </Space>
              </Card.Grid>
            </Link>
            <Card.Grid style={gridStyle}>
              <Space>
                <AreaChartOutlined />
                Visualization Page (You are here)
              </Space>
            </Card.Grid>
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
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Space direction="horizontal" size="middle" style={{ display: 'flex' }}>
              <Card title="Room Layout Distribution" headStyle={{ fontSize: '16px' }}>
                {/* <Image src={apiBaseUrl + '/api/property/visualization/room_layout_distribution'} /> */}
                {PropertyVisualizationImage.room_layout_distribution ? (
                  <Image src={PropertyVisualizationImage.room_layout_distribution} />
                ) : (
                  'Loading image... (If it takes too long, maybe the image is not available.)'
                )}
              </Card>
              <Card title="Average Price by Month" headStyle={{ fontSize: '16px' }}>
                {/* <Image src={apiBaseUrl + '/api/property/visualization/average_price_by_month'} /> */}
                {PropertyVisualizationImage.average_price_by_month ? (
                  <Image src={PropertyVisualizationImage.average_price_by_month} />
                ) : (
                  'Loading image... (If it takes too long, maybe the image is not available.)'
                )}
              </Card>
            </Space>
            <Space direction="horizontal" size="middle" style={{ display: 'flex' }}>
              <Card title="Transaction Price Distribution" headStyle={{ fontSize: '16px' }}>
                {/* <Image src={apiBaseUrl + '/api/property/visualization/transaction_price_distribution' + '?search=' + searchText} /> */}
                {PropertyVisualizationImage.transaction_price_distribution ? (
                  <Image src={PropertyVisualizationImage.transaction_price_distribution} />
                ) : (
                  'Loading image... (If it takes too long, maybe the image is not available.)'
                )}
              </Card>
              <Card title="Built Area vs Transaction Price" headStyle={{ fontSize: '16px' }}>
                {/* <Image src={apiBaseUrl + '/api/property/visualization/area_vs_transaction_price'} /> */}
                {PropertyVisualizationImage.area_vs_transaction_price ? (
                  <Image src={PropertyVisualizationImage.area_vs_transaction_price} />
                ) : (
                  'Loading image... (If it takes too long, maybe the image is not available.)'
                )}
              </Card>
            </Space>
            <Space direction="horizontal" size="middle" style={{ display: 'flex' }}>
              <Card title="Unit Price Distribution" headStyle={{ fontSize: '16px' }}>
                {/* <Image src={apiBaseUrl + '/api/property/visualization/unit_price_distribution'} /> */}
                {PropertyVisualizationImage.unit_price_distribution ? (
                  <Image src={PropertyVisualizationImage.unit_price_distribution} />
                ) : (
                  'Loading image... (If it takes too long, maybe the image is not available.)'
                )}
              </Card>
              <Card title="Transaction Cycle Distribution" headStyle={{ fontSize: '16px' }}>
                {/* <Image src={apiBaseUrl + '/api/property/visualization/transaction_cycle_distribution'} /> */}
                {PropertyVisualizationImage.transaction_cycle_distribution ? (
                  <Image src={PropertyVisualizationImage.transaction_cycle_distribution} />
                ) : (
                  'Loading image... (If it takes too long, maybe the image is not available.)'
                )}
              </Card>
            </Space>
          </Space>
        </Space>
      </Card>
    </>
  );
};

export default PropertyVisualization;
