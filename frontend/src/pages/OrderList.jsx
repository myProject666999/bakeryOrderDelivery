import React, { useState, useEffect } from 'react';
import { 
  Table, Tag, Button, Space, message, Modal, Select, Card, 
  Row, Col, Statistic, Input
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { orderApi } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let data;
      if (statusFilter !== null) {
        data = await orderApi.getByStatus(statusFilter);
      } else {
        data = [];
        for (let i = 0; i <= 5; i++) {
          try {
            const statusData = await orderApi.getByStatus(i);
            data = [...data, ...statusData];
          } catch {}
        }
      }
      setOrders(data.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime)));
    } catch (error) {
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const texts = ['待确认', '已确认', '制作中', '配送中', '已完成', '已取消'];
    return texts[status] || '未知';
  };

  const getStatusColor = (status) => {
    const colors = ['default', 'blue', 'orange', 'cyan', 'green', 'red'];
    return colors[status] || 'default';
  };

  const getDeliveryTypeText = (type) => {
    return type === 1 ? '骑手配送' : '自提';
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await orderApi.updateStatus(id, status);
      message.success('状态更新成功');
      loadOrders();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleCancel = async (id) => {
    Modal.confirm({
      title: '确认取消订单',
      content: '确定要取消此订单吗？',
      onOk: async () => {
        try {
          await orderApi.cancel(id);
          message.success('订单已取消');
          loadOrders();
        } catch (error) {
          message.error(error.message || '取消失败');
        }
      }
    });
  };

  const filteredOrders = orders.filter(order => 
    order.orderNo.toLowerCase().includes(searchText.toLowerCase())
  );

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === 0).length,
    making: orders.filter(o => o.orderStatus === 2).length,
    delivering: orders.filter(o => o.orderStatus === 3).length,
    completed: orders.filter(o => o.orderStatus === 4).length
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180
    },
    {
      title: '客户ID',
      dataIndex: 'customerId',
      key: 'customerId',
      width: 100
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (val) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{val}</span>
    },
    {
      title: '配送方式',
      dataIndex: 'deliveryType',
      key: 'deliveryType',
      width: 100,
      render: (val) => getDeliveryTypeText(val)
    },
    {
      title: '状态',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      width: 100,
      render: (val) => (
        <Tag color={getStatusColor(val)}>{getStatusText(val)}</Tag>
      )
    },
    {
      title: '下单时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 180,
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          {record.orderStatus === 0 && (
            <>
              <Button size="small" type="primary" onClick={() => handleUpdateStatus(record.id, 1)}>
                确认
              </Button>
              <Button size="small" danger onClick={() => handleCancel(record.id)}>
                取消
              </Button>
            </>
          )}
          {record.orderStatus === 1 && (
            <Button size="small" type="primary" onClick={() => handleUpdateStatus(record.id, 2)}>
              开始制作
            </Button>
          )}
          {record.orderStatus === 2 && record.deliveryType === 0 && (
            <Button size="small" type="primary" onClick={() => handleUpdateStatus(record.id, 4)}>
              完成（自提）
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>📋 订单管理</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="全部订单" value={stats.total} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="待确认" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="制作中" value={stats.making} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="筛选状态"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
          >
            <Option value={0}>待确认</Option>
            <Option value={1}>已确认</Option>
            <Option value={2}>制作中</Option>
            <Option value={3}>配送中</Option>
            <Option value={4}>已完成</Option>
            <Option value={5}>已取消</Option>
          </Select>
          <Input
            placeholder="搜索订单号"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button onClick={loadOrders}>刷新</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default OrderList;
