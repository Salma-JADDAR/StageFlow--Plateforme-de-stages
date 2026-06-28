import api from './axios';

export const uploadCV = (file) => {
  const formData = new FormData();
  formData.append('cv', file);
  return api.post('/cv/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const downloadCV = () =>
  api.get('/cv/download', { responseType: 'blob' });

export const deleteCV = () =>
  api.delete('/cv');