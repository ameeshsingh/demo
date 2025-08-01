import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS, HTTP_STATUS } from '../utils/config';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection');
    }

    // Add auth token to headers
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear stored auth data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);

      // You can redirect to login here if needed
      // For now, just reject the request
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// API service class
class ApiService {
  // Generic request method
  async request(method, endpoint, data = null, config = {}) {
    try {
      const response = await api.request({
        method,
        url: endpoint,
        data,
        ...config,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, config = {}) {
    return this.request('GET', endpoint, null, config);
  }

  // POST request
  async post(endpoint, data = null, config = {}) {
    return this.request('POST', endpoint, data, config);
  }

  // PUT request
  async put(endpoint, data = null, config = {}) {
    return this.request('PUT', endpoint, data, config);
  }

  // DELETE request
  async delete(endpoint, config = {}) {
    return this.request('DELETE', endpoint, null, config);
  }

  // PATCH request
  async patch(endpoint, data = null, config = {}) {
    return this.request('PATCH', endpoint, data, config);
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case HTTP_STATUS.BAD_REQUEST:
          throw new Error(data.error || 'Bad request');
        case HTTP_STATUS.UNAUTHORIZED:
          throw new Error(data.error || 'Unauthorized');
        case HTTP_STATUS.FORBIDDEN:
          throw new Error(data.error || 'Forbidden');
        case HTTP_STATUS.NOT_FOUND:
          throw new Error(data.error || 'Not found');
        case HTTP_STATUS.CONFLICT:
          throw new Error(data.error || 'Conflict');
        case HTTP_STATUS.UNPROCESSABLE_ENTITY:
          throw new Error(data.error || 'Validation error');
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          throw new Error(data.error || 'Server error');
        case HTTP_STATUS.SERVICE_UNAVAILABLE:
          throw new Error(data.error || 'Service unavailable');
        default:
          throw new Error(data.error || 'Unknown error');
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'Unknown error');
    }
  }

  // Auth API methods
  auth = {
    login: (credentials) => this.post('/auth/login', credentials),
    register: (userData) => this.post('/auth/register', userData),
    sendOtp: (data) => this.post('/auth/send-otp', data),
    verifyOtp: (data) => this.post('/auth/verify-otp', data),
    forgotPassword: (data) => this.post('/auth/forgot-password', data),
    resetPassword: (data) => this.post('/auth/reset-password', data),
    getProfile: () => this.get('/auth/me'),
  };

  // User API methods
  user = {
    getProfile: () => this.get('/user/profile'),
    updateProfile: (data) => this.put('/user/profile', data),
    updateNotificationSettings: (data) => this.put('/user/notification-settings', data),
    changePassword: (data) => this.put('/user/password', data),
    deactivateAccount: (data) => this.delete('/user/account', { data }),
    getStatistics: () => this.get('/user/statistics'),
    searchUsers: (query) => this.get(`/user/search?query=${encodeURIComponent(query)}`),
  };

  // Contact API methods
  contacts = {
    getAll: (params = {}) => this.get('/contact', { params }),
    getById: (id) => this.get(`/contact/${id}`),
    create: (data) => this.post('/contact', data),
    update: (id, data) => this.put(`/contact/${id}`, data),
    delete: (id) => this.delete(`/contact/${id}`),
    import: (data) => this.post('/contact/import', data),
    addTag: (id, data) => this.post(`/contact/${id}/tags`, data),
    removeTag: (id, tag) => this.delete(`/contact/${id}/tags/${tag}`),
  };

  // Request API methods
  requests = {
    getAll: (params = {}) => this.get('/request', { params }),
    getById: (id) => this.get(`/request/${id}`),
    create: (data) => this.post('/request', data),
    updateStatus: (id, data) => this.put(`/request/${id}/status`, data),
    addMessage: (id, data) => this.post(`/request/${id}/message`, data),
    cancel: (id) => this.delete(`/request/${id}`),
    getPendingCount: () => this.get('/request/pending/count'),
  };

  // File upload method
  async uploadFile(endpoint, file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return response;
    } catch (error) {
      throw new Error('API is not available');
    }
  }
}

// Create and export API service instance
const apiService = new ApiService();
export default apiService;