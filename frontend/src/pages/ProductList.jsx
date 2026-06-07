import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Statistic, Badge, message, Empty } from 'antd';
import { ShoppingCartOutlined, FireOutlined } from '@ant-design/icons';
import { productApi, inventoryApi } from '../services/api';

const { Meta } = Card;

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAll();
      const productsWithInventory = await Promise.all(
        data.map(async (product) => {
          try {
            const remaining = await inventoryApi.getRemaining(product.id);
            return { ...product, remainingQuantity: remaining };
          } catch {
            return { ...product, remainingQuantity: product.dailyCapacity };
          }
        })
      );
      setProducts(productsWithInventory);
    } catch (error) {
      message.error('加载商品失败');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    const labels = { cake: '蛋糕', bread: '面包', pastry: '点心' };
    return labels[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = { cake: 'pink', bread: 'orange', pastry: 'green' };
    return colors[category] || 'default';
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>🎂 今日商品</h2>
      
      {products.length === 0 && !loading ? (
        <Empty description="暂无商品" />
      ) : (
        <Row gutter={[24, 24]}>
          {products.map((product) => (
            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
              <Badge.Ribbon 
                text={product.isCustomizable ? '可定制' : '现货'} 
                color={product.isCustomizable ? 'red' : 'blue'}
              >
                <Card
                  loading={loading}
                  hoverable
                  actions={[
                    <Statistic
                      key="remaining"
                      title="剩余"
                      value={product.remainingQuantity}
                      suffix={`/ ${product.dailyCapacity}`}
                      valueStyle={{ fontSize: 14 }}
                    />,
                    product.remainingQuantity > 0 ? (
                      <span style={{ color: '#52c41a' }}>
                        <FireOutlined /> 可下单
                      </span>
                    ) : (
                      <span style={{ color: '#ff4d4f' }}>已售罄</span>
                    )
                  ]}
                >
                  <Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{product.name}</span>
                        <Tag color={getCategoryColor(product.category)}>
                          {getCategoryLabel(product.category)}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <p style={{ color: '#666', marginBottom: 8 }}>{product.description}</p>
                        <p style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold', margin: 0 }}>
                          ¥{product.price}
                        </p>
                        {product.isCustomizable && (
                          <p style={{ color: '#faad14', fontSize: 12, marginTop: 4 }}>
                            需提前 {product.leadTimeHours} 小时下单
                          </p>
                        )}
                      </div>
                    }
                  />
                </Card>
              </Badge.Ribbon>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

export default ProductList;
