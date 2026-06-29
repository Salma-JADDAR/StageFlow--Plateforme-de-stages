import api from './axios';
export const getRecommendations = () =>
  api.get('/etudiant/recommendations');

export const refreshRecommendations = (etudiantId) =>
  api.post(`/admin/recommendations/refresh/${etudiantId}`);