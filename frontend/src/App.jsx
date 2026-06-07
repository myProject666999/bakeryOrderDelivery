import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, message } from 'antd';
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  StarOutlined,
  SettingOutlined
} from '@ant-design/icons';
import ProductList from './pages/ProductList';
import OrderPage from './pages/OrderPage';
import OrderList from './pages/OrderList';
import DeliveryManage from './pages/DeliveryManage';
import FeedbackPage from './pages/FeedbackPage';
import ProductManage from './pages/ProductManage';

const { Header, Content, Sider } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      key: '/',
      icon: <ShoppingOutlined />,
      label: '商品列表',
      onClick: () => navigate('/')
    },
    {
      key: '/order',
      icon: <ShoppingCartOutlined />,
      label: '下单',
      onClick: () => navigate('/order')
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
      onClick: () => navigate('/orders')
    },
    {
      key: '/delivery',
      icon: <TruckOutlined />,
      label: '配送管理',
      onClick: () => navigate('/delivery')
    },
    {
      key: '/feedback',
      icon: <StarOutlined />,
      label: '客户反馈',
      onClick: () => navigate('/feedback')
    },
    {
      key: '/products',
      icon: <SettingOutlined />,
      label: '商品管理',
      onClick: () => navigate('/products')
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
          {collapsed ? '🍰' : '🍰 烘焙坊'}
        </div>
        <Menu theme="dark" mode="inline" items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>烘焙坊预定与配送系统</h2>
        </Header>
        <Content style={{ margin: '24px' }}>
          <div style={{ padding: 24, background: '#fff', borderRadius: 8, minHeight: 360 }}>
            <Routes>
              <Route path="/" element={<ProductList />} />
              <Route path="/order" element={<OrderPage />} />
              <Route path="/orders" element={<OrderList />} />
              <Route path="/delivery" element={<DeliveryManage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/products" element={<ProductManage />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
