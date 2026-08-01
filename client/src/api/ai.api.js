import api from './axiosInstance';

export const aiApi = {
  ask: (payload) => api.post('/ai/ask', payload),
  search: (payload) => api.post('/ai/search', payload),
  summarize: (payload) => api.post('/ai/summarize', payload),
};
