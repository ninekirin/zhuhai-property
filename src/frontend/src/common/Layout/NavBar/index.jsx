import React from 'react';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DownOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Menu, Dropdown, Space, Layout as Container } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import MenuList from '@/common/MenuList';
import MixinMenuHeader from '@/common/MixinMenuHeader';
import styles from './index.less';
import logo from '@/assets/images/logo512.png';
import { siteName } from '@/assets/js/config.js';
import cls from 'classnames';
import { useNavigate } from 'react-router-dom';
import BreadcrumbGroup from '@/common/BreadcrumbGroup';
const { Header } = Container;
import { apiBaseUrl } from '@/assets/js/config.js';

const NavBar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sideBarCollapsed, theme, menuMode } = useSelector(state => state.SettingModel);
  const onClick = ({ key }) => {
    // message.info(`Click on item ${key}`);
    if (key === 'logout') {
      // Logout
      fetch(apiBaseUrl + '/api/users/logout', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token'),
        },
        // body: JSON.stringify({}),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log(data.message);
          } else {
            console.log(data.message);
          }
        });
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('account_type');
      window.localStorage.removeItem('user_id');
      window.localStorage.removeItem('username');
      window.localStorage.clear();
      window.location.href = '/login';
    }
  };
  const menu = (
    <Menu onClick={onClick}>
      <Menu.Item key="logout">
        <Space>
          <LogoutOutlined />
          Logout
        </Space>
      </Menu.Item>
    </Menu>
  );
  return (
    <Header
      className={cls(styles.navBar, {
        [styles[theme]]: menuMode !== 'inline',
      })}
    >
      <div className={styles.navHeader}>
        {menuMode !== 'inline' ? (
          <div className={styles.left}>
            <div className={styles.logo} onClick={() => navigate('/')}>
              <img src={logo} alt="logo" />
              <span
                className={cls({
                  [styles[theme]]: menuMode !== 'inline',
                })}
              >
                {siteName}
              </span>
            </div>
            <div className={styles.menu}>
              {menuMode === 'horizontal' ? <MenuList /> : <MixinMenuHeader />}
            </div>
          </div>
        ) : (
          <div className={styles.inlineLeft}>
            {React.createElement(sideBarCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => dispatch({ type: 'setSideBarCollapsed' }),
            })}
            <BreadcrumbGroup />
          </div>
        )}
        <div
          className={cls(styles.right, {
            [styles[theme]]: menuMode !== 'inline',
            [styles.light]: menuMode === 'inline',
          })}
        >
          {/* 实现 Logout 按钮 */}
          <Dropdown overlay={menu}>
            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
              <Space>
                <UserOutlined />
                {localStorage.getItem('username')}
                <DownOutlined />
              </Space>
            </a>
          </Dropdown>
        </div>
      </div>
    </Header>
  );
};
export default NavBar;
