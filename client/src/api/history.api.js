import api from './axiosInstance';

export const historyApi = {
  list: (params) => api.get('/history', { params }),
};

export const adminApi = {
  getOverview: () => api.get('/admin/overview'),
  listAiRequests: (params) => api.get('/admin/ai-requests', { params }),
  listErrorLogs: (params) => api.get('/admin/logs', { params }),
};
