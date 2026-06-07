import React, { useState, useEffect } from 'react';
import { 
  Table, Tag, Button, Space, message, Modal, Select, Card, 
  Row, Col, Form, Input, List, Avatar, Tooltip
} from 'antd';
import { 
  TruckOutlined, UserOutlined, CheckOutlined, 
  PlayCircleOutlined, CheckCircleOutlined 
} from '@ant-design/icons';
import { orderApi, deliveryApi } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

function DeliveryManage() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [riderTasks, setRiderTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [riderModalVisible, setRiderModalVisible] = useState(false);
  const [tasksModalVisible, setTasksModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [confirmedOrders, availableRiders] = await Promise.all([
        orderApi.getByStatus(1),
        deliveryApi.getAvailableRiders()
      ]);
      setOrders(confirmedOrders.filter(o => o.deliveryType === 1));
      setRiders(availableRiders);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDelivery = async () => {
    if (selectedOrders.length === 0) {
      message.warning('请选择要分配的订单');
      return;
    }
    if (!selectedRider) {
      message.warning('请选择骑手');
      return;
    }

    try {
      await deliveryApi.assign({
        riderId: selectedRider,
        orderIds: selectedOrders
      });
      message.success('配送分配成功');
      setSelectedOrders([]);
      setSelectedRider(null);
      loadData();
    } catch (error) {
      message.error(error.message || '分配失败');
    }
  };

  const handleViewRiderTasks = async (riderId) => {
    try {
      const tasks = await deliveryApi.getRiderTasks(riderId);
      setRiderTasks(tasks);
      setTasksModalVisible(true);
    } catch (error) {
      message.error('加载任务失败');
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await deliveryApi.updateTaskStatus(taskId, status);
      message.success('状态更新成功');
      const tasks = await deliveryApi.getRiderTasks(riderTasks[0]?.riderId);
      setRiderTasks(tasks);
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleCreateRider = async (values) => {
    try {
      await deliveryApi.createRider(values);
      message.success('骑手创建成功');
      setRiderModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const getTaskStatusText = (status) => {
    const texts = ['待取货', '配送中', '已完成'];
    return texts[status] || '未知';
  };

  const getTaskStatusColor = (status) => {
    const colors = ['orange', 'blue', 'green'];
    return colors[status] || 'default';
  };

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160
    },
    {
      title: '配送地址',
      dataIndex: 'deliveryAddress',
      key: 'deliveryAddress',
      ellipsis: true
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (val) => <span style={{ color: '#ff4d4f' }}>¥{val}</span>
    },
    {
      title: '下单时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 160,
      render: (val) => dayjs(val).format('MM-DD HH:mm')
    }
  ];

  const riderColumns = [
    {
      title: '骑手',
      key: 'rider',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <span>{record.name}</span>
        </Space>
      )
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val) => {
        const texts = ['离线', '在线', '配送中'];
        const colors = ['default', 'green', 'blue'];
        return <Tag color={colors[val]}>{texts[val]}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button size="small" onClick={() => handleViewRiderTasks(record.id)}>
          查看任务
        </Button>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys: selectedOrders,
    onChange: (selectedRowKeys) => setSelectedOrders(selectedRowKeys)
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>🚚 配送管理</h2>

      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card 
            title={
              <span>
                <TruckOutlined /> 待配送订单
                <Tag color="orange" style={{ marginLeft: 8 }}>{orders.length} 单</Tag>
              </span>
            }
            extra={
              <Space>
                <Select
                  placeholder="选择骑手"
                  style={{ width: 150 }}
                  value={selectedRider}
                  onChange={setSelectedRider}
                >
                  {riders.map(rider => (
                    <Option key={rider.id} value={rider.id}>
                      {rider.name}
                    </Option>
                  ))}
                </Select>
                <Button 
                  type="primary" 
                  onClick={handleAssignDelivery}
                  disabled={selectedOrders.length === 0 || !selectedRider}
                >
                  分配配送
                </Button>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Table
              rowSelection={rowSelection}
              columns={orderColumns}
              dataSource={orders}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card 
            title={
              <span>
                <UserOutlined /> 在线骑手
                <Tag color="green" style={{ marginLeft: 8 }}>{riders.length} 人</Tag>
              </span>
            }
            extra={
              <Button size="small" onClick={() => setRiderModalVisible(true)}>
                添加骑手
              </Button>
            }
          >
            <Table
              columns={riderColumns}
              dataSource={riders}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="添加骑手"
        open={riderModalVisible}
        onCancel={() => setRiderModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRider}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="骑手配送任务"
        open={tasksModalVisible}
        onCancel={() => setTasksModalVisible(false)}
        width={700}
        footer={
          <Button onClick={() => setTasksModalVisible(false)}>关闭</Button>
        }
      >
        <List
          dataSource={riderTasks}
          renderItem={(task) => (
            <List.Item
              actions={[
                task.taskStatus === 0 && (
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleUpdateTaskStatus(task.id, 1)}
                  >
                    开始配送
                  </Button>
                ),
                task.taskStatus === 1 && (
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleUpdateTaskStatus(task.id, 2)}
                  >
                    完成
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar style={{ backgroundColor: task.taskStatus === 2 ? '#52c41a' : '#1890ff' }}>
                    {task.deliverySequence}
                  </Avatar>
                }
                title={
                  <Space>
                    <span>订单 #{task.orderId}</span>
                    <Tag color={getTaskStatusColor(task.taskStatus)}>
                      {getTaskStatusText(task.taskStatus)}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    {task.estimatedArrivalTime && (
                      <div>预计送达: {dayjs(task.estimatedArrivalTime).format('HH:mm')}</div>
                    )}
                    {task.actualArrivalTime && (
                      <div style={{ color: '#52c41a' }}>
                        实际送达: {dayjs(task.actualArrivalTime).format('HH:mm')}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}

export default DeliveryManage;
