import api from './axiosInstance';

export const sessionApi = {
  create: (payload) => api.post('/sessions', payload),
  list: (params) => api.get('/sessions', { params }),
  getOne: (id) => api.get(`/sessions/${id}`),
  rename: (id, title) => api.patch(`/sessions/${id}/title`, { title }),
  archive: (id) => api.patch(`/sessions/${id}/archive`),
  remove: (id) => api.delete(`/sessions/${id}`),
  getMessages: (id, params) => api.get(`/sessions/${id}/messages`, { params }),
  sendMessage: (id, payload) => api.post(`/sessions/${id}/messages`, payload),
};
