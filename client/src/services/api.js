import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || 'An error occurred';
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status !== 401) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/change-password', { currentPassword, newPassword }),
  refreshToken: () => api.post('/auth/refresh'),
};

// Items API
export const itemsAPI = {
  getItems: (params) => api.get('/items', { params }),
  getItem: (id) => api.get(`/items/${id}`),
  createItem: (itemData) => api.post('/items', itemData),
  updateItem: (id, itemData) => api.put(`/items/${id}`, itemData),
  deleteItem: (id) => api.delete(`/items/${id}`),
  getCategories: () => api.get('/items/categories/list'),
  generateQRCode: (id) => api.get(`/items/${id}/qr-code`),
  bulkImport: (items) => api.post('/items/bulk-import', { items }),
};

// Transactions API
export const transactionsAPI = {
  getTransactions: (params) => api.get('/transactions', { params }),
  getTransaction: (id) => api.get(`/transactions/${id}`),
  checkout: (checkoutData) => api.post('/transactions/checkout', checkoutData),
  returnItem: (id, returnData) => api.post(`/transactions/${id}/return`, returnData),
  approveTransaction: (id, approvalData) => api.post(`/transactions/${id}/approve`, approvalData),
  requestExtension: (id, extensionData) => api.post(`/transactions/${id}/extend`, extensionData),
  getOverdueTransactions: () => api.get('/transactions/overdue'),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updatePermissions: (id, permissions) => api.put(`/users/${id}/permissions`, { permissions }),
  getDepartments: () => api.get('/users/departments/list'),
  getUserStats: () => api.get('/users/stats/overview'),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  createNotification: (notificationData) => api.post('/notifications', notificationData),
  getNotificationStats: () => api.get('/notifications/stats'),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTransactionAnalytics: (params) => api.get('/analytics/transactions', { params }),
  getItemAnalytics: () => api.get('/analytics/items'),
  getUserAnalytics: () => api.get('/analytics/users'),
  exportReport: (params) => api.get('/analytics/reports/export', { params }),
};

export default api;
