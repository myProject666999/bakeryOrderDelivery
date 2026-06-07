import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Select, InputNumber, Button, Card, List, message, 
  DatePicker, Radio, Space, Divider, Row, Col, Statistic
} from 'antd';
import { PlusOutlined, MinusOutlined, DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { productApi, orderApi, inventoryApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

function OrderPage() {
  const [form] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderAllowed, setOrderAllowed] = useState(true);

  useEffect(() => {
    loadProducts();
    checkOrderAllowed();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productApi.getAll();
      setProducts(data);
    } catch (error) {
      message.error('加载商品失败');
    }
  };

  const checkOrderAllowed = async () => {
    try {
      const allowed = await inventoryApi.isAllowed();
      setOrderAllowed(allowed);
    } catch {
      setOrderAllowed(true);
    }
  };

  const addToCart = async () => {
    if (!selectedProduct) {
      message.warning('请选择商品');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    const quantity = form.getFieldValue('quantity') || 1;
    const customRequirements = form.getFieldValue('customRequirements');

    try {
      const remaining = await inventoryApi.getRemaining(selectedProduct);
      const existingIndex = cartItems.findIndex(item => item.productId === selectedProduct);
      const totalQuantity = existingIndex >= 0 
        ? cartItems[existingIndex].quantity + quantity 
        : quantity;

      if (totalQuantity > remaining) {
        message.error(`库存不足，剩余 ${remaining} 个`);
        return;
      }

      const newItem = {
        productId: selectedProduct,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: product.price * quantity,
        isCustomizable: product.isCustomizable,
        leadTimeHours: product.leadTimeHours,
        customRequirements
      };

      if (existingIndex >= 0) {
        const newItems = [...cartItems];
        newItems[existingIndex].quantity += quantity;
        newItems[existingIndex].subtotal = newItems[existingIndex].quantity * product.price;
        setCartItems(newItems);
      } else {
        setCartItems([...cartItems, newItem]);
      }

      form.setFieldsValue({ quantity: 1, customRequirements: '' });
      setSelectedProduct(null);
      message.success('已添加到购物车');
    } catch (error) {
      message.error('添加失败');
    }
  };

  const updateQuantity = (index, delta) => {
    const newItems = [...cartItems];
    const newQuantity = newItems[index].quantity + delta;
    if (newQuantity < 1) return;
    newItems[index].quantity = newQuantity;
    newItems[index].subtotal = newQuantity * newItems[index].unitPrice;
    setCartItems(newItems);
  };

  const removeItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async (values) => {
    if (cartItems.length === 0) {
      message.warning('请添加商品');
      return;
    }

    if (!orderAllowed) {
      message.error('今日已关单，请明日再下单');
      return;
    }

    const hasCustomItems = cartItems.some(item => item.isCustomizable);
    if (hasCustomItems && !values.deliveryTime) {
      message.error('定制商品需要选择配送时间');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerAddress: values.customerAddress,
        deliveryType: values.deliveryType,
        deliveryAddress: values.deliveryType === 1 ? values.deliveryAddress : null,
        deliveryTime: values.deliveryTime ? values.deliveryTime.toDate() : null,
        remark: values.remark,
        totalAmount: getTotalAmount(),
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          customRequirements: item.customRequirements
        }))
      };

      const result = await orderApi.create(orderData);
      message.success(`下单成功！订单号: ${result.orderNo}`);
      setCartItems([]);
      form.resetFields();
    } catch (error) {
      message.error(error.message || '下单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>🛒 下单</h2>
      
      {!orderAllowed && (
        <div style={{ 
          background: '#fff2f0', 
          border: '1px solid #ffccc7', 
          padding: 16, 
          borderRadius: 4, 
          marginBottom: 24,
          color: '#cf1322'
        }}>
          ⚠️ 今日已关单，请明日再下单
        </div>
      )}

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title="添加商品" style={{ marginBottom: 24 }}>
            <Form form={form} layout="vertical">
              <Form.Item label="选择商品">
                <Select
                  placeholder="请选择商品"
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  style={{ width: '100%' }}
                >
                  {products.map(product => (
                    <Option key={product.id} value={product.id}>
                      {product.name} - ¥{product.price}
                      {product.isCustomizable && ` (需提前${product.leadTimeHours}小时)`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="quantity" label="数量" initialValue={1}>
                    <InputNumber min={1} max={99} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="customRequirements" label="定制要求（写字、加花等）">
                <TextArea rows={2} placeholder="定制商品请填写具体要求" />
              </Form.Item>
              <Button type="primary" icon={<PlusOutlined />} onClick={addToCart} block>
                添加到购物车
              </Button>
            </Form>
          </Card>

          <Card 
            title={
              <span>
                <ShoppingCartOutlined /> 购物车 
                <span style={{ color: '#999', fontSize: 14, marginLeft: 8 }}>
                  ({cartItems.length} 件商品)
                </span>
              </span>
            }
          >
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                购物车为空
              </div>
            ) : (
              <List
                dataSource={cartItems}
                renderItem={(item, index) => (
                  <List.Item
                    actions={[
                      <Button 
                        icon={<MinusOutlined />} 
                        size="small"
                        onClick={() => updateQuantity(index, -1)}
                      />,
                      <span style={{ padding: '0 8px' }}>{item.quantity}</span>,
                      <Button 
                        icon={<PlusOutlined />} 
                        size="small"
                        onClick={() => updateQuantity(index, 1)}
                      />,
                      <Button 
                        icon={<DeleteOutlined />} 
                        size="small" 
                        danger
                        onClick={() => removeItem(index)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      title={item.productName}
                      description={
                        <div>
                          <div>单价: ¥{item.unitPrice}</div>
                          {item.customRequirements && (
                            <div style={{ color: '#faad14' }}>定制: {item.customRequirements}</div>
                          )}
                          {item.isCustomizable && (
                            <div style={{ color: '#faad14' }}>需提前{item.leadTimeHours}小时</div>
                          )}
                        </div>
                      }
                    />
                    <div style={{ fontWeight: 'bold', color: '#ff4d4f' }}>
                      ¥{item.subtotal.toFixed(2)}
                    </div>
                  </List.Item>
                )}
                footer={
                  <div style={{ textAlign: 'right', fontSize: 18, fontWeight: 'bold' }}>
                    合计: <span style={{ color: '#ff4d4f' }}>¥{getTotalAmount().toFixed(2)}</span>
                  </div>
                }
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="订单信息">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item 
                name="customerName" 
                label="客户姓名" 
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
              <Form.Item 
                name="customerPhone" 
                label="手机号" 
                rules={[{ required: true, message: '请输入手机号' }]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
              <Form.Item 
                name="customerAddress" 
                label="客户地址"
              >
                <TextArea rows={2} placeholder="请输入地址（选填）" />
              </Form.Item>

              <Divider>配送方式</Divider>

              <Form.Item 
                name="deliveryType" 
                label="配送方式" 
                initialValue={0}
                rules={[{ required: true, message: '请选择配送方式' }]}
              >
                <Radio.Group>
                  <Radio value={0}>自提</Radio>
                  <Radio value={1}>骑手配送</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => 
                  getFieldValue('deliveryType') === 1 ? (
                    <Form.Item 
                      name="deliveryAddress" 
                      label="配送地址" 
                      rules={[{ required: true, message: '请输入配送地址' }]}
                    >
                      <TextArea rows={2} placeholder="请输入详细配送地址" />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <Form.Item 
                name="deliveryTime" 
                label="期望配送时间"
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>

              <Form.Item name="remark" label="备注">
                <TextArea rows={2} placeholder="其他备注信息" />
              </Form.Item>

              <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                block
                loading={loading}
                disabled={!orderAllowed || cartItems.length === 0}
              >
                提交订单
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default OrderPage;
