import axios from 'axios';

// The single source of truth for the backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Interceptor to add the auth token to every request from localStorage
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

// Global handler for expired tokens or unauthorized access
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the error is 401 Unauthorized, it likely means the token is invalid/expired.
    if (error.response?.status === 401) {
      // Dispatch a custom event that can be listened to by the AuthProvider
      // to log the user out globally.
      window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
  }
);

export default api;