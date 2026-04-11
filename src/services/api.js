import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
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
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyLogin: (data) => api.post('/auth/verify-login', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

// Users
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  adminUpdateUser: (id, data) => api.put(`/users/${id}/admin-update`, data),
  updateProfile: (data) => api.put('/users/profile', data),
  toggleStatus: (id) => api.put(`/users/${id}/toggle-status`),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
};

// Events
export const eventAPI = {
  create: (data) => api.post('/events', data),
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getStats: () => api.get('/events/stats'),
  getEligible: () => api.get('/events/eligible'),
  forward: (id) => api.put(`/events/${id}/forward`),
  approve: (id) => api.put(`/events/${id}/approve`),
  reject: (id, reason) => api.put(`/events/${id}/reject`, { reason }),
  adminApprove: (id) => api.put(`/events/${id}/admin-approve`),
};

// Posts
export const postAPI = {
  create: (data) => api.post('/posts', data),
  getAll: (params) => api.get('/posts', { params }),
  getById: (id) => api.get(`/posts/${id}`),
  upvote: (id) => api.put(`/posts/${id}/upvote`),
  comment: (id, text) => api.post(`/posts/${id}/comment`, { text }),
  share: (id) => api.put(`/posts/${id}/share`),
  delete: (id) => api.delete(`/posts/${id}`),
};

// Registrations
export const registrationAPI = {
  register: (eventId) => api.post('/registrations', { eventId }),
  getMy: () => api.get('/registrations/my'),
  getByEvent: (eventId) => api.get(`/registrations/event/${eventId}`),
  getById: (id) => api.get(`/registrations/${id}`),
  getIdCard: (id) => api.get(`/registrations/${id}/id-card`),
  cancel: (id) => api.put(`/registrations/${id}/cancel`),
  markAttendance: (registrationId) => api.post('/registrations/attendance', { registrationId }),
};

// Notifications
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;
