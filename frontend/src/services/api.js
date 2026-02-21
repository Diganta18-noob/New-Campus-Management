import axios from 'axios';

// Create axios instance with default config
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  (response) => response.data,
  (error) => {
    // Handle 401 Unauthorized - token is invalid or expired
    // Don't redirect if we're already on the login page or if it's a login request
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isLoginPage = window.location.pathname === '/login';

    if (error.response?.status === 401 && !isLoginRequest && !isLoginPage) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || error.message || 'Something went wrong';
    console.error('API Error:', message);
    return Promise.reject(message); // Reject with just the message string for easier handling
  }
);


// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
};

// Classrooms API
export const classroomsAPI = {
  getAll: (params) => api.get('/classrooms', { params }),
  create: (data) => api.post('/classrooms', data),
  update: (id, data) => api.put(`/classrooms/${id}`, data),
  getAvailability: (id, params) => api.get(`/classrooms/${id}/availability`, { params })
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`),
  getStats: () => api.get('/users/stats'),
};

// Batches API
export const batchesAPI = {
  getAll: () => api.get('/batches'),
  getById: (id) => api.get(`/batches/${id}`),
  create: (batchData) => api.post('/batches', batchData),
  update: (id, batchData) => api.put(`/batches/${id}`, batchData),
  delete: (id) => api.delete(`/batches/${id}`),
  getAvailableTrainers: (excludeBatchId, batchStartDate) => api.get('/batches/available-trainers', { 
    params: { 
      ...(excludeBatchId && { excludeBatchId }),
      ...(batchStartDate && { batchStartDate })
    } 
  }),
  getAvailableClassrooms: (excludeBatchId, batchStartDate) => api.get('/batches/available-classrooms', {
    params: {
      ...(excludeBatchId && { excludeBatchId }),
      ...(batchStartDate && { batchStartDate })
    }
  }),
  getAvailableTAs: () => api.get('/batches/available-tas'),
  getAvailableLearners: (excludeBatchId, batchStartDate) => api.get('/batches/available-learners', { 
    params: { 
      ...(excludeBatchId && { excludeBatchId }),
      ...(batchStartDate && { batchStartDate })
    } 
  }),
};

// Departments API
export const departmentsAPI = {
  getAll: (params = {}) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (departmentData) => api.post('/departments', departmentData),
  update: (id, departmentData) => api.put(`/departments/${id}`, departmentData),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Attendance API
export const attendanceAPI = {
  getAll: (params = {}) => api.get('/attendance', { params }),
  mark: (attendanceData) => api.post('/attendance', attendanceData),
  update: (id, attendanceData) => api.put(`/attendance/${id}`, attendanceData),
};

// Daily Updates API
export const dailyUpdatesAPI = {
  getAll: (params = {}) => api.get('/daily-updates', { params }),
  create: (updateData) => api.post('/daily-updates', updateData),
  getById: (id) => api.get(`/daily-updates/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
};

// Health Check
export const healthCheck = () => api.get('/health');

export default {
  auth: authAPI,
  users: usersAPI,
  batches: batchesAPI,
  departments: departmentsAPI,
  attendance: attendanceAPI,
  dailyUpdates: dailyUpdatesAPI,
  dashboard: dashboardAPI,
  healthCheck,
};
