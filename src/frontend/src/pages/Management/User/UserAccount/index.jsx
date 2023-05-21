import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Table,
  Space,
  Card,
  Divider,
  Typography,
  Popconfirm,
  Input,
  Select,
  Form,
  Tooltip,
  Tag,
  Result,
  message,
} from 'antd';
import { Link } from 'react-router-dom';
import {
  EditOutlined,
  SaveOutlined,
  UndoOutlined,
  DeleteOutlined,
  SecurityScanOutlined,
} from '@ant-design/icons';
import { apiBaseUrl } from '@/assets/js/config.js';

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const judgeInputType = () => {
    if (dataIndex === 'account_type') {
      return (
        <Select
          placeholder="Please select account type"
          options={[
            { label: 'Admin', value: 'admin' },
            { label: 'Helper', value: 'helper' },
          ]}
        />
      );
    } else if (dataIndex === 'account_status') {
      return (
        <Select
          placeholder="Please select account status"
          options={[
            { label: 'Activated', value: 'activated' },
            { label: 'Deactivated', value: 'deactivated' },
          ]}
        />
      );
    } else if (dataIndex === 'username') {
      return <Input placeholder="Please input the Username" />;
    }
  };
  const inputNode = judgeInputType();
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{
            margin: 0,
          }}
          rules={[
            {
              required: true,
              message: `Please Input ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const UserAccount = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();
  const columns = [
    {
      title: 'User ID',
      dataIndex: 'user_id',
      width: '6%',
      fixed: 'left',
      // sorter: true,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      width: '10%',
      // sorter: true,
      editable: true,
    },
    {
      title: 'Account Type',
      dataIndex: 'account_type',
      width: '10%',
      editable: true,
      render: account_type => {
        let color;
        if (account_type === 'admin') {
          color = 'geekblue';
        } else if (account_type === 'helper') {
          color = 'green';
        } else {
          color = 'volcano';
        }
        return (
          <Tag color={color} key={account_type}>
            {account_type.replace(/^\S/, s => s.toUpperCase())}
          </Tag>
        );
      },
    },
    {
      title: 'Account Status',
      dataIndex: 'account_status',
      width: '10%',
      editable: true,
      render: account_status => {
        let color;
        if (account_status === 'activated') {
          color = 'green';
        } else if (account_status === 'deactivated') {
          color = 'volcano';
        } else {
          color = 'geekblue';
        }
        return (
          <Tag color={color} key={account_status}>
            {account_status.replace(/^\S/, s => s.toUpperCase())}
          </Tag>
        );
      },
    },
    {
      // false is offline, true is online, null is not login yet
      title: 'Online Status',
      dataIndex: 'jwt_auth_active',
      width: '10%',
      render: jwt_auth_active => {
        let color, text;
        if (jwt_auth_active === true) {
          color = 'green';
          text = 'Online';
        } else if (jwt_auth_active === false) {
          color = 'volcano';
          text = 'Offline';
        } else {
          color = 'geekblue';
          text = 'Not Login Yet';
        }
        return (
          <Tag color={color} key={jwt_auth_active}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: 'Last Online',
      dataIndex: 'last_online',
      width: '15%',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      width: '15%',
    },
    {
      title: 'Operation',
      dataIndex: 'operation',
      width: '7%',
      fixed: 'right',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Tooltip title="Save">
              <Typography.Link onClick={() => saveRecord(record.user_id)}>
                <SaveOutlined />
              </Typography.Link>
            </Tooltip>
            <Popconfirm title="Sure to undo?" onConfirm={() => undoRecord()}>
              <Tooltip title="Undo">
                <Link>
                  <UndoOutlined />
                </Link>
              </Tooltip>
            </Popconfirm>
          </Space>
        ) : (
          <Space>
            <Tooltip title="Edit">
              <Typography.Link disabled={editingKey !== ''} onClick={() => editRecord(record)}>
                <EditOutlined />
              </Typography.Link>
            </Tooltip>
            <Tooltip title="Reset User Password">
              <Link
                to={{
                  pathname: `/manage/user/user-password/${record.user_id}`,
                }}
              >
                <SecurityScanOutlined />
              </Link>
            </Tooltip>
            <Popconfirm title="Sure to delete?" onConfirm={() => deleteRecord(record.user_id)}>
              <Tooltip title="Delete">
                <Link>
                  <DeleteOutlined />
                </Link>
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const mergedColumns = columns.map(col => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: record => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const [editingKey, setEditingKey] = useState('');
  const isEditing = record => record.user_id === editingKey;
  const editRecord = record => {
    form.setFieldsValue({
      username: '',
      account_type: '',
      account_status: '',
      ...record,
    });
    // // console.log(record);
    // // console.log(record.user_id);
    setEditingKey(record.user_id);
  };
  const undoRecord = () => {
    setEditingKey('');
  };
  const saveRecord = async user_id => {
    try {
      const row = await form.validateFields();
      const newData = [...data];
      const index = newData.findIndex(item => user_id === item.user_id);
      if (index > -1) {
        // index > -1: the row is already in the table
        const item = newData[index];
        // update the data in the table
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        // update the data in the database
        // console.log(index);
        // console.log(newData[index]);
        fetch(apiBaseUrl + '/api/manage/users/edit/basic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
          // index starts from 0, but user_id starts from 1
          body: JSON.stringify({
            user_id: newData[index].user_id,
            username: newData[index].username,
            account_type: newData[index].account_type,
            account_status: newData[index].account_status,
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              // console.log(data.message);
              message.info(data.message);
            } else {
              // console.log(data.message);
              message.info(data.message);
            }
          })
          .catch(err => {
            // console.log(data.message);
            message.error(err);
            // reload page
            // window.location.reload();
          });
        // console.log(newData[index]); // the new data
        setData(newData);
        setEditingKey('');
        // update the table
        // fetchPartData();
      } else {
        // else: the row is not in the table
        newData.push(row);
        setData(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      // console.log('Validate Failed:', errInfo);
    }
  };
  const deleteRecord = async user_id => {
    try {
      const newData = [...data];
      const index = newData.findIndex(item => user_id === item.user_id);
      if (index > -1) {
        // index > -1: the row is already in the table
        // const item = newData[index];
        // update the data in the database
        // console.log(index);
        // console.log(newData[index]);
        fetch(apiBaseUrl + '/api/manage/users/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
          // index starts from 0, but user_id starts from 1
          body: JSON.stringify({
            user_id: newData[index].user_id,
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              // console.log(data.message);
              message.info(data.message);
              // update the table
              // fetchPartData();
              // delete the row
              newData.splice(index, 1);
              // console.log(newData[index]); // the new data
              setData(newData);
              setEditingKey('');
            } else {
              // console.log(data.message);
              message.info(data.message);
            }
          })
          .catch(err => {
            // console.log(data.message);
            message.error(err);
            // reload page
            // window.location.reload();
          });
      } else {
        // else: the row is not in the table
        newData.push(row);
        setData(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      // console.log('Validate Failed:', errInfo);
    }
  };

  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  });

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

  const fetchPartData = () => {
    setLoading(true);
    // fetch pagination data
    fetch(
      apiBaseUrl +
        `/api/manage/users/get/basic/pagination?current=${tableParams.pagination?.current}&pageSize=${tableParams.pagination?.pageSize}`,
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
          setData(data.users);
          setLoading(false);
          setTableParams({
            ...tableParams,
            pagination: {
              current: data.info?.current,
              pageSize: data.info?.pageSize,
              total: data.info?.total,
            },
          });
        } else {
          // console.log(data.message);
        }
      });
  };

  // fetch pagination data
  useEffect(() => {
    fetchPartData();
  }, [JSON.stringify(tableParams.pagination)]);

  useEffect(() => {
    // 判断是否登录
    isLogin();
    // console.log('UserAccount page loaded.');
  }, []);

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
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <Card title="User Account Management" size="default" headStyle={{ fontSize: '20px' }}>
            <p>
              Showing {tableParams.pagination?.current} to {tableParams.pagination?.pageSize} of{' '}
              {tableParams.pagination?.total} entries
            </p>
            <Divider />
            <Form form={form} component={false}>
              <Table
                columns={mergedColumns}
                rowKey={record => record.user_id}
                dataSource={data}
                pagination={tableParams.pagination}
                loading={loading}
                onChange={handleTableChange}
                components={{
                  body: {
                    cell: EditableCell,
                  },
                }}
                scroll={{
                  x: 800,
                }}
              />
            </Form>
          </Card>
        </Space>
      )}
    </>
  );
};
export default UserAccount;
