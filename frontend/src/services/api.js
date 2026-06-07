import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.response.use(
  response => {
    if (response.data.code === 200) {
      return response.data.data;
    }
    return Promise.reject(new Error(response.data.message || '请求失败'));
  },
  error => {
    return Promise.reject(error);
  }
);

export const productApi = {
  getAll: () => api.get('/products'),
  getByCategory: (category) => api.get(`/products/category/${category}`),
  getById: (id) => api.get(`/products/${id}`),
  getWithInventory: (id) => api.get(`/products/${id}/inventory`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

export const orderApi = {
  create: (data) => api.post('/orders', data),
  getById: (id) => api.get(`/orders/${id}`),
  getByNo: (orderNo) => api.get(`/orders/no/${orderNo}`),
  getByCustomer: (customerId) => api.get(`/orders/customer/${customerId}`),
  getByStatus: (status) => api.get(`/orders/status/${status}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status?status=${status}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`)
};

export const inventoryApi = {
  getRemaining: (productId) => api.get(`/inventory/${productId}/remaining`),
  isAllowed: () => api.get('/inventory/allowed'),
  init: (productId) => api.post(`/inventory/${productId}/init`),
  sync: () => api.post('/inventory/sync')
};

export const deliveryApi = {
  getAvailableRiders: () => api.get('/delivery/riders/available'),
  getRider: (id) => api.get(`/delivery/riders/${id}`),
  createRider: (data) => api.post('/delivery/riders', data),
  updateRiderStatus: (id, status) => api.put(`/delivery/riders/${id}/status?status=${status}`),
  assign: (data) => api.post('/delivery/assign', data),
  updateTaskStatus: (taskId, status) => api.put(`/delivery/tasks/${taskId}/status?status=${status}`),
  getRiderTasks: (riderId) => api.get(`/delivery/riders/${riderId}/tasks`),
  groupOrders: (orderIds) => api.post('/delivery/group', orderIds),
  getPendingTasks: () => api.get('/delivery/tasks/pending')
};

export const feedbackApi = {
  create: (data) => api.post('/feedbacks', data),
  getByProduct: (productId) => api.get(`/feedbacks/product/${productId}`),
  getByOrder: (orderId) => api.get(`/feedbacks/order/${orderId}`),
  getByCustomer: (customerId) => api.get(`/feedbacks/customer/${customerId}`),
  getStats: (productId) => api.get(`/feedbacks/product/${productId}/stats`)
};

export default api;
