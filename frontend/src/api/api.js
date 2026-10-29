import axios from 'axios';
import { getApiBaseUrl } from '../utils/platform';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamically refresh baseURL before every request if changed in mobile settings
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = localStorage.getItem('invoxa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('invoxa_token');
      localStorage.removeItem('invoxa_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const customersApi = {
  getAll: (search) => api.get('/customers', { params: { search } }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const quotationsApi = {
  getAll: (status) => api.get('/quotations', { params: { status } }),
  getById: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  updateStatus: (id, status) => api.patch(`/quotations/${id}/status`, { status }),
  duplicate: (id) => api.post(`/quotations/${id}/duplicate`),
  convertToInvoice: (id, data) => api.post(`/quotations/${id}/convert-to-invoice`, data),
  downloadPdf: (id) => api.get(`/quotations/${id}/pdf`, { responseType: 'blob' }),
};

export const invoicesApi = {
  getAll: (status, customerId) => api.get('/invoices', { params: { status, customerId } }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, status),
  downloadPdf: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

export const paymentsApi = {
  getAll: (invoiceId) => api.get('/payments', { params: { invoiceId } }),
  recordPayment: (data) => api.post('/payments', data),
};

export const dashboardApi = {
  getMetrics: () => api.get('/dashboard/metrics'),
};

export const companyApi = {
  getProfile: () => api.get('/company'),
  updateProfile: (data) => api.put('/company', data),
  updateLogo: (logoUrl) => api.post('/company/logo', { logoUrl }),
  removeLogo: () => api.delete('/company/logo'),
  getLogs: (params) => api.get('/company/logs', { params }),
};

export default api;
