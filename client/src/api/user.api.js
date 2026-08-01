import api from './axiosInstance';

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (payload) => api.patch('/users/me', payload),
  changePassword: (payload) => api.post('/users/me/password', payload),

  // Admin only
  list: (params) => api.get('/users', { params }),
  setRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  setActiveStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
};
