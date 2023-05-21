import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Space, Card, Form, Divider, Typography, Input, Tooltip, message } from 'antd';
import { Link } from 'react-router-dom';
import {
  EyeOutlined,
  AreaChartOutlined,
  BarsOutlined,
  FundViewOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { apiBaseUrl } from '@/assets/js/config.js';
const { Search } = Input;
const { Title } = Typography;

const PropertyList = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [properties, setProperties] = useState();
  const [loading, setLoading] = useState(true);

  const gridStyle = {
    width: '33.3%',
    textAlign: 'center',
  };

  const [searchText, setSearchText] = useState('');

  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left',
      // sorter: true,
    },
    {
      title: 'Community Name',
      dataIndex: 'community_name',
    },
    {
      title: 'Full Address',
      children: [
        {
          title: 'City',
          dataIndex: 'city',
          width: 80,
        },
        {
          title: 'District',
          dataIndex: 'district',
          width: 100,
        },
        {
          title: 'Street',
          dataIndex: 'street',
          width: 100,
        },
        {
          title: 'Address',
          dataIndex: 'address',
        },
      ],
    },
    {
      title: 'Transaction Information',
      children: [
        {
          title: 'Transaction Price',
          dataIndex: 'transaction_price',
        },
        {
          title: 'Unit Price',
          dataIndex: 'unit_price',
        },
        {
          title: 'Transaction Time',
          dataIndex: 'transaction_time',
        },
        {
          title: 'Transaction Cycle',
          dataIndex: 'transaction_cycle',
        },
        {
          title: 'Price Adjustment',
          dataIndex: 'price_adjustment',
        },
      ],
    },
    {
      title: 'Property Information',
      children: [
        {
          title: 'Layout Diagram Link',
          dataIndex: 'layout_diagram_link',
          render: link => (
            <a href={link} target="_blank" rel="noreferrer">
              View
            </a>
          ),
        },
        {
          title: 'Room Layout',
          dataIndex: 'room_layout',
        },
        {
          title: 'Floor',
          dataIndex: 'floor',
        },
        {
          title: 'Built Area',
          dataIndex: 'built_area',
        },
        {
          title: 'Layout Structure',
          dataIndex: 'layout_structure',
        },
        {
          title: 'Internal Area',
          dataIndex: 'internal_area',
        },
        {
          title: 'Building Type',
          dataIndex: 'building_type',
        },
        {
          title: 'Orientation',
          dataIndex: 'orientation',
        },
        {
          title: 'Decoration',
          dataIndex: 'decoration',
        },
        {
          title: 'Building Structure',
          dataIndex: 'building_structure',
        },
        {
          title: 'Elevator Ratio',
          dataIndex: 'elevator_ratio',
        },
        {
          title: 'Equipped Elevator',
          dataIndex: 'equipped_elevator',
        },
        {
          title: 'Listing Time',
          dataIndex: 'listing_time',
        },
        {
          title: 'Follows',
          dataIndex: 'follows',
        },
        {
          title: 'Views',
          dataIndex: 'views',
        },
        {
          title: 'Transaction Ownership',
          dataIndex: 'transaction_ownership',
        },
        {
          title: 'Property Use',
          dataIndex: 'property_use',
        },
        {
          title: 'Property Age',
          dataIndex: 'property_age',
        },
        {
          title: 'Property Ownership',
          dataIndex: 'property_ownership',
        },
      ],
    },
    {
      title: 'Community Information',
      children: [
        {
          title: 'Developer',
          dataIndex: 'developer',
        },
        {
          title: 'Property Management Company',
          dataIndex: 'property_management_company',
        },
        {
          title: 'Property Fees',
          dataIndex: 'property_fees',
        },
        {
          title: 'Plot Ratio',
          dataIndex: 'plot_ratio',
        },
        {
          title: 'Total Building',
          dataIndex: 'total_building',
        },
        {
          title: 'Total Units',
          dataIndex: 'total_units',
        },
        {
          title: 'Fixed Parking Spaces',
          dataIndex: 'fixed_parking_spaces',
        },
        {
          title: 'Community Average Price',
          dataIndex: 'community_average_price',
        },
        {
          title: 'Community On Sale',
          dataIndex: 'community_on_sale',
        },
        {
          title: 'Community On Rent',
          dataIndex: 'community_on_rent',
        },
      ],
    },
    {
      title: 'Property Link',
      dataIndex: 'property_link',
      render: link => (
        <a href={link} target="_blank" rel="noreferrer">
          View
        </a>
      ),
    },
    {
      title: 'Longitude',
      dataIndex: 'longitude',
    },
    {
      title: 'Latitude',
      dataIndex: 'latitude',
    },
    {
      title: 'Action',
      key: 'operation',
      fixed: 'right',
      width: 80,
      render: (text, record) => (
        <Space>
          <Tooltip title="View Detail">
            <Link
              to={`/property/property-detail/${record.id}?${new URL(
                window.location.href
              ).searchParams.toString()}`}
            >
              <EyeOutlined />
            </Link>
          </Tooltip>
          <Tooltip title="View Map">
            <a
              href={`https://ditu.amap.com/search?query=${record.community_name} ${record.address}&center=${record.longitude},${record.latitude}`}
              target="_blank"
              rel="noreferrer"
            >
              <EnvironmentOutlined />
            </a>
          </Tooltip>
        </Space>
      ),
    },
  ];

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

  const onSearch = value => {
    // console.log(value);
    fetchPartData(value, tableParams.pagination?.current, tableParams.pagination?.pageSize);
    setSearchText(value);
  };

  const fetchPartData = (value, current = 1, pageSize = 10) => {
    setLoading(true);
    // fetch pagination data
    fetch(
      apiBaseUrl +
        `/api/property/search?current=${current}&pageSize=${pageSize}` +
        (value ? `&keyword=${value}` : ''),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      }
    )
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProperties(data.properties);
          // 如果数据总量发生变化，回到第一页
          if (
            data.info?.total !== tableParams.pagination?.total &&
            tableParams.pagination?.total !== 0
          ) {
            message.info('数据总量发生变化，回到第一页');
            setTableParams({
              ...tableParams,
              pagination: {
                ...tableParams.pagination,
                current: 1,
                total: data.info?.total,
              },
            });
          } else {
            setTableParams({
              pagination: {
                current: data.info?.current,
                pageSize: data.info?.pageSize,
                total: data.info?.total,
              },
            });
          }
          setLoading(false);
        } else {
          // console.log(data.message);
        }
      });
  };

  useEffect(() => {
    // 判断是否登录
    isLogin();
    // console.log('Property page loaded.');
    const urlParams = new URL(window.location.href);
    const search = urlParams?.searchParams?.get('search');
    const current = urlParams?.searchParams?.get('current');
    const pageSize = urlParams?.searchParams?.get('pageSize');
    console.log(search);
    if (search) {
      // 搜索框填充搜索关键词
      form.setFieldsValue({
        search: search,
      });
      setSearchText(search);
    }
    fetchPartData(search, current, pageSize);
  }, []);

  useEffect(() => {
    const urlParams = new URL(window.location.href);
    if (searchText) {
      urlParams.searchParams.set('search', searchText);
      history.pushState(null, '', urlParams.href);
    }
  }, [searchText]);

  // fetch pagination data
  useEffect(() => {
    if (!loading) {
      fetchPartData(searchText, tableParams.pagination?.current, tableParams.pagination?.pageSize);
    }
    const urlParams = new URL(window.location.href);
    urlParams.searchParams.set('current', tableParams.pagination?.current);
    urlParams.searchParams.set('pageSize', tableParams.pagination?.pageSize);
    history.pushState(null, '', urlParams.href);
  }, [JSON.stringify(tableParams.pagination)]);

  const handleTableChange = pagination => {
    //, filters, sorter) => {
    setTableParams({
      ...tableParams,
      pagination: {
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
      },
    });
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
            <Card.Grid style={gridStyle}>
              <Space>
                <BarsOutlined />
                List Page (You are here)
              </Space>
            </Card.Grid>
          </Card>

          <Card
            title="Properties List"
            size="default"
            headStyle={{ fontSize: '20px', textAlign: 'Center' }}
          >
            <p style={{ textAlign: 'center' }}>
              Showing {tableParams.pagination?.current} to {tableParams.pagination?.pageSize} of{' '}
              {tableParams.pagination?.total} entries
            </p>
            <Table
              columns={columns}
              dataSource={properties}
              rowKey={record => record.id}
              pagination={tableParams.pagination}
              loading={loading}
              onChange={handleTableChange}
              fixedHeader={true}
              scroll={{ x: 6000 }}
              bordered
            />
          </Card>
        </Space>
      </Card>
    </>
  );
};
export default PropertyList;
