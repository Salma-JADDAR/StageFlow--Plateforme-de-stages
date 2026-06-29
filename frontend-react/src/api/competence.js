import api from './axios';
export const getAllCompetences = () => api.get('/competences');
export const ajouterCompetenceEtudiant = (competenceId, niveau) =>
  api.post('/etudiant/competences', { competence_id: competenceId, niveau });
export const supprimerCompetenceEtudiant = (competenceId) =>
  api.delete(`/etudiant/competences/${competenceId}`);