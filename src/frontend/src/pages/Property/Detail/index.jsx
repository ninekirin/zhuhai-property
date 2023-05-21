import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiBaseUrl } from '@/assets/js/config.js';
import { Space, Card, Image, Input, Button, Descriptions, message, Divider } from 'antd';
const { Search } = Input;
import { RollbackOutlined, ClearOutlined, AreaChartOutlined } from '@ant-design/icons';

const PropertyDetail = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [image, setImage] = useState('');

  const [property, setProperty] = useState({
    address: '',
    building_structure: '',
    building_type: '',
    built_area: '',
    city: '',
    community_average_price: '',
    community_name: '',
    community_on_rent: '',
    community_on_sale: '',
    decoration: '',
    developer: '',
    district: '',
    elevator_ratio: '',
    equipped_elevator: '',
    fixed_parking_spaces: '',
    floor: '',
    follows: '',
    id: '',
    internal_area: '',
    latitude: '',
    layout_diagram_link: '',
    layout_structure: '',
    listing_time: '',
    longitude: '',
    orientation: '',
    plot_ratio: '',
    price_adjustment: '',
    property_age: '',
    property_fees: '',
    property_link: '',
    property_management_company: '',
    property_ownership: '',
    property_use: '',
    room_layout: '',
    street: '',
    total_building: '',
    total_units: '',
    transaction_cycle: '',
    transaction_ownership: '',
    transaction_price: '',
    transaction_time: '',
    unit_price: '',
    views: '',
  });

  const { id } = useParams();

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

  const getProperty = () => {
    // console.log('Loading property...');
    fetch(apiBaseUrl + `/api/property/get?id=${id}`, {
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
          setProperty(data.property);
          if (data.property.layout_diagram_link) {
            fetch(apiBaseUrl + '/api/property/getimg?url=' + data.property.layout_diagram_link, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
              },
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  // console.log('Image loaded.');
                  setImage(data.image);
                } else {
                  // console.log(data.message);
                }
              })
              .catch(err => {
                message.error(err);
              });
          }
          // console.log('Property loaded.');
        } else {
          // console.log('Property load failed.');
          // navigate('/404');
        }
      })
      .catch(err => {
        // console.log(err);
        message.error(err);
        // navigate('/404');
      });
  };

  useEffect(() => {
    // 判断是否登录
    isLogin();
    // const urlParams = new URL(window.location.href);
    // const pathname = urlParams?.pathname;
    // console.log('pathname:', pathname);
    getProperty();
    // console.log('PropertyDetail page loaded.');
  }, []);

  useEffect(() => {
    // console.log('Property changed.');
    // React 重新渲染页面
  }, [property]);

  useEffect(() => {
    // console.log('Image changed.');
    // console.log('image:', image);
  }, [image]);

  const onSearch = value => {
    // console.log(value);
    // console.log('Navigating to property...');
    // navigate(`/property/property-detail/${value}`);
    if (value !== '') {
      window.location.href = `/property/property-detail/${value}`;
    }
  };

  if (property?.id === '') {
    return (
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card title="Property Detail" headStyle={{ fontSize: '20px' }}>
          You have not selected any property. So you can jump to a property by its id.
          <Divider />
          <Search
            placeholder="Enter property id"
            allowClear
            enterButton="Navigate to Property"
            size="large"
            onSearch={onSearch}
          />
        </Card>
      </Space>
    );
  }

  return (
    <>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card title="Property Detail" headStyle={{ fontSize: '20px' }}>
          <Descriptions bordered column={3} title="Basic Information">
            {/* 行政区，位置 */}
            <Descriptions.Item label="District">{property.district}</Descriptions.Item>
            <Descriptions.Item label="Address">{property.address}</Descriptions.Item>
            <Descriptions.Item label="Street">{property.street}</Descriptions.Item>
            {/* 小区名，交易价格，单位价格 */}
            <Descriptions.Item label="Community Name">{property.community_name}</Descriptions.Item>
            <Descriptions.Item label="Transaction Price">{`${property.transaction_price} 万元`}</Descriptions.Item>
            <Descriptions.Item label="Unit Price">{`${property.unit_price} 元/平米`}</Descriptions.Item>
            {/* 建筑面积，套内面积，建筑类型 */}
            <Descriptions.Item label="Built Area">{`${property.built_area} 平米`}</Descriptions.Item>
            <Descriptions.Item label="Internal Area">{`${property.internal_area} 平米`}</Descriptions.Item>
            <Descriptions.Item label="Building Type">{property.building_type}</Descriptions.Item>
            {/* 挂牌时间，成交时间，成交周期 */}
            <Descriptions.Item label="Listing Time">{property.listing_time}</Descriptions.Item>
            <Descriptions.Item label="Transaction Time">
              {property.transaction_time}
            </Descriptions.Item>
            <Descriptions.Item label="Transaction Cycle">
              {property.transaction_cycle}
            </Descriptions.Item>
          </Descriptions>
          <Divider />
          {/* 户型图 */}
          <Descriptions bordered column={3} title="Property Layout">
            {/* 户型，楼层，装修 */}
            <Descriptions.Item label="Room Layout">{property.room_layout}</Descriptions.Item>
            <Descriptions.Item label="Floor">{property.floor}</Descriptions.Item>
            <Descriptions.Item label="Decoration">{property.decoration}</Descriptions.Item>
            {/* 房屋朝向，建筑年代，建筑结构 */}
            <Descriptions.Item label="Orientation">{property.orientation}</Descriptions.Item>
            <Descriptions.Item label="Property Age">{property.property_age}</Descriptions.Item>
            <Descriptions.Item label="Layout Structure">
              {property.layout_structure}
            </Descriptions.Item>
            {/* 户型图 */}
            <Descriptions.Item label="Layout Diagram">
              {image ? (
                <Image src={image} width={200} height={200} alt="Layout Diagram" />
              ) : (
                'Loading image... (If it takes too long, maybe the image is not available.)'
              )}
            </Descriptions.Item>
          </Descriptions>
          <Divider />
          <Descriptions bordered column={3} title="Community Information">
            {/* 小区均价，小区在售，小区在租 */}
            <Descriptions.Item label="Community Average Price">
              {`${property.community_average_price} 元/平方米`}
            </Descriptions.Item>
            <Descriptions.Item label="Community On Sale">
              {property.community_on_sale ? property.community_on_sale : 0} 套
            </Descriptions.Item>
            <Descriptions.Item label="Community On Rent">
              {property.community_on_rent ? property.community_on_rent : 0} 套
            </Descriptions.Item>
            {/* 物业费用，物业公司，车位数量 */}
            <Descriptions.Item label="Property Management Company">
              {property.property_management_company}
            </Descriptions.Item>
            <Descriptions.Item label="Property Fees">{`${property.property_fees} /平方米/元/月`}</Descriptions.Item>
            <Descriptions.Item label="Parking Spaces">
              {property.fixed_parking_spaces} 个
            </Descriptions.Item>
          </Descriptions>
          <Divider />
          <Space>
            <Button
              type="primary"
              onClick={() =>
                (window.location.href =
                  '/property/property-analysis?search=' + property.community_name)
              }
            >
              <AreaChartOutlined /> Community Analysis
            </Button>
            <Button
              type="primary"
              onClick={() =>
                navigate(
                  '/property/property-list?' + new URL(window.location.href).searchParams.toString()
                )
              }
            >
              <RollbackOutlined /> Back to Property List
            </Button>
            <Button
              type="primary"
              onClick={() => (window.location.href = '/property/property-detail/:id')}
            >
              <ClearOutlined /> Clear Property
            </Button>
          </Space>
        </Card>
      </Space>
    </>
  );
};

export default PropertyDetail;
