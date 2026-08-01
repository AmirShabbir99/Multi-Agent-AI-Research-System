import api from './axiosInstance';

export const documentApi = {
  upload: (file, onUploadProgress) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  list: (params) => api.get('/documents', { params }),
  listAllForAdmin: (params) => api.get('/documents/admin/all', { params }),
  remove: (id) => api.delete(`/documents/${id}`),
  rebuildVectorDb: () => api.post('/documents/rebuild-vector-db'),
};
