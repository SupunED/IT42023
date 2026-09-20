import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle auth expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (error.config?.url !== '/auth/google') {
        window.dispatchEvent(new Event('booknest:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
