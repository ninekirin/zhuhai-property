import { insideRoutes } from '@/router';
import { Breadcrumb } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { siteName } from '@/assets/js/config.js';
const BreadcrumbGroup = () => {
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter(i => i);
  const getBreadcrumbTitle = (routes, path) => {
    return routes.reduce((pre, val) => {
      let temp = pre;
      if (val.path === path || (/\/\/*|:/.test(val.path) && val.path.includes(path))) {
        return (temp += val.title);
      }
      return (temp += getBreadcrumbTitle(val?.children || [], path));
    }, '');
  };
  const extraBreadcrumbItems = pathSnippets.map((path, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    const breadcrumbTitle = getBreadcrumbTitle(
      insideRoutes.filter(item => item.path !== 'home'),
      path
    );
    return (
      breadcrumbTitle && (
        <Breadcrumb.Item key={url}>
          <Link to={url}>{breadcrumbTitle}</Link>
        </Breadcrumb.Item>
      )
    );
  });
  const breadcrumbItems = [
    <Breadcrumb.Item key="home">
      <Link to="/">{siteName}</Link>
    </Breadcrumb.Item>,
  ].concat(extraBreadcrumbItems);
  return <Breadcrumb>{breadcrumbItems}</Breadcrumb>;
};
export default BreadcrumbGroup;
