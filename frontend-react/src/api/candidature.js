// src/api/candidature.js

import api from './axios';

export const postuler = (offreId, lettreMotivation) =>
  api.post(`/etudiant/offres/${offreId}/postuler`, { lettreMotivation });

// ✅ Une seule fonction getMesCandidatures avec traitement uniforme
export const getMesCandidatures = async () => {
  try {
    const response = await api.get('/etudiant/mes-candidatures');
    // Même logique que dans MesCandidatures
    const data = response.data.data || response.data || [];
    // S'assurer que c'est un tableau
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('Erreur getMesCandidatures:', error);
    return [];
  }
};

export const getCandidaturesRecruteur = () =>
  api.get('/recruteur/candidatures');

export const accepterCandidature = (id) =>
  api.put(`/recruteur/candidatures/${id}/accepter`);

export const refuserCandidature = (id) =>
  api.put(`/recruteur/candidatures/${id}/refuser`);

export const annulerCandidature = (id) =>
  api.delete(`/etudiant/candidatures/${id}`);