import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    // Show toast for all errors unless suppressed via config
    if (!err.config?.silent && typeof window !== 'undefined') {
      import('@/components/ui/toast').then(m => {
        const msg = err.response?.data?.message || err.message || '请求失败';
        m.toast(Array.isArray(msg) ? msg.join('；') : String(msg), 'error');
      });
    }
    return Promise.reject(err);
  },
);

export default api;
