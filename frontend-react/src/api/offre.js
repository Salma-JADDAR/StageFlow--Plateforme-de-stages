import api from './axios';

export const getAllOffres = (params) =>
  api.get('/offres', { params });

export const getOffreById = (id) =>
  api.get(`/offres/${id}`);

export const getMesOffres = () =>
  api.get('/recruteur/offres');

export const createOffre = (data) =>
  api.post('/recruteur/offres', data);

export const updateOffre = (id, data) =>
  api.put(`/recruteur/offres/${id}`, data);

export const deleteOffre = (id) =>
  api.delete(`/recruteur/offres/${id}`);

// Étudiant
export const getOffresEtudiant = (params) =>
  api.get('/etudiant/offres', { params });