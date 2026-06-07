import React, { useState, useEffect } from 'react';
import { 
  Table, Tag, Button, Space, message, Modal, Form, Input, 
  InputNumber, Select, Switch, Card, Row, Col, Statistic
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { productApi, inventoryApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

function ProductManage() {
  const [form] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [inventoryData, setInventoryData] = useState({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAll();
      setProducts(data);
      
      const inventoryMap = {};
      for (const product of data) {
        try {
          const remaining = await inventoryApi.getRemaining(product.id);
          inventoryMap[product.id] = remaining;
        } catch {
          inventoryMap[product.id] = product.dailyCapacity;
        }
      }
      setInventoryData(inventoryMap);
    } catch (error) {
      message.error('加载商品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此商品吗？',
      onOk: async () => {
        try {
          await productApi.delete(id);
          message.success('删除成功');
          loadProducts();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingProduct) {
        await productApi.update(editingProduct.id, values);
        message.success('更新成功');
      } else {
        await productApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadProducts();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleInitInventory = async (productId) => {
    try {
      await inventoryApi.init(productId);
      message.success('库存初始化成功');
      loadProducts();
    } catch (error) {
      message.error('初始化失败');
    }
  };

  const getCategoryLabel = (category) => {
    const labels = { cake: '蛋糕', bread: '面包', pastry: '点心' };
    return labels[category] || category;
  };

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (val) => <Tag>{getCategoryLabel(val)}</Tag>
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (val) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{val}</span>
    },
    {
      title: '日产能',
      dataIndex: 'dailyCapacity',
      key: 'dailyCapacity',
      width: 100
    },
    {
      title: '剩余',
      key: 'remaining',
      width: 100,
      render: (_, record) => (
        <span style={{ 
          color: inventoryData[record.id] > 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {inventoryData[record.id] ?? record.dailyCapacity}
        </span>
      )
    },
    {
      title: '可定制',
      dataIndex: 'isCustomizable',
      key: 'isCustomizable',
      width: 80,
      render: (val) => val ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>
    },
    {
      title: '提前时间',
      dataIndex: 'leadTimeHours',
      key: 'leadTimeHours',
      width: 100,
      render: (val) => val ? `${val}小时` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (val) => val ? <Tag color="green">上架</Tag> : <Tag color="default">下架</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button size="small" onClick={() => handleInitInventory(record.id)}>
            初始化库存
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      )
    }
  ];

  const stats = {
    total: products.length,
    onSale: products.filter(p => p.status).length,
    customizable: products.filter(p => p.isCustomizable).length
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>⚙️ 商品管理</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={8}>
          <Card>
            <Statistic title="商品总数" value={stats.total} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card>
            <Statistic title="在售商品" value={stats.onSale} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card>
            <Statistic title="可定制商品" value={stats.customizable} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Card 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加商品
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingProduct ? '编辑商品' : '添加商品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={600}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
                <Input placeholder="请输入商品名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true }]}>
                <Select placeholder="请选择分类">
                  <Option value="cake">蛋糕</Option>
                  <Option value="bread">面包</Option>
                  <Option value="pastry">点心</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="price" label="价格" rules={[{ required: true }]}>
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0} 
                  step={0.01}
                  placeholder="请输入价格"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dailyCapacity" label="当日产能上限" rules={[{ required: true }]}>
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  placeholder="请输入日产能"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="商品描述">
            <TextArea rows={2} placeholder="请输入商品描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="isCustomizable" label="是否可定制" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => (
                  <Form.Item 
                    name="leadTimeHours" 
                    label="提前下单时间(小时)"
                    rules={getFieldValue('isCustomizable') ? [{ required: true }] : []}
                  >
                    <InputNumber 
                      style={{ width: '100%' }} 
                      min={0}
                      disabled={!getFieldValue('isCustomizable')}
                      placeholder="24"
                    />
                  </Form.Item>
                )}
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="上架" unCheckedChildren="下架" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="imageUrl" label="图片URL">
            <Input placeholder="请输入图片URL" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingProduct ? '保存修改' : '创建商品'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ProductManage;
