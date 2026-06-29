import api from './axios';
export const getFormations = () => api.get('/formations');
export const createFormation = (data) => api.post('/formations', data);
export const updateFormation = (id, data) => api.put(`/formations/${id}`, data);
export const deleteFormation = (id) => api.delete(`/formations/${id}`);