import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const isLogin = localStorage.getItem('token');
  const navigate = useNavigate();
  if (isLogin) {
    return (
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
    );
  } else {
    window.location.href = '/login';
  }
}
