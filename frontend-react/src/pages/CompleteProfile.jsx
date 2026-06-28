import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function CompleteProfile() {
  const [student, setStudent] = useState({
    ville: '',
    telephone: '',
    description: '',
    photoUrl: '',
    cvUrl: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cvFileName, setCvFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formations
  const [formations, setFormations] = useState([]);
  const [selectedFormationId, setSelectedFormationId] = useState('');
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [newFormation, setNewFormation] = useState({
    diplome: '', etablissement: '', niveau: '', anneeDebut: '', anneeFin: ''
  });
  const [pendingFormations, setPendingFormations] = useState([]);

  // ========== ÉTATS POUR MODIFIER UNE FORMATION EXISTANTE ==========
  const [showEditFormationModal, setShowEditFormationModal] = useState(false);
  const [editFormation, setEditFormation] = useState(null);
  const [editFormationData, setEditFormationData] = useState({
    anneeDebut: '',
    anneeFin: ''
  });

  // Compétences
  const [competences, setCompetences] = useState([]);
  const [selectedCompetences, setSelectedCompetences] = useState([]);
  const [showCompetenceModal, setShowCompetenceModal] = useState(false);
  const [newCompetence, setNewCompetence] = useState({ nom: '', categorie: '', niveau: 'intermédiaire' });
  const [pendingCompetences, setPendingCompetences] = useState([]);

  const photoInputRef = useRef(null);
  const cvInputRef = useRef(null);
  const navigate = useNavigate();

  // Charger les listes existantes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formationsRes, competencesRes] = await Promise.all([
          api.get('/formations'),
          api.get('/competences')
        ]);
        setFormations(formationsRes.data);
        setCompetences(competencesRes.data);
      } catch (error) {
        console.error('Erreur chargement listes', error);
      }
    };
    fetchData();
  }, []);

  // Photo
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return null;
    const formData = new FormData();
    formData.append('photo', photoFile);
    try {
        const res = await api.post('/upload/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('📤 Réponse upload photo:', res.data);
        const url = res.data.url;
        if (url) {
            console.log('📸 URL complète:', url);
            return url;
        }
        return null;
    } catch (err) {
        console.error('❌ Erreur upload photo:', err);
        toast.error('Erreur upload photo');
        return null;
    }
  };

  // CV
  const handleCvUpload = async () => {
    const file = cvInputRef.current?.files[0];
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('cv', file);
    
    try {
        const response = await api.post('/etudiant/cv', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        console.log('📤 Réponse upload CV:', response.data);
        
        if (response.data && response.data.cv) {
            toast.success('CV téléchargé avec succès');
            return response.data.cv.cheminFichier || response.data.cv.chemin;
        } else if (response.data && response.data.url) {
            const url = response.data.url;
            const path = url.replace(/^.*\/storage\//, '');
            return path;
        } else {
            toast.error('Erreur lors de l\'upload du CV');
            return null;
        }
    } catch (err) {
        console.error('❌ Erreur upload CV:', err);
        console.error('❌ Réponse:', err.response?.data);
        toast.error(err.response?.data?.message || 'Erreur de connexion');
        return null;
    }
  };

  const handleCvFileChange = (e) => {
    if (e.target.files.length > 0) {
      setCvFileName(e.target.files[0].name);
    } else {
      setCvFileName('');
    }
  };

  // Formation
  const handleAddFormation = async (e) => {
    e.preventDefault();
    
    const tempId = Date.now();
    const formationWithTempId = {
      ...newFormation,
      idFormation: tempId,
      isNew: true
    };
    
    setPendingFormations([...pendingFormations, formationWithTempId]);
    setFormations([...formations, formationWithTempId]);
    setSelectedFormationId(tempId);
    
    setShowFormationModal(false);
    toast.success('Formation ajoutée (sera sauvegardée à la fin)');
    setNewFormation({ diplome: '', etablissement: '', niveau: '', anneeDebut: '', anneeFin: '' });
  };

  // ========== FONCTION POUR MODIFIER UNE FORMATION EXISTANTE ==========
  const handleEditFormation = (formation) => {
    setEditFormation(formation);
    setEditFormationData({
      anneeDebut: formation.anneeDebut || '',
      anneeFin: formation.anneeFin || ''
    });
    setShowEditFormationModal(true);
  };

  const handleUpdateFormation = async (e) => {
    e.preventDefault();
    
    if (!editFormation) return;

    // Si c'est une formation existante dans la base de données
    if (!editFormation.isNew) {
      try {
        await api.put(`/formations/${editFormation.idFormation}`, {
          anneeDebut: editFormationData.anneeDebut,
          anneeFin: editFormationData.anneeFin
        });
        toast.success('Dates de la formation mises à jour');
        
        // Mettre à jour la liste localement
        setFormations(formations.map(f => 
          f.idFormation === editFormation.idFormation 
            ? { ...f, anneeDebut: editFormationData.anneeDebut, anneeFin: editFormationData.anneeFin }
            : f
        ));
        
        setShowEditFormationModal(false);
        setEditFormation(null);
      } catch (err) {
        console.error('Erreur mise à jour formation:', err);
        toast.error('Erreur lors de la mise à jour de la formation');
      }
    } else {
      // Si c'est une formation en attente (nouvelle)
      setPendingFormations(pendingFormations.map(f => 
        f.idFormation === editFormation.idFormation 
          ? { ...f, anneeDebut: editFormationData.anneeDebut, anneeFin: editFormationData.anneeFin }
          : f
      ));
      setFormations(formations.map(f => 
        f.idFormation === editFormation.idFormation 
          ? { ...f, anneeDebut: editFormationData.anneeDebut, anneeFin: editFormationData.anneeFin }
          : f
      ));
      toast.success('Dates de la formation mises à jour');
      setShowEditFormationModal(false);
      setEditFormation(null);
    }
  };

  // Compétence
  const handleAddCompetence = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const res = await api.post('/competences', {
        nom: newCompetence.nom,
        categorie: newCompetence.categorie
      });
      
      const savedCompetence = res.data;
      setCompetences([...competences, savedCompetence]);
      setSelectedCompetences([...selectedCompetences, { 
        id: savedCompetence.idCompetence, 
        niveau: newCompetence.niveau 
      }]);
      
      setShowCompetenceModal(false);
      toast.success('Compétence ajoutée avec succès');
      setNewCompetence({ nom: '', categorie: '', niveau: 'intermédiaire' });
    } catch (err) {
      console.error('Erreur création compétence:', err);
      toast.error('Erreur lors de la création de la compétence');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExistingCompetence = (competenceId, niveau) => {
    if (!selectedCompetences.find(c => c.id === competenceId)) {
      setSelectedCompetences([...selectedCompetences, { id: competenceId, niveau }]);
    }
  };

  const handleRemoveCompetence = (competenceId) => {
    setSelectedCompetences(selectedCompetences.filter(c => c.id !== competenceId));
  };

  const handleNiveauChange = (competenceId, newNiveau) => {
    setSelectedCompetences(selectedCompetences.map(c => 
      c.id === competenceId ? { ...c, niveau: newNiveau } : c
    ));
  };

  // Soumission finale
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) {
        toast.error('Enregistrement en cours...');
        return;
    }
    
    setIsSubmitting(true);
    setLoading(true);

    try {
        let photoPath = student.photoUrl;
        if (photoFile) {
            const uploaded = await handlePhotoUpload();
            if (uploaded) photoPath = uploaded;
            console.log('📸 Photo path:', photoPath);
        }

        let cvPath = student.cvUrl;
        if (cvInputRef.current?.files[0]) {
            const uploadedCv = await handleCvUpload();
            if (uploadedCv) cvPath = uploadedCv;
            console.log('📄 CV path:', cvPath);
        }

        // Sauvegarder les formations
        let finalFormationId = selectedFormationId;
        const formationsToSave = [...pendingFormations];
        
        for (const formation of formationsToSave) {
            try {
                const res = await api.post('/formations', {
                    diplome: formation.diplome,
                    etablissement: formation.etablissement,
                    niveau: formation.niveau,
                    anneeDebut: formation.anneeDebut,
                    anneeFin: formation.anneeFin
                });
                if (formation.idFormation === selectedFormationId) {
                    finalFormationId = res.data.idFormation;
                }
            } catch (err) {
                console.error('Erreur création formation:', err);
                toast.error('Erreur lors de la sauvegarde d\'une formation');
            }
        }

        // Préparer les compétences
        const competencesWithNiveau = selectedCompetences.map(selected => ({
            id: selected.id,
            niveau: selected.niveau
        }));

        // ✅ Envoyer toutes les données au backend
        const profileData = {
            ville: student.ville,
            telephone: student.telephone,
            description: student.description,
            photo: photoPath,
            cv: cvPath,
            formation_id: finalFormationId || null,
            competences: competencesWithNiveau
        };

        console.log('📤 Envoi des données finales:', profileData);

        const response = await api.put('/etudiant/profile', profileData);
        console.log('✅ Réponse du serveur:', response.data);

        setPendingFormations([]);
        
        toast.success('Profil complété avec succès !');
        navigate('/');
        
    } catch (error) {
        console.error('❌ Erreur complète:', error);
        console.error('❌ Réponse:', error.response?.data);
        toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
        setLoading(false);
        setIsSubmitting(false);
    }
  };

  const getFullPhotoUrl = () => {
    if (photoPreview) return photoPreview;
    if (student.photoUrl) {
        return student.photoUrl;
    }
    return null;
  };

  // Calcul de la progression
  const progressSteps = {
    photo: photoPreview ? 25 : 0,
    cv: cvFileName ? 25 : 0,
    formation: selectedFormationId ? 25 : 0,
    competences: Math.min(selectedCompetences.length * 8.33, 25)
  };
  
  const totalProgress = Math.round(
    progressSteps.photo + progressSteps.cv + progressSteps.formation + progressSteps.competences
  );

  return (
    <div className="complete-profile-page">

      {/* ========== MAIN CONTENT ========== */}
      <div className="main-container-premium">
        <div className="breadcrumb-premium">
          <Link to="/">Accueil</Link>
          <span>›</span>
          <span>Compléter mon profil</span>
        </div>

        <div className="content-grid-premium">
          {/* ========== FORMULAIRE ========== */}
          <div className="form-column-premium">
            <div className="form-card-premium">
              <div className="form-card-header">
                <div className="form-card-icon">
                  <i className="fas fa-user-edit"></i>
                </div>
                <div>
                  <h3>Informations personnelles</h3>
                  <p>Remplissez tous les champs pour un profil complet</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Photo de profil */}
                <div className="form-group-premium">
                  <label className="form-label-premium">
                    <i className="fas fa-user-circle"></i> Photo de profil
                  </label>
                  <div className="avatar-upload-premium">
                   <div className="avatar-preview-premium">
                    {getFullPhotoUrl() ? (
                        <img src={getFullPhotoUrl()} alt="Aperçu" />
                    ) : photoPreview ? (
                        <img src={photoPreview} alt="Aperçu" />
                    ) : (
                        <i className="fas fa-user-circle"></i>
                    )}
                  </div>
                    <div className="avatar-actions-premium">
                      <button type="button" className="btn-outline-premium" onClick={() => photoInputRef.current.click()}>
                        <i className="fas fa-upload"></i> Choisir une photo
                      </button>
                      {photoPreview && (
                        <button type="button" className="btn-outline-premium danger" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}>
                          <i className="fas fa-trash-alt"></i> Supprimer
                        </button>
                      )}
                      <input type="file" ref={photoInputRef} accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    </div>
                    <small className="form-hint-premium"><i className="fas fa-info-circle"></i> JPEG, PNG jusqu'à 2 Mo</small>
                  </div>
                </div>

                <div className="row-group-premium">
                  <div className="form-group-premium">
                    <label className="form-label-premium">
                      <i className="fas fa-map-marker-alt"></i> Ville
                    </label>
                    <input 
                      type="text" 
                      value={student.ville} 
                      onChange={e => setStudent({...student, ville: e.target.value})} 
                      placeholder="Ex: Marrakech, Casablanca..." 
                      className="form-input-premium"
                    />
                  </div>
                  <div className="form-group-premium">
                    <label className="form-label-premium">
                      <i className="fas fa-phone"></i> Téléphone
                    </label>
                    <input 
                      type="tel" 
                      value={student.telephone} 
                      onChange={e => setStudent({...student, telephone: e.target.value})} 
                      placeholder="06 12 34 56 78" 
                      className="form-input-premium"
                    />
                  </div>
                </div>

                <div className="form-group-premium">
                  <label className="form-label-premium">
                    <i className="fas fa-file-pdf"></i> CV (PDF, DOC, DOCX)
                  </label>
                  <div className="cv-upload-premium">
                    <button type="button" className="btn-outline-premium" onClick={() => cvInputRef.current.click()}>
                      <i className="fas fa-cloud-upload-alt"></i> Parcourir
                    </button>
                    <span className="cv-filename-premium">{cvFileName || 'Aucun fichier sélectionné'}</span>
                    <input type="file" ref={cvInputRef} accept=".pdf,.doc,.docx" onChange={handleCvFileChange} style={{ display: 'none' }} />
                  </div>
                  <small className="form-hint-premium"><i className="fas fa-info-circle"></i> Taille max: 5 Mo</small>
                </div>

                <div className="form-group-premium">
                  <label className="form-label-premium">
                    <i className="fas fa-align-left"></i> Description / Bio
                  </label>
                  <textarea 
                    value={student.description} 
                    onChange={e => setStudent({...student, description: e.target.value})} 
                    rows="4" 
                    placeholder="Parlez de votre parcours, vos compétences, vos objectifs professionnels..."
                    className="form-textarea-premium"
                  ></textarea>
                </div>

                {/* Formations avec bouton Modifier */}
                <div className="form-group-premium">
                  <label className="form-label-premium">
                    <i className="fas fa-graduation-cap"></i> Formation principale
                  </label>
                  <div className="select-with-add-premium">
                    <select 
                      value={selectedFormationId} 
                      onChange={e => setSelectedFormationId(e.target.value)}
                      className="form-select-premium"
                    >
                      <option value="">Sélectionnez une formation</option>
                      {formations.map(f => (
                        <option key={f.idFormation} value={f.idFormation}>
                          {f.diplome} - {f.etablissement} 
                          {f.anneeDebut && f.anneeFin ? ` (${f.anneeDebut}-${f.anneeFin})` : ''}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowFormationModal(true)} className="btn-add-premium">
                      <i className="fas fa-plus"></i> Ajouter
                    </button>
                    {selectedFormationId && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const formation = formations.find(f => f.idFormation === parseInt(selectedFormationId));
                          if (formation) handleEditFormation(formation);
                        }}
                        className="btn-edit-formation"
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="fas fa-pen"></i> Modifier dates
                      </button>
                    )}
                  </div>
                </div>

                {/* Compétences */}
                <div className="form-group-premium">
                  <label className="form-label-premium">
                    <i className="fas fa-code"></i> Compétences
                  </label>
                  <div className="skills-section-premium">
                    <div className="selected-skills-premium">
                      {selectedCompetences.length > 0 ? (
                        selectedCompetences.map(selected => {
                          const comp = competences.find(c => c.idCompetence === selected.id);
                          return comp ? (
                            <div key={selected.id} className="skill-item-premium">
                              <span className="skill-name-premium">{comp.nom}</span>
                              <select 
                                value={selected.niveau} 
                                onChange={(e) => handleNiveauChange(selected.id, e.target.value)}
                                className="skill-level-premium"
                              >
                                <option value="débutant">Débutant</option>
                                <option value="intermédiaire">Intermédiaire</option>
                                <option value="avancé">Avancé</option>
                                <option value="expert">Expert</option>
                              </select>
                              <button type="button" onClick={() => handleRemoveCompetence(selected.id)} className="remove-skill-premium">×</button>
                            </div>
                          ) : null;
                        })
                      ) : (
                        <span className="placeholder-premium"><i className="fas fa-plus-circle"></i> Aucune compétence sélectionnée</span>
                      )}
                    </div>

                    <div className="add-skill-premium">
                      <div className="add-existing-skill-premium">
                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddExistingCompetence(parseInt(e.target.value), 'intermédiaire');
                              e.target.value = '';
                            }
                          }}
                          value=""
                          className="form-select-premium"
                        >
                          <option value="">Ajouter une compétence existante...</option>
                          {competences
                            .filter(c => !selectedCompetences.find(s => s.id === c.idCompetence))
                            .map(c => (
                              <option key={c.idCompetence} value={c.idCompetence}>
                                {c.nom} - {c.categorie}
                              </option>
                            ))}
                        </select>
                      </div>
                      <button type="button" onClick={() => setShowCompetenceModal(true)} className="btn-add-premium">
                        <i className="fas fa-plus"></i> Nouvelle
                      </button>
                    </div>
                  </div>
                  <small className="form-hint-premium"><i className="fas fa-info-circle"></i> Choisissez vos compétences et définissez votre niveau</small>
                </div>

                <div className="form-actions-premium">
                  <button type="submit" className="btn-submit-premium" disabled={loading || isSubmitting}>
                    {loading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
                    ) : (
                      <><i className="fas fa-check-circle"></i> Enregistrer et terminer</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ========== SIDEBAR ========== */}
          <div className="sidebar-premium">
            {/* Progression */}
            <div className="sidebar-card-premium">
              <div className="sidebar-header-premium">
                <i className="fas fa-chart-line"></i>
                <h4>Progression du profil</h4>
              </div>
              <div className="sidebar-body-premium">
                <div className="progress-item-premium">
                  <span className="progress-label-premium">Photo</span>
                  <div className="progress-bar-premium">
                    <div className="progress-fill-premium" style={{ width: `${progressSteps.photo}%` }}></div>
                  </div>
                  <span className="progress-value-premium">{progressSteps.photo}%</span>
                </div>
                <div className="progress-item-premium">
                  <span className="progress-label-premium">CV</span>
                  <div className="progress-bar-premium">
                    <div className="progress-fill-premium" style={{ width: `${progressSteps.cv}%` }}></div>
                  </div>
                  <span className="progress-value-premium">{progressSteps.cv}%</span>
                </div>
                <div className="progress-item-premium">
                  <span className="progress-label-premium">Formation</span>
                  <div className="progress-bar-premium">
                    <div className="progress-fill-premium" style={{ width: `${progressSteps.formation}%` }}></div>
                  </div>
                  <span className="progress-value-premium">{progressSteps.formation}%</span>
                </div>
                <div className="progress-item-premium">
                  <span className="progress-label-premium">Compétences</span>
                  <div className="progress-bar-premium">
                    <div className="progress-fill-premium" style={{ width: `${progressSteps.competences}%` }}></div>
                  </div>
                  <span className="progress-value-premium">{Math.round(progressSteps.competences)}%</span>
                </div>
                <div className="progress-total-premium">
                  <span className="total-label-premium">Profil complété</span>
                  <span className="total-value-premium">{totalProgress}%</span>
                </div>
              </div>
            </div>

            {/* Conseils */}
            <div className="sidebar-card-premium tips-card-premium">
              <div className="sidebar-header-premium tips-header-premium">
                <i className="fas fa-lightbulb"></i>
                <h4>Conseils pour réussir</h4>
              </div>
              <div className="sidebar-body-premium">
                <div className="tip-item-premium">
                  <div className="tip-icon-premium photo"><i className="fas fa-camera"></i></div>
                  <div className="tip-content-premium">
                    <h5>📸 Photo professionnelle</h5>
                    <p>Une photo souriante et professionnelle augmente vos chances d'être contacté</p>
                  </div>
                </div>

                <div className="tip-item-premium">
                  <div className="tip-icon-premium cv"><i className="fas fa-file-pdf"></i></div>
                  <div className="tip-content-premium">
                    <h5>📄 CV à jour</h5>
                    <p>Un CV bien structuré et adapté au poste que vous recherchez</p>
                  </div>
                </div>

                <div className="tip-item-premium">
                  <div className="tip-icon-premium skills"><i className="fas fa-code"></i></div>
                  <div className="tip-content-premium">
                    <h5>💻 Compétences clés</h5>
                    <p>Listez vos compétences techniques avec leur niveau de maîtrise</p>
                  </div>
                </div>

                <div className="tip-item-premium">
                  <div className="tip-icon-premium bio"><i className="fas fa-align-left"></i></div>
                  <div className="tip-content-premium">
                    <h5>✍️ Bio percutante</h5>
                    <p>Décrivez votre parcours et vos objectifs professionnels en quelques lignes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistiques d'impact */}
            <div className="sidebar-card-premium stats-card-premium">
              <div className="sidebar-header-premium stats-header-premium">
                <i className="fas fa-chart-bar"></i>
                <h4>Impact de votre profil</h4>
              </div>
              <div className="sidebar-body-premium">
                <div className="stat-item-premium">
                  <div className="stat-icon-premium"><i className="fas fa-eye"></i></div>
                  <div className="stat-info-premium">
                    <span className="stat-value-premium">+70%</span>
                    <span className="stat-label-premium">de visibilité avec photo</span>
                  </div>
                </div>
                <div className="stat-item-premium">
                  <div className="stat-icon-premium"><i className="fas fa-file-alt"></i></div>
                  <div className="stat-info-premium">
                    <span className="stat-value-premium">+85%</span>
                    <span className="stat-label-premium">de chances avec CV complet</span>
                  </div>
                </div>
                <div className="stat-item-premium">
                  <div className="stat-icon-premium"><i className="fas fa-certificate"></i></div>
                  <div className="stat-info-premium">
                    <span className="stat-value-premium">+60%</span>
                    <span className="stat-label-premium">avec compétences clés</span>
                  </div>
                </div>
                <div className="stat-item-premium">
                  <div className="stat-icon-premium"><i className="fas fa-graduation-cap"></i></div>
                  <div className="stat-info-premium">
                    <span className="stat-value-premium">+40%</span>
                    <span className="stat-label-premium">avec formation renseignée</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sécurité */}
            <div className="sidebar-card-premium security-card-premium">
              <div className="security-content-premium">
                <i className="fas fa-shield-alt"></i>
                <div>
                  <h4>Vos données sont sécurisées</h4>
                  <p>Seuls les recruteurs vérifiés pourront consulter votre profil</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MODAL AJOUT FORMATION ========== */}
      {showFormationModal && (
        <div className="modal-overlay-premium" onClick={() => setShowFormationModal(false)}>
          <div className="modal-content-premium" onClick={e => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h3><i className="fas fa-graduation-cap"></i> Ajouter une formation</h3>
              <button className="modal-close-premium" onClick={() => setShowFormationModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddFormation}>
              <div className="form-group-premium">
                <label className="form-label-premium">Diplôme *</label>
                <input type="text" placeholder="Ex: Master en Informatique" value={newFormation.diplome} onChange={e => setNewFormation({...newFormation, diplome: e.target.value})} className="form-input-premium" required />
              </div>
              <div className="form-group-premium">
                <label className="form-label-premium">Établissement *</label>
                <input type="text" placeholder="Ex: Université Cadi Ayyad" value={newFormation.etablissement} onChange={e => setNewFormation({...newFormation, etablissement: e.target.value})} className="form-input-premium" required />
              </div>
              <div className="form-group-premium">
                <label className="form-label-premium">Niveau</label>
                <input type="text" placeholder="Ex: Bac+5, Master" value={newFormation.niveau} onChange={e => setNewFormation({...newFormation, niveau: e.target.value})} className="form-input-premium" />
              </div>
              <div className="row-group-premium">
                <div className="form-group-premium">
                  <label className="form-label-premium">Année début</label>
                  <input type="number" placeholder="2020" value={newFormation.anneeDebut} onChange={e => setNewFormation({...newFormation, anneeDebut: e.target.value})} className="form-input-premium" />
                </div>
                <div className="form-group-premium">
                  <label className="form-label-premium">Année fin</label>
                  <input type="number" placeholder="2024" value={newFormation.anneeFin} onChange={e => setNewFormation({...newFormation, anneeFin: e.target.value})} className="form-input-premium" />
                </div>
              </div>
              <div className="modal-buttons-premium">
                <button type="button" onClick={() => setShowFormationModal(false)}>Annuler</button>
                <button type="submit" disabled={loading}>Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL MODIFIER FORMATION EXISTANTE ========== */}
      {showEditFormationModal && editFormation && (
        <div className="modal-overlay-premium" onClick={() => setShowEditFormationModal(false)}>
          <div className="modal-content-premium" onClick={e => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h3><i className="fas fa-edit" style={{ color: '#3b82f6' }}></i> Modifier les dates</h3>
              <button className="modal-close-premium" onClick={() => setShowEditFormationModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateFormation}>
              <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f0f4ff', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: '600' }}>
                  <i className="fas fa-graduation-cap" style={{ color: '#3b82f6', marginRight: '8px' }}></i>
                  {editFormation.diplome}
                </p>
                <p style={{ fontSize: '12px', color: '#64748b' }}>
                  {editFormation.etablissement} • {editFormation.niveau || 'Niveau non spécifié'}
                </p>
              </div>

              <div className="row-group-premium">
                <div className="form-group-premium">
                  <label className="form-label-premium">Année début</label>
                  <input 
                    type="number" 
                    placeholder="2020" 
                    value={editFormationData.anneeDebut} 
                    onChange={e => setEditFormationData({...editFormationData, anneeDebut: e.target.value})} 
                    className="form-input-premium" 
                  />
                </div>
                <div className="form-group-premium">
                  <label className="form-label-premium">Année fin</label>
                  <input 
                    type="number" 
                    placeholder="2024" 
                    value={editFormationData.anneeFin} 
                    onChange={e => setEditFormationData({...editFormationData, anneeFin: e.target.value})} 
                    className="form-input-premium" 
                  />
                </div>
              </div>

              <div className="modal-buttons-premium">
                <button type="button" onClick={() => setShowEditFormationModal(false)}>Annuler</button>
                <button type="submit" disabled={loading} style={{ background: '#3b82f6' }}>
                  <i className="fas fa-save"></i> Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL AJOUT COMPÉTENCE AVEC CATÉGORIES PRÉDÉFINIES ========== */}
      {showCompetenceModal && (
        <div className="modal-overlay-premium" onClick={() => setShowCompetenceModal(false)}>
          <div className="modal-content-premium" onClick={e => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h3><i className="fas fa-code" style={{ color: '#8B5A2B' }}></i> Ajouter une compétence</h3>
              <button className="modal-close-premium" onClick={() => setShowCompetenceModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddCompetence}>
              <div className="form-group-premium">
                <label className="form-label-premium">Nom de la compétence *</label>
                <input type="text" placeholder="Ex: Laravel, React, Python..." value={newCompetence.nom} onChange={e => setNewCompetence({...newCompetence, nom: e.target.value})} className="form-input-premium" required />
              </div>
              
              <div className="form-group-premium">
                <label className="form-label-premium">Catégorie *</label>
                <select 
                  value={newCompetence.categorie} 
                  onChange={e => setNewCompetence({...newCompetence, categorie: e.target.value})}
                  className="form-select-premium" 
                  required
                >
                  <option value="">Sélectionnez une catégorie...</option>
                  <option value="Langage de programmation">🔤 Langage de programmation</option>
                  <option value="Framework">🧩 Framework</option>
                  <option value="Bibliothèque">📚 Bibliothèque</option>
                  <option value="Base de données">🗄️ Base de données</option>
                  <option value="DevOps & Cloud">☁️ DevOps & Cloud</option>
                  <option value="Outil">🔧 Outil</option>
                  <option value="Design">🎨 Design</option>
                  <option value="Marketing">📊 Marketing</option>
                  <option value="Finance">💰 Finance</option>
                  <option value="Ressources Humaines">👥 Ressources Humaines</option>
                  <option value="Gestion de projet">📋 Gestion de projet</option>
                  <option value="IA & Data Science">🤖 IA & Data Science</option>
                  <option value="Cybersécurité">🔒 Cybersécurité</option>
                  <option value="Méthodologie">📐 Méthodologie</option>
                  <option value="Soft Skills">💡 Soft Skills</option>
                  <option value="Langue">🌐 Langue</option>
                  <option value="Autre">📌 Autre</option>
                </select>
                <small className="form-hint-premium" style={{ display: 'block', marginTop: '6px' }}>
                  <i className="fas fa-info-circle"></i> Choisissez la catégorie qui correspond le mieux à cette compétence
                </small>
              </div>

              <div className="form-group-premium">
                <label className="form-label-premium">Votre niveau *</label>
                <select value={newCompetence.niveau} onChange={e => setNewCompetence({...newCompetence, niveau: e.target.value})} className="form-select-premium" required>
                  <option value="débutant">🟢 Débutant</option>
                  <option value="intermédiaire">🟡 Intermédiaire</option>
                  <option value="avancé">🟠 Avancé</option>
                  <option value="expert">🔴 Expert</option>
                </select>
                <small className="form-hint-premium" style={{ display: 'block', marginTop: '6px' }}>
                  <i className="fas fa-info-circle"></i> Sélectionnez votre niveau de maîtrise pour cette compétence
                </small>
              </div>

              <div className="modal-buttons-premium">
                <button type="button" onClick={() => setShowCompetenceModal(false)}>Annuler</button>
                <button type="submit" disabled={loading}>Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .complete-profile-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f8fafc;
          color: #1a1a1a;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ========== NAVBAR ========== */
        .navbar-premium {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-container-premium {
          max-width: 1440px;
          margin: 0 auto;
          padding: 14px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 32px;
        }

        .logo-premium {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          font-size: 24px;
          font-weight: 800;
          color: #1a1a1a;
        }

        .logo-premium span span { color: #8B5A2B; }

        .nav-links-premium {
          display: flex;
          gap: 32px;
        }

        .nav-links-premium a {
          text-decoration: none;
          color: #4a5568;
          font-weight: 500;
          font-size: 15px;
          transition: color 0.2s;
          position: relative;
        }

        .nav-links-premium a::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: #8B5A2B;
          transition: width 0.3s;
        }

        .nav-links-premium a:hover::after { width: 100%; }
        .nav-links-premium a:hover { color: #8B5A2B; }

        .btn-skip-premium {
          padding: 8px 24px;
          background: transparent;
          border: 1.5px solid #8B5A2B;
          border-radius: 40px;
          color: #8B5A2B;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-skip-premium:hover {
          background: #8B5A2B;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(139, 90, 43, 0.2);
        }

        /* ========== HERO PREMIUM ========== */
        .hero-premium {
          position: relative;
          padding: 60px 40px 80px;
          background: linear-gradient(135deg, #1a0f0a, #2d1a0e);
          overflow: hidden;
        }

        .hero-bg-premium {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/hero-profile.jpg');
          background-size: cover;
          background-position: center;
          opacity: 0.3;
        }

        .hero-overlay-premium {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at 30% 50%, rgba(93, 58, 26, 0.4), rgba(0, 0, 0, 0.7));
        }

        .hero-container-premium {
          max-width: 1440px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 60px;
        }

        .hero-content-premium {
          flex: 1;
          color: white;
        }

        .hero-badge-premium {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(8px);
          padding: 6px 18px;
          border-radius: 40px;
          margin-bottom: 20px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid rgba(255, 217, 102, 0.2);
        }

        .badge-dot-premium {
          width: 8px;
          height: 8px;
          background: #ffd966;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }

        .hero-title-premium {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 16px;
          letter-spacing: -1px;
        }

        .hero-title-premium span {
          background: linear-gradient(135deg, #ffd966, #ffb347);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hero-desc-premium {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 32px;
          max-width: 500px;
        }

        .hero-progress-premium {
          max-width: 400px;
        }

        .hero-progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .hero-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffd966, #ffb347);
          border-radius: 10px;
          transition: width 0.8s ease;
        }

        .hero-progress-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .hero-stats-premium {
          display: flex;
          gap: 40px;
          flex-shrink: 0;
        }

        .hero-stat-premium {
          text-align: center;
          padding: 20px 24px;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          min-width: 100px;
        }

        .hero-stat-number {
          display: block;
          font-size: 32px;
          font-weight: 800;
          color: #ffd966;
        }

        .hero-stat-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 4px;
        }

        /* ========== MAIN CONTENT ========== */
        .main-container-premium {
          max-width: 1440px;
          margin: 60px auto 0;
          padding: 0 40px 60px;
          position: relative;
          z-index: 10;
        }

        .breadcrumb-premium {
          padding: 16px 0 24px;
          font-size: 14px;
          color: #64748b;
        }

        .breadcrumb-premium a {
          color: #8B5A2B;
          text-decoration: none;
          font-weight: 500;
        }

        .breadcrumb-premium span { margin: 0 8px; color: #cbd5e1; }

        .content-grid-premium {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 40px;
        }

        /* ========== FORM CARD ========== */
        .form-column-premium {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-card-premium {
          background: white;
          border-radius: 24px;
          padding: 36px 32px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .form-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eef2f0;
        }

        .form-card-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          flex-shrink: 0;
        }

        .form-card-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .form-card-header p {
          font-size: 13px;
          color: #64748b;
        }

        .form-group-premium {
          margin-bottom: 24px;
        }

        .form-label-premium {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .form-label-premium i {
          color: #8B5A2B;
          margin-right: 6px;
        }

        .form-input-premium,
        .form-select-premium,
        .form-textarea-premium {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          background: #fafbfc;
        }

        .form-input-premium:focus,
        .form-select-premium:focus,
        .form-textarea-premium:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
          background: white;
        }

        .form-textarea-premium { resize: vertical; }

        .row-group-premium {
          display: flex;
          gap: 20px;
        }

        .row-group-premium .form-group-premium { flex: 1; }

        /* ========== AVATAR ========== */
        .avatar-upload-premium {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .avatar-preview-premium {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 3px solid #e2e8f0;
          transition: all 0.3s;
        }

        .avatar-preview-premium:hover { border-color: #8B5A2B; }
        .avatar-preview-premium img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-preview-premium i { font-size: 80px; color: #cbd5e1; }

        .avatar-actions-premium {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-outline-premium {
          background: transparent;
          border: 1.5px solid #8B5A2B;
          color: #8B5A2B;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-outline-premium:hover {
          background: #8B5A2B;
          color: white;
        }

        .btn-outline-premium.danger {
          border-color: #dc2626;
          color: #dc2626;
        }

        .btn-outline-premium.danger:hover {
          background: #dc2626;
          color: white;
        }

        .form-hint-premium {
          font-size: 12px;
          color: #64748b;
          display: block;
          margin-top: 4px;
        }

        /* ========== CV ========== */
        .cv-upload-premium {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cv-filename-premium {
          font-size: 13px;
          color: #4b5563;
          background: #f1f5f9;
          padding: 8px 16px;
          border-radius: 30px;
        }

        /* ========== COMPÉTENCES ========== */
        .skills-section-premium {
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          background: #fafbfc;
          overflow: hidden;
        }

        .selected-skills-premium {
          min-height: 80px;
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .skill-item-premium {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 14px;
          background: #fef3e8;
          border-radius: 30px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .skill-name-premium {
          font-weight: 600;
          color: #5D3A1A;
          min-width: 80px;
        }

        .skill-level-premium {
          width: 130px;
          padding: 4px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          font-size: 12px;
          background: white;
        }

        .remove-skill-premium {
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          font-size: 18px;
          padding: 0 4px;
          margin-left: auto;
        }

        .remove-skill-premium:hover { color: #b91c1c; }

        .placeholder-premium {
          color: #94a3b8;
          font-size: 13px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 12px;
        }

        .add-skill-premium {
          display: flex;
          padding: 12px;
          gap: 12px;
        }

        .add-existing-skill-premium { flex: 1; }

        .select-with-add-premium {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .select-with-add-premium .form-select-premium { flex: 1; }

        .btn-add-premium {
          background: #8B5A2B;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-add-premium:hover { background: #5D3A1A; }

        .btn-edit-formation {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .btn-edit-formation:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .form-hint-premium {
          display: block;
          margin-top: 6px;
        }

        /* ========== SUBMIT ========== */
        .form-actions-premium {
          margin-top: 32px;
          text-align: right;
        }

        .btn-submit-premium {
          padding: 14px 32px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border: none;
          border-radius: 40px;
          font-weight: 700;
          font-size: 15px;
          color: white;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(139, 90, 43, 0.2);
        }

        .btn-submit-premium:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(93, 58, 26, 0.3);
          gap: 14px;
        }

        .btn-submit-premium:disabled {
          opacity: 0.6;
          transform: none;
        }

        /* ========== SIDEBAR AVEC FOND MARRON ET ICONES JAUNES ========== */
        .sidebar-premium {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sidebar-card-premium {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
        }

        .sidebar-card-premium:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
        }

        .sidebar-header-premium {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }

        .sidebar-header-premium i {
          font-size: 18px;
          color: #ffd966;
        }

        .sidebar-header-premium h4 {
          font-size: 15px;
          font-weight: 700;
          color: white;
        }

        .sidebar-body-premium {
          padding: 16px 20px 20px;
        }

        /* Progress */
        .progress-item-premium {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .progress-label-premium {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          min-width: 80px;
        }

        .progress-bar-premium {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-fill-premium {
          height: 100%;
          background: #ffd966;
          border-radius: 10px;
          transition: width 0.8s ease;
        }

        .progress-value-premium {
          font-size: 11px;
          font-weight: 600;
          color: #ffd966;
          min-width: 32px;
          text-align: right;
        }

        .progress-total-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          margin-top: 4px;
        }

        .total-label-premium {
          font-size: 13px;
          font-weight: 600;
          color: white;
        }

        .total-value-premium {
          font-size: 18px;
          font-weight: 800;
          color: #ffd966;
        }

        /* Tips */
        .tips-card-premium .sidebar-body-premium {
          padding: 12px 16px 16px;
        }

        .tip-item-premium {
          display: flex;
          gap: 14px;
          padding: 12px;
          border-radius: 14px;
          transition: all 0.3s;
          cursor: default;
          margin-bottom: 4px;
        }

        .tip-item-premium:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .tip-icon-premium {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;
          font-size: 18px;
          background: rgba(255, 255, 255, 0.15);
        }

        .tip-icon-premium i {
          color: #ffd966;
        }

        .tip-content-premium h5 {
          font-size: 13px;
          font-weight: 700;
          color: white;
          margin-bottom: 2px;
        }

        .tip-content-premium p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.4;
        }

        /* Stats */
        .stat-item-premium {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-item-premium:last-child {
          border-bottom: none;
        }

        .stat-icon-premium {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.12);
        }

        .stat-icon-premium i {
          font-size: 16px;
          color: #ffd966;
        }

        .stat-info-premium { flex: 1; }

        .stat-value-premium {
          display: block;
          font-size: 16px;
          font-weight: 700;
          color: white;
        }

        .stat-label-premium {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }

        /* Security */
        .security-card-premium {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .security-content-premium {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
        }

        .security-content-premium i {
          font-size: 32px;
          color: #ffd966;
        }

        .security-content-premium h4 {
          font-size: 14px;
          font-weight: 700;
          color: white;
          margin-bottom: 2px;
        }

        .security-content-premium p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
        }

        /* ========== MODALS ========== */
        .modal-overlay-premium {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content-premium {
          background: white;
          max-width: 500px;
          width: 90%;
          border-radius: 24px;
          padding: 32px;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eef2f0;
        }

        .modal-header-premium h3 {
          font-size: 20px;
          font-weight: 700;
          color: #5D3A1A;
        }

        .modal-header-premium h3 i { color: #8B5A2B; margin-right: 8px; }

        .modal-close-premium {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #94a3b8;
          transition: color 0.2s;
        }

        .modal-close-premium:hover { color: #8B5A2B; }

        .modal-buttons-premium {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-buttons-premium button {
          padding: 10px 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .modal-buttons-premium button[type="button"] {
          background: #f1f5f9;
          color: #475569;
        }

        .modal-buttons-premium button[type="button"]:hover {
          background: #e2e8f0;
        }

        .modal-buttons-premium button[type="submit"] {
          background: #8B5A2B;
          color: white;
        }

        .modal-buttons-premium button[type="submit"]:hover {
          background: #5D3A1A;
        }

        .modal-buttons-premium button:disabled {
          opacity: 0.6;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 1200px) {
          .content-grid-premium {
            grid-template-columns: 1fr 360px;
          }
        }

        @media (max-width: 1100px) {
          .content-grid-premium {
            grid-template-columns: 1fr;
          }

          .sidebar-premium {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
        }

        @media (max-width: 992px) {
          .hero-premium { padding: 40px 24px 60px; }
          .hero-container-premium { flex-direction: column; text-align: center; }
          .hero-desc-premium { margin: 0 auto 32px; }
          .hero-progress-premium { margin: 0 auto; }
          .hero-stats-premium { width: 100%; justify-content: center; }
          .hero-title-premium { font-size: 36px; }
          .main-container-premium { padding: 0 24px 40px; }
          .nav-container-premium { padding: 12px 24px; }
        }

        @media (max-width: 768px) {
          .sidebar-premium { grid-template-columns: 1fr; }
          .row-group-premium { flex-direction: column; gap: 0; }
          .nav-links-premium { display: none; }
          .form-card-premium { padding: 24px 20px; }
          .hero-title-premium { font-size: 28px; }
          .hero-stats-premium { flex-wrap: wrap; gap: 12px; }
          .hero-stat-premium { min-width: 80px; padding: 12px 16px; }
          .hero-stat-number { font-size: 24px; }
          .avatar-preview-premium { width: 120px; height: 120px; }
          .avatar-preview-premium i { font-size: 60px; }
          .skill-item-premium { flex-direction: column; align-items: stretch; }
          .skill-level-premium { width: 100%; }
          .remove-skill-premium { margin-left: 0; align-self: flex-end; }
          .add-skill-premium { flex-direction: column; }
          .cv-upload-premium { flex-direction: column; align-items: stretch; }
          .btn-submit-premium { width: 100%; justify-content: center; }
          .select-with-add-premium { flex-direction: column; align-items: stretch; }
          .btn-edit-formation { justify-content: center; }
        }

        @media (max-width: 480px) {
          .hero-premium { padding: 30px 16px 40px; }
          .main-container-premium { padding: 0 16px 32px; }
          .form-card-premium { padding: 16px; }
          .hero-title-premium { font-size: 24px; }
          .avatar-preview-premium { width: 100px; height: 100px; }
          .avatar-preview-premium i { font-size: 50px; }
          .modal-content-premium { padding: 20px; }
        }
      `}</style>
    </div>
  );
}