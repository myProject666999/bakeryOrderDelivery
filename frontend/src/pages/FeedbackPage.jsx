import React, { useState, useEffect } from 'react';
import { 
  Card, List, Avatar, Rate, Form, Input, Select, Button, 
  message, Row, Col, Statistic, Progress, Tag, Space, Divider
} from 'antd';
import { StarOutlined, UserOutlined, CommentOutlined } from '@ant-design/icons';
import { productApi, feedbackApi, orderApi } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

function FeedbackPage() {
  const [form] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadProducts();
    loadCompletedOrders();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productApi.getAll();
      setProducts(data);
    } catch (error) {
      message.error('加载商品失败');
    }
  };

  const loadCompletedOrders = async () => {
    try {
      const data = await orderApi.getByStatus(4);
      setOrders(data);
    } catch {}
  };

  const loadFeedbacks = async (productId) => {
    try {
      const [feedbackList, feedbackStats] = await Promise.all([
        feedbackApi.getByProduct(productId),
        feedbackApi.getStats(productId)
      ]);
      setFeedbacks(feedbackList);
      setStats(feedbackStats);
    } catch (error) {
      message.error('加载反馈失败');
    }
  };

  const handleProductChange = (productId) => {
    setSelectedProduct(productId);
    if (productId) {
      loadFeedbacks(productId);
    } else {
      setFeedbacks([]);
      setStats(null);
    }
  };

  const handleSubmitFeedback = async (values) => {
    try {
      await feedbackApi.create({
        orderId: values.orderId,
        customerId: 1,
        productId: values.productId,
        tasteRating: values.tasteRating,
        satisfactionRating: values.satisfactionRating,
        comment: values.comment
      });
      message.success('反馈提交成功');
      form.resetFields();
      if (selectedProduct) {
        loadFeedbacks(selectedProduct);
      }
    } catch (error) {
      message.error(error.message || '提交失败');
    }
  };

  const renderRatingDistribution = (distribution) => {
    if (!distribution) return null;
    return [5, 4, 3, 2, 1].map(star => (
      <div key={star} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ width: 30 }}>{star}星</span>
        <Progress 
          percent={((distribution[star] || 0) / (stats?.totalCount || 1)) * 100} 
          showInfo={false}
          size="small"
          style={{ flex: 1, margin: '0 8px' }}
        />
        <span style={{ width: 40, textAlign: 'right' }}>{distribution[star] || 0}</span>
      </div>
    ));
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>⭐ 客户反馈</h2>

      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card title="提交反馈" style={{ marginBottom: 24 }}>
            <Form form={form} layout="vertical" onFinish={handleSubmitFeedback}>
              <Form.Item 
                name="orderId" 
                label="选择订单" 
                rules={[{ required: true, message: '请选择订单' }]}
              >
                <Select placeholder="请选择已完成的订单">
                  {orders.map(order => (
                    <Option key={order.id} value={order.id}>
                      {order.orderNo}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item 
                name="productId" 
                label="选择商品" 
                rules={[{ required: true, message: '请选择商品' }]}
              >
                <Select placeholder="请选择商品">
                  {products.map(product => (
                    <Option key={product.id} value={product.id}>
                      {product.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item 
                name="tasteRating" 
                label="口味评分" 
                rules={[{ required: true, message: '请评分' }]}
              >
                <Rate />
              </Form.Item>
              <Form.Item 
                name="satisfactionRating" 
                label="满意度评分" 
                rules={[{ required: true, message: '请评分' }]}
              >
                <Rate />
              </Form.Item>
              <Form.Item name="comment" label="评价内容">
                <TextArea rows={4} placeholder="请输入您的评价..." />
              </Form.Item>
              <Button type="primary" htmlType="submit" block icon={<CommentOutlined />}>
                提交反馈
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card 
            title="查看反馈统计"
            extra={
              <Select
                placeholder="选择商品查看"
                style={{ width: 200 }}
                value={selectedProduct}
                onChange={handleProductChange}
                allowClear
              >
                {products.map(product => (
                  <Option key={product.id} value={product.id}>
                    {product.name}
                  </Option>
                ))}
              </Select>
            }
          >
            {!selectedProduct ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '60px 0' }}>
                请选择商品查看反馈统计
              </div>
            ) : stats ? (
              <div>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={8}>
                    <Statistic 
                      title="总评价数" 
                      value={stats.totalCount}
                      prefix={<CommentOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="平均口味分" 
                      value={stats.averageTasteRating?.toFixed(1)}
                      prefix={<StarOutlined style={{ color: '#faad14' }} />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="平均满意度" 
                      value={stats.averageSatisfactionRating?.toFixed(1)}
                      suffix="/ 5"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                </Row>

                <Divider>评分分布</Divider>
                <div style={{ marginBottom: 24 }}>
                  {renderRatingDistribution(stats.tasteDistribution)}
                </div>

                <Divider>用户评价</Divider>
                {feedbacks.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
                    暂无评价
                  </div>
                ) : (
                  <List
                    dataSource={feedbacks}
                    renderItem={(feedback) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={
                            <Space>
                              <span>客户 #{feedback.customerId}</span>
                              <Rate disabled value={feedback.tasteRating} style={{ fontSize: 14 }} />
                            </Space>
                          }
                          description={
                            <div>
                              <div style={{ color: '#666', marginBottom: 4 }}>
                                {feedback.comment || '暂无评价内容'}
                              </div>
                              <div style={{ color: '#999', fontSize: 12 }}>
                                {dayjs(feedback.feedbackTime).format('YYYY-MM-DD HH:mm')}
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>加载中...</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default FeedbackPage;
