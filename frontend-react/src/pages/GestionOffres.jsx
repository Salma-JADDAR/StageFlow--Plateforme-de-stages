import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

// Images pour l'avatar aléatoire
const avatarImages = [
  '/images/formation1.png', '/images/formation2.png', '/images/formation3.png',
  '/images/formation4.png', '/images/formation5.png', '/images/formation6.png',
  '/images/formation8.png', '/images/formation9.png', '/images/formation10.png',
  '/images/fomration7.png',
];

// Images pour les cartes
const baseImages = [
  '/images/do.png', '/images/do1.png', '/images/do2.png', '/images/do3.png',
  '/images/do4.png', '/images/do5.png', '/images/do6.png', '/images/do7.png',
  '/images/do8.png', '/images/do9.png', '/images/doo.png', '/images/doo1.png',
  '/images/doo2.png', '/images/doo3.png', '/images/doo4.png', '/images/doo5.png',
];

// Images pour la section "Pourquoi StageFlow"
const whyImages = [
  '/images/why1.png',
  '/images/why2.png',
  '/images/why3.png',
  '/images/why4.png',
];

// Images pour les cartes astuces
const tipImages = [
  '/images/e1.png',
  '/images/e2.png',
  '/images/e3.png',
  '/images/registre.png',
  '/images/formation1.png',
  '/images/formation10.png',
];

export default function GestionOffres() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [offres, setOffres] = useState([]);
  const [filteredOffres, setFilteredOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [randomAvatar, setRandomAvatar] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('tous');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOffre, setSelectedOffre] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [competences, setCompetences] = useState([]);
  const [selectedCompetences, setSelectedCompetences] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    publiees: 0,
    archivees: 0,
    enAttente: 0
  });
  const [editForm, setEditForm] = useState({
    titre: '',
    description: '',
    ville: '',
    duree: '',
    typeStage: '',
    dateLimite: '',
    statut: ''
  });

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // States pour le modal de publication
  const [showPublierModal, setShowPublierModal] = useState(false);
  const [publierLoading, setPublierLoading] = useState(false);
  const [competencesList, setCompetencesList] = useState([]);
  const [selectedCompetencesPublier, setSelectedCompetencesPublier] = useState([]);
  const [newOffre, setNewOffre] = useState({
    titre: '',
    description: '',
    ville: '',
    duree: '',
    typeStage: 'PFE',
    dateLimite: ''
  });

  // ========== ÉTATS POUR AJOUTER UNE COMPÉTENCE AVEC NIVEAU ==========
  const [showAddCompetenceModal, setShowAddCompetenceModal] = useState(false);
  const [newCompetence, setNewCompetence] = useState({
    nom: '',
    categorie: '',
    niveau: 'intermédiaire'
  });
  const [addingCompetence, setAddingCompetence] = useState(false);

  // ========== ÉTAT POUR LE NIVEAU TEMPORAIRE LORS DE LA SÉLECTION ==========
  const [tempNiveau, setTempNiveau] = useState('intermédiaire');
  const [selectedExistingCompetence, setSelectedExistingCompetence] = useState(null);

  // ========== ÉTAT POUR LES COMPÉTENCES DANS L'ÉDITION AVEC NIVEAU ==========
  const [editTempNiveau, setEditTempNiveau] = useState('intermédiaire');
  const [editSelectedCompetence, setEditSelectedCompetence] = useState(null);

  // ========== ÉTATS POUR LES NOTIFICATIONS ==========
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchOffres();
    fetchCompetences();
    fetchNotifications();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const randomIndex = Math.floor(Math.random() * avatarImages.length);
    setRandomAvatar(avatarImages[randomIndex]);

    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    filterOffres();
  }, [searchTerm, selectedStatus, offres]);

  useEffect(() => {
    if (showPublierModal) {
      fetchCompetencesList();
    }
  }, [showPublierModal]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  // ========== FONCTIONS NOTIFICATIONS ==========
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data || []);
      const unread = response.data.data?.filter(n => !n.est_lu).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchCompetences = async () => {
    try {
      const res = await api.get('/competences');
      setCompetences(res.data);
    } catch (error) {
      console.error('Erreur chargement compétences:', error);
    }
  };

  const fetchCompetencesList = async () => {
    try {
      const res = await api.get('/competences');
      setCompetencesList(res.data);
    } catch (error) {
      console.error('Erreur chargement compétences:', error);
    }
  };

  // ========== FONCTION POUR AJOUTER UNE COMPÉTENCE AVEC NIVEAU ==========
  const handleAddCompetence = async (e) => {
    e.preventDefault();
    
    if (!newCompetence.nom.trim()) {
      toast.error('Veuillez entrer un nom de compétence');
      return;
    }

    setAddingCompetence(true);
    try {
      const response = await api.post('/competences', {
        nom: newCompetence.nom.trim(),
        categorie: newCompetence.categorie || 'Générale'
      });
      
      const addedCompetence = response.data;
      setCompetencesList([...competencesList, addedCompetence]);
      
      setSelectedCompetencesPublier([...selectedCompetencesPublier, {
        id: addedCompetence.idCompetence,
        niveau: newCompetence.niveau
      }]);
      
      toast.success('Compétence ajoutée avec succès !');
      setNewCompetence({ nom: '', categorie: '', niveau: 'intermédiaire' });
      setShowAddCompetenceModal(false);
      
      await fetchCompetencesList();
      
    } catch (error) {
      console.error('Erreur ajout compétence:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout de la compétence');
    } finally {
      setAddingCompetence(false);
    }
  };

  // ========== FONCTION POUR AJOUTER UNE COMPÉTENCE EXISTANTE AVEC NIVEAU (PUBLICATION) ==========
  const handleAddExistingCompetence = () => {
    if (!selectedExistingCompetence) {
      toast.error('Veuillez sélectionner une compétence');
      return;
    }
    
    if (selectedCompetencesPublier.some(s => s.id === selectedExistingCompetence)) {
      toast.warning('Cette compétence est déjà sélectionnée');
      return;
    }
    
    setSelectedCompetencesPublier([...selectedCompetencesPublier, {
      id: selectedExistingCompetence,
      niveau: tempNiveau
    }]);
    
    setSelectedExistingCompetence(null);
    setTempNiveau('intermédiaire');
    toast.success('Compétence ajoutée avec le niveau ' + tempNiveau);
  };

  // ========== FONCTION POUR AJOUTER UNE COMPÉTENCE EXISTANTE DANS L'ÉDITION ==========
  const handleAddEditCompetence = () => {
    if (!editSelectedCompetence) {
      toast.error('Veuillez sélectionner une compétence');
      return;
    }
    
    if (selectedCompetences.some(s => s.id === editSelectedCompetence)) {
      toast.warning('Cette compétence est déjà sélectionnée');
      return;
    }
    
    setSelectedCompetences([...selectedCompetences, {
      id: editSelectedCompetence,
      niveau: editTempNiveau
    }]);
    
    setEditSelectedCompetence(null);
    setEditTempNiveau('intermédiaire');
    toast.success('Compétence ajoutée avec le niveau ' + editTempNiveau);
  };

  const fetchOffres = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recruteur/offres');
      const data = response.data.data || response.data;
      setOffres(data);
      
      const publiees = data.filter(o => o.statut === 'publiée').length;
      const archivees = data.filter(o => o.statut === 'archivée').length;
      const enAttente = data.filter(o => o.statut === 'en_attente').length;
      
      setStats({
        total: data.length,
        publiees,
        archivees,
        enAttente
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des offres');
    } finally {
      setLoading(false);
    }
  };

  const filterOffres = () => {
    let filtered = [...offres];
    
    if (selectedStatus !== 'tous') {
      filtered = filtered.filter(o => o.statut === selectedStatus);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(o => 
        o.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.typeStage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredOffres(filtered);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOffres = filteredOffres.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOffres.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = async () => {
    if (!selectedOffre) return;
    try {
      await api.delete(`/recruteur/offres/${selectedOffre.idOffre}`);
      toast.success('Offre supprimée avec succès');
      setShowDeleteModal(false);
      setSelectedOffre(null);
      fetchOffres();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ========== FONCTION D'ÉDITION MODIFIÉE AVEC NIVEAU ==========
  const handleEdit = async (offre) => {
    setSelectedOffre(offre);
    setEditForm({
      titre: offre.titre || '',
      description: offre.description || '',
      ville: offre.ville || '',
      duree: offre.duree || '',
      typeStage: offre.typeStage || 'PFE',
      dateLimite: offre.dateLimite || '',
      statut: offre.statut || 'publiée'
    });
    
    // Charger les compétences avec leur niveau
    if (offre.competences && offre.competences.length > 0) {
      const comps = offre.competences.map(c => ({
        id: c.idCompetence || c.id,
        niveau: c.pivot?.niveau || c.niveau || 'intermédiaire'
      }));
      setSelectedCompetences(comps);
    } else {
      setSelectedCompetences([]);
    }
    
    setShowEditModal(true);
  };

  // ========== FONCTION DE MISE À JOUR MODIFIÉE ==========
  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const offreData = {
        ...editForm,
        competences: selectedCompetences.map(c => c.id)
      };
      await api.put(`/recruteur/offres/${selectedOffre.idOffre}`, offreData);
      toast.success('Offre modifiée avec succès');
      setShowEditModal(false);
      setSelectedOffre(null);
      fetchOffres();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    } finally {
      setEditLoading(false);
    }
  };

  const handleStatutChange = async (offreId, newStatut) => {
    try {
      const statutValue = newStatut === 'archivée' ? 'archivée' : 'publiée';
      await api.patch(`/recruteur/offres/${offreId}/statut`, { statut: statutValue });
      toast.success(`Offre ${statutValue === 'publiée' ? 'publiée' : 'archivée'} avec succès`);
      fetchOffres();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handlePublierOffre = async (e) => {
    e.preventDefault();
    
    if (!newOffre.titre || !newOffre.description || !newOffre.ville || !newOffre.duree || !newOffre.dateLimite) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setPublierLoading(true);
    try {
      const offreData = {
        ...newOffre,
        competences: selectedCompetencesPublier.map(c => c.id)
      };
      
      await api.post('/recruteur/offres', offreData);
      toast.success('Offre soumise avec succès ! En attente de validation.');
      setShowPublierModal(false);
      setNewOffre({
        titre: '',
        description: '',
        ville: '',
        duree: '',
        typeStage: 'PFE',
        dateLimite: ''
      });
      setSelectedCompetencesPublier([]);
      fetchOffres();
    } catch (error) {
      console.error('Erreur publication:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la publication');
    } finally {
      setPublierLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'etudiant') return '/dashboard-etudiant';
    if (user.role === 'recruteur') return '/dashboard-recruteur';
    if (user.role === 'admin') return '/dashboard-admin';
    return '/profile';
  };

  const getStatusColor = (statut) => {
    switch(statut) {
      case 'publiée': return '#10b981';
      case 'archivée': return '#6c757d';
      case 'en_attente': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (statut) => {
    switch(statut) {
      case 'publiée': return 'fas fa-check-circle';
      case 'archivée': return 'fas fa-archive';
      case 'en_attente': return 'fas fa-clock';
      default: return 'fas fa-question-circle';
    }
  };

  const getStatusLabel = (statut) => {
    switch(statut) {
      case 'publiée': return 'Publiée';
      case 'archivée': return 'Archivée';
      case 'en_attente': return 'En attente';
      default: return statut;
    }
  };

  const getImageForOffre = (id) => {
    const index = (id * 2) % baseImages.length;
    return baseImages[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf7f2] to-[#efe6d8]">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-[#8B5A2B] rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Chargement de vos offres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-offres-page">
      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .gestion-offres-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
          color: #1a1a1a;
          overflow-x: hidden;
          width: 100%;
          min-height: 100vh;
        }

        /* ========== NAVBAR PREMIUM ========== */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          z-index: 1000;
          transition: all 0.3s ease;
          border-bottom: 1px solid transparent;
        }
        .navbar.scrolled {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border-bottom-color: #e8ecef;
        }
        .nav-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          font-size: 22px;
          font-weight: 800;
          color: #1a1a1a;
        }
        .logo span span { color: #8B5A2B; }
        .nav-links {
          display: flex;
          gap: 32px;
        }
        .nav-links a {
          text-decoration: none;
          color: #4a5568;
          font-weight: 500;
          font-size: 15px;
          transition: color 0.2s;
          position: relative;
        }
        .nav-links a:hover, .nav-links a.active { color: #8B5A2B; }
        .nav-links a.active::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 0;
          width: 100%;
          height: 2px;
          background: #8B5A2B;
          border-radius: 2px;
        }
        .nav-actions { 
          display: flex; 
          align-items: center; 
          gap: 16px;
        }
        .auth-buttons { display: flex; gap: 12px; }
        .btn-login {
          padding: 8px 20px;
          border: 1.5px solid #8B5A2B;
          border-radius: 40px;
          color: #8B5A2B;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }
        .btn-login:hover { background: #8B5A2B; color: white; }
        .btn-register {
          padding: 8px 20px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border-radius: 40px;
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }
        .btn-register:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(93, 58, 26, 0.3);
        }

        /* ========== NOTIFICATIONS ========== */
        .notification-wrapper {
          position: relative;
          display: inline-block;
        }

        .notification-btn {
          position: relative;
          background: none;
          border: none;
          font-size: 20px;
          color: #4a5568;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 40px;
          transition: all 0.3s;
        }

        .notification-btn:hover {
          background: #fef3e8;
          color: #8B5A2B;
        }

        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #dc2626;
          color: white;
          font-size: 10px;
          font-weight: 700;
          min-width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid white;
          animation: pulse-badge 2s infinite;
        }

        @keyframes pulse-badge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 380px;
          max-height: 500px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          overflow: hidden;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #eef2f0;
          background: #fafbfc;
        }

        .notification-header span {
          font-weight: 700;
          font-size: 16px;
          color: #1a1a1a;
        }

        .mark-all-read {
          background: none;
          border: none;
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }

        .mark-all-read:hover {
          color: #5D3A1A;
        }

        .notification-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notification-list::-webkit-scrollbar {
          width: 4px;
        }

        .notification-list::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .notification-empty {
          text-align: center;
          padding: 40px 20px;
          color: #94a3b8;
        }

        .notification-empty i {
          font-size: 40px;
          margin-bottom: 12px;
          display: block;
          color: #cbd5e1;
        }

        .notification-empty p {
          font-size: 14px;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 20px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #f1f5f9;
          position: relative;
        }

        .notification-item:hover {
          background: #fafbfc;
        }

        .notification-item.unread {
          background: #fef3e8;
        }

        .notification-item.unread::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(180deg, #5D3A1A, #8B5A2B);
        }

        .notif-icon {
          width: 36px;
          height: 36px;
          background: #fef3e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-icon i {
          font-size: 16px;
          color: #8B5A2B;
        }

        .notif-content {
          flex: 1;
          min-width: 0;
        }

        .notif-title {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 2px;
        }

        .notif-message {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notif-time {
          font-size: 10px;
          color: #94a3b8;
          margin-top: 4px;
          display: block;
        }

        .notif-delete {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .notif-delete:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .notification-footer {
          padding: 12px 20px;
          text-align: center;
          border-top: 1px solid #eef2f0;
          background: #fafbfc;
        }

        .notification-footer a {
          color: #8B5A2B;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: color 0.2s;
        }

        .notification-footer a:hover {
          color: #5D3A1A;
        }

        /* ========== USER MENU ========== */
        .user-menu { position: relative; }
        .user-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 16px;
          background: #efe6d8;
          border: none;
          border-radius: 40px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 10px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          min-width: 220px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.2s;
        }
        .user-menu:hover .user-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .user-dropdown a, .user-dropdown button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          text-decoration: none;
          color: #4a5568;
          font-size: 13px;
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
        }
        .user-dropdown a:hover, .user-dropdown button:hover { background: #efe6d8; }
        .user-dropdown hr { margin: 8px 0; border-color: #e8ecef; }
        .user-dropdown a.active { 
          color: #8B5A2B; 
          background: #fef3e8; 
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          font-size: 24px;
          color: #8B5A2B;
          cursor: pointer;
        }
        .mobile-menu {
          position: fixed;
          top: 0;
          right: -100%;
          width: 80%;
          max-width: 350px;
          height: 100%;
          background: white;
          box-shadow: -5px 0 30px rgba(0, 0, 0, 0.1);
          z-index: 1001;
          transition: right 0.3s ease;
          overflow-y: auto;
        }
        .mobile-menu.active { right: 0; }
        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: none;
        }
        .mobile-overlay.active { display: block; }

        /* ========== HERO GESTION PREMIUM ========== */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-gestion-premium {
          position: relative;
          min-height: 850px;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding-top: 50px;
        }
        .hero-gestion-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/do3.png');
          background-size: cover;
          background-position: center;
          z-index: 0;
        }
        .hero-gestion-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%);
          z-index: 1;
        }
        .hero-gestion-container {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
          padding: 60px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 80px;
          width: 100%;
          animation: fadeUp 0.8s ease-out;
        }
        .hero-gestion-content {
          flex: 1;
          color: white;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(8px);
          padding: 8px 20px;
          border-radius: 40px;
          margin-bottom: 28px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid rgba(255, 217, 102, 0.3);
        }
        .badge-dot {
          width: 8px;
          height: 8px;
          background: #ffd966;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        .hero-title {
          font-size: 56px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 20px;
          letter-spacing: -1px;
        }
        .hero-name {
          background: linear-gradient(135deg, #ffd966, #ffb347);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-desc {
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 48px;
          max-width: 500px;
          opacity: 0.9;
        }
        .hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 56px;
        }
        .hero-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 28px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }
        .hero-btn-primary {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
        }
        .hero-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 24px rgba(93, 58, 26, 0.4);
          gap: 14px;
        }
        .hero-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
        }
        .hero-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-3px);
          border-color: white;
        }
        .hero-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 32px;
        }
        .stat-card-glass {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          padding: 12px 24px;
          min-width: 110px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: all 0.3s ease;
        }
        .stat-card-glass:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-5px);
        }
        .stat-number {
          font-size: 32px;
          font-weight: 800;
          color: #ffd966;
          line-height: 1.2;
        }
        .stat-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 6px;
        }
        .hero-avatar {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .avatar-wrapper {
          position: relative;
          width: 260px;
          height: 260px;
        }
        .avatar-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd966, #ffb347);
          opacity: 0.6;
          filter: blur(8px);
          z-index: 0;
          animation: pulseRing 3s infinite;
        }
        @keyframes pulseRing {
          0% { opacity: 0.4; transform: scale(0.98); }
          50% { opacity: 0.8; transform: scale(1.02); }
          100% { opacity: 0.4; transform: scale(0.98); }
        }
        .avatar-circle {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 3px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          z-index: 1;
        }
        .avatar-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-initials {
          font-size: 64px;
          font-weight: 800;
          color: white;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        .avatar-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: linear-gradient(135deg, #10b981, #059669);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 2;
        }
        .avatar-badge i { font-size: 24px; color: white; }
        .hero-quote {
          text-align: center;
          max-width: 260px;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          border-radius: 40px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
        }
        .hero-quote i { color: #ffd966; margin-right: 6px; }

        @media (max-width: 1000px) {
          .hero-gestion-container { flex-direction: column; text-align: center; gap: 50px; }
          .hero-desc { margin-left: auto; margin-right: auto; }
          .hero-buttons { justify-content: center; }
          .hero-stats { justify-content: center; }
          .avatar-wrapper { width: 200px; height: 200px; }
          .hero-title { font-size: 42px; }
        }
        @media (max-width: 700px) {
          .hero-title { font-size: 32px; }
          .avatar-wrapper { width: 160px; height: 160px; }
          .hero-btn { padding: 8px 20px; font-size: 12px; }
        }

        /* ========== STATS GRID PREMIUM ========== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 28px;
          margin-bottom: 56px;
          padding: 60px 90px;
        }
        .stat-card {
          background-size: cover;
          background-position: center;
          border-radius: 28px;
          padding: 28px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.02);
          border: 1px solid #f0f2f5;
          position: relative;
          overflow: hidden;
        }
        .stat-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.4);
          z-index: 0;
          transition: background 0.3s;
        }
        .stat-card:hover::after { background: rgba(255, 255, 255, 0.92); }
        .stat-card > * { position: relative; z-index: 1; }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #5D3A1A, #8B5A2B, #ffd966);
          transform: scaleX(0);
          transition: transform 0.4s ease;
          z-index: 1;
        }
        .stat-card:hover { transform: translateY(-6px); box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.12); border-color: transparent; }
        .stat-card:hover::before { transform: scaleX(1); }
        .stat-icon {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #fef3e8, #fff5ed);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }
        .stat-card:hover .stat-icon {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          transform: scale(1.02);
        }
        .stat-icon i { font-size: 32px; color: #8B5A2B; transition: color 0.2s; }
        .stat-card:hover .stat-icon i { color: white; }
        .stat-info { flex: 1; }
        .stat-number { font-size: 36px; font-weight: 800; color: #0f172a; line-height: 1.2; margin-bottom: 6px; }
        .stat-label { font-size: 14px; font-weight: 500; color: #64748b; }

        /* ========== CONTAINER DES OFFRES ========== */
        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 90px 60px;
        }

        /* ========== SEARCH BAR STYLE OFFRES ========== */
        .search-wrapper-offres {
          max-width: 1600px;
          margin: -28px auto 0;
          padding: 0 90px;
          position: relative;
          z-index: 10;
        }

        .search-card-offres {
          background: white;
          border-radius: 60px;
          padding: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(0, 0, 0, 0.04);
          flex-wrap: wrap;
        }

        .search-field-offres {
          flex: 2;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          background: #f8fafc;
          border-radius: 50px;
          transition: all 0.2s;
        }

        .search-field-offres:focus-within {
          background: white;
          box-shadow: 0 0 0 2px #8B5A2B;
        }

        .search-field-offres i {
          color: #94a3b8;
          font-size: 18px;
        }

        .search-field-offres input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          background: transparent;
          font-weight: 500;
        }

        .search-field-offres input::placeholder {
          color: #94a3b8;
        }

        .filter-chips-offres {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 4px;
        }

        .filter-chip-offres {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #f1f5f9;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .filter-chip-offres:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .filter-chip-offres.active {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          box-shadow: 0 4px 12px rgba(93, 58, 26, 0.2);
        }

        .filter-chip-offres i {
          font-size: 12px;
        }

        .clear-search-offres {
          background: none;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          color: #94a3b8;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
        }

        .clear-search-offres:hover {
          background: #fee2e2;
          color: #dc2626;
          transform: scale(1.05);
        }

        .btn-add-offre-premium {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          padding: 12px 28px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s;
          white-space: nowrap;
        }
        .btn-add-offre-premium:hover {
          transform: scale(1.02);
          gap: 14px;
          box-shadow: 0 8px 20px rgba(93,58,26,0.3);
        }

        /* ========== OFFRES GRID PREMIUM - 3 COLONNES ========== */
        .offres-grid-premium {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin-top: 30px;
        }
        .offre-card-premium {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #f0f2f5;
          cursor: pointer;
          animation: fadeInCard 0.5s ease forwards;
          opacity: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        @keyframes fadeInCard {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .offre-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.15);
          border-color: transparent;
        }
        .card-image-premium {
          position: relative;
          height: 240px;
          background-size: cover;
          background-position: center;
          transition: transform 0.4s;
        }
        .offre-card-premium:hover .card-image-premium {
          transform: scale(1.05);
        }
        .card-image-premium::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.3), rgba(139, 90, 43, 0.2));
        }
        .status-badge-premium {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          color: white;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 2;
        }
        .card-content-premium {
          padding: 28px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .offre-title-premium {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #0f172a;
          line-height: 1.3;
        }
        .offre-meta-premium {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-top: 1px solid #eef2f0;
          border-bottom: 1px solid #eef2f0;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .meta-item-premium {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
        }
        .meta-item-premium i { color: #8B5A2B; }
        .card-actions-premium {
          display: flex;
          gap: 10px;
          margin-top: auto;
        }
        .btn-edit-premium {
          flex: 1;
          background: #fef3e8;
          color: #8B5A2B;
          border: none;
          padding: 10px 16px;
          border-radius: 40px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-edit-premium:hover { background: #8B5A2B; color: white; gap: 8px; }
        .btn-delete-premium {
          flex: 1;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          padding: 10px 16px;
          border-radius: 40px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-delete-premium:hover { background: #dc2626; color: white; gap: 8px; }
        .btn-statut-premium {
          flex: 1;
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 10px 16px;
          border-radius: 40px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-statut-premium:hover { background: #8B5A2B; color: white; gap: 8px; }

        /* ========== PAGINATION ========== */
        .pagination-premium {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 40px;
          padding-bottom: 20px;
        }
        .pagination-premium .page-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          font-size: 14px;
          color: #475569;
        }
        .pagination-premium .page-btn:hover {
          border-color: #8B5A2B;
          color: #8B5A2B;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .pagination-premium .page-btn.active {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border-color: #8B5A2B;
        }
        .pagination-premium .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* ========== SECTION POURQUOI CHOISIR STAGEFLOW AVEC IMAGES ========== */
        .why-section {
          padding: 80px 90px;
          margin-top: 60px;
          background: #f8f9fa;
          position: relative;
          overflow: hidden;
        }
        .why-section .badge {
          display: inline-block;
          background: rgba(139, 90, 43, 0.1);
          padding: 6px 20px;
          border-radius: 40px;
          font-size: 12px;
          color: #8B5A2B;
          font-weight: 600;
          letter-spacing: 1px;
          margin-bottom: 16px;
        }
        .why-section h2 {
          font-size: 40px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 12px;
        }
        .why-section .subtitle {
          font-size: 16px;
          color: #8B5A2B;
        }
        .why-container {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .why-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .why-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .why-card-with-image {
          border-radius: 24px;
          padding: 32px 24px;
          min-height: 280px;
          text-align: center;
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .why-card-with-image::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%);
          z-index: 0;
          transition: background 0.3s ease;
        }
        .why-card-with-image:hover {
          transform: translateY(-8px);
          border-color: rgba(139,90,43,0.2);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .why-card-with-image:hover::before {
          background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%);
        }
        .why-card-with-image .card-content {
          position: relative;
          z-index: 1;
          color: white;
        }
        .why-card-with-image .icon {
          width: 64px;
          height: 64px;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(8px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 28px;
          color: #ffd966;
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.3s ease;
        }
        .why-card-with-image:hover .icon {
          background: rgba(255,217,102,0.2);
          transform: scale(1.05);
        }
        .why-card-with-image h4 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
          color: white;
        }
        .why-card-with-image p {
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
        }
        .why-card-with-image .card-number {
          position: absolute;
          bottom: 16px;
          right: 20px;
          font-size: 64px;
          font-weight: 800;
          color: rgba(255,255,255,0.04);
          z-index: 0;
        }

        /* ========== SECTION ASTUCES POUR VOS OFFRES ========== */
        .tips-section {
          padding: 80px 90px;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
        }
        .tips-container {
          max-width: 1280px;
          margin: 0 auto;
        }
        .tips-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .tips-header .badge {
          display: inline-block;
          background: rgba(139, 90, 43, 0.1);
          padding: 6px 20px;
          border-radius: 40px;
          font-size: 12px;
          color: #8B5A2B;
          font-weight: 600;
          letter-spacing: 1px;
          margin-bottom: 16px;
        }
        .tips-header h2 {
          font-size: 40px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 12px;
        }
        .tips-header p {
          font-size: 16px;
          color: #6c757d;
        }
        .tips-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        .tip-card {
          background-size: cover;
          background-position: center;
          border-radius: 24px;
          padding: 32px 28px;
          min-height: 260px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .tip-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%);
          z-index: 0;
        }
        .tip-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .tip-card .tip-content {
          position: relative;
          z-index: 1;
          color: white;
        }
        .tip-card .tip-icon {
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .tip-card .tip-icon i {
          font-size: 22px;
          color: #ffd966;
        }
        .tip-card h4 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .tip-card p {
          font-size: 13px;
          color: rgba(255,255,255,0.9);
          line-height: 1.5;
        }
        .tip-card .tip-number {
          position: absolute;
          top: 16px;
          right: 20px;
          font-size: 48px;
          font-weight: 800;
          color: rgba(255,255,255,0.08);
          z-index: 0;
        }

        @media (max-width: 1200px) {
          .tips-section { padding: 60px 40px; }
          .tips-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .tips-section { padding: 40px 20px; }
          .tips-grid { grid-template-columns: 1fr; }
          .tips-header h2 { font-size: 28px; }
          .notification-dropdown { width: 320px; right: -50px; }
        }

        /* ========== EMPTY STATE PREMIUM ========== */
        .empty-state-premium {
          text-align: center;
          padding: 60px 30px;
          background: white;
          border-radius: 32px;
          border: 1px solid #eef2f0;
        }
        .empty-icon-premium {
          width: 80px;
          height: 80px;
          background: #fef3e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .empty-icon-premium i { font-size: 40px; color: #8B5A2B; }
        .empty-title-premium {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1a1a1a;
        }
        .empty-desc-premium {
          color: #64748b;
          margin-bottom: 20px;
        }

        /* ========== MODALS PREMIUM ========== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeInModal 0.3s ease;
        }
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content-premium {
          background: white;
          border-radius: 32px;
          max-width: 700px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
          padding: 32px;
          animation: slideUpModal 0.3s ease;
        }
        @keyframes slideUpModal {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #eef2f0;
        }
        .modal-header-premium h2 {
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6c757d;
          transition: color 0.2s;
        }
        .modal-close:hover { color: #8B5A2B; }
        .form-group-premium {
          margin-bottom: 20px;
        }
        .form-group-premium label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .form-group-premium label span { color: #dc2626; }
        .form-group-premium input, .form-group-premium select, .form-group-premium textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 16px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          background: #fafbfc;
        }
        .form-group-premium input:focus, .form-group-premium select:focus, .form-group-premium textarea:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
          background: white;
        }
        .form-row-premium {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* ========== COMPÉTENCES SECTION ========== */
        .competences-section-modal {
          margin: 20px 0;
        }

        .competences-title-modal {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .competences-title-modal .add-competence-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .competences-title-modal .add-competence-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(93,58,26,0.3);
        }

        /* ========== AJOUT COMPÉTENCE EXISTANTE AVEC NIVEAU ========== */
        .add-existing-competence-row {
          margin-bottom: 16px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid #eef2f0;
        }

        .add-existing-competence-fields {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .add-existing-competence-fields .form-select-premium {
          flex: 1;
          min-width: 150px;
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 13px;
          background: white;
          transition: all 0.2s;
        }

        .add-existing-competence-fields .form-select-premium:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
        }

        .add-existing-competence-fields .niveau-select {
          flex: 0.6;
          min-width: 120px;
        }

        .btn-add-existing-competence {
          padding: 10px 20px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .btn-add-existing-competence:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(93, 58, 26, 0.3);
        }

        .btn-add-existing-competence:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .competences-grid-modal {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          max-height: 200px;
          overflow-y: auto;
          padding: 4px;
        }

        .competences-grid-modal::-webkit-scrollbar {
          width: 4px;
        }

        .competences-grid-modal::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .competence-chip-premium {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f1f5f9;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .competence-chip-premium:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .competence-chip-premium.selected {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border-color: #8B5A2B;
        }

        .competence-chip-premium i { font-size: 12px; }

        .competence-level-badge {
          font-size: 9px;
          padding: 2px 8px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.25);
          color: white;
          font-weight: 600;
          text-transform: uppercase;
        }

        .competence-level-select {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.15);
          color: white;
          cursor: pointer;
          outline: none;
        }

        .competence-level-select option {
          background: #5D3A1A;
          color: white;
        }

        .remove-competence-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 0 4px;
          font-size: 12px;
          transition: color 0.2s;
        }

        .remove-competence-btn:hover {
          color: #ffffff;
        }

        .modal-actions-premium {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-confirm-premium {
          flex: 1;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-confirm-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(93,58,26,0.3);
        }

        .btn-confirm-danger-premium {
          flex: 1;
          background: #dc2626;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-confirm-danger-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220,38,38,0.3);
        }

        .btn-cancel-premium {
          flex: 1;
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 14px;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel-premium:hover { background: #e2e8f0; }

        /* ========== MODAL AJOUT COMPÉTENCE AVEC CATÉGORIES PRÉDÉFINIES ========== */
        .add-competence-modal-content {
          max-width: 450px;
        }

        .add-competence-modal-content .form-group-premium {
          margin-bottom: 16px;
        }

        .add-competence-modal-content .form-group-premium label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
          display: block;
        }

        .add-competence-modal-content .form-group-premium select {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 16px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          background: #fafbfc;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 38px;
        }

        .add-competence-modal-content .form-group-premium select:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
          background: white;
        }

        .add-competence-modal-content .form-group-premium small {
          display: block;
          margin-top: 6px;
          color: #64748b;
          font-size: 12px;
        }

        .add-competence-modal-content .form-group-premium small i {
          margin-right: 4px;
        }

        /* ========== COMPÉTENCES DANS L'ÉDITION - DESIGN AMÉLIORÉ ========== */
        .edit-competences-wrapper {
          background: #f8fafc;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #eef2f0;
        }

        .edit-competences-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .edit-competences-counter {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .edit-competences-counter .counter-number {
          font-size: 20px;
          font-weight: 800;
          color: #5D3A1A;
          background: #fef3e8;
          padding: 2px 12px;
          border-radius: 30px;
          min-width: 30px;
          text-align: center;
        }

        .edit-competences-counter .counter-text {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
        }

        .edit-competences-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          border: 2px dashed #e2e8f0;
          min-height: 80px;
          transition: all 0.3s ease;
        }

        .edit-competences-list:has(.edit-competence-item) {
          border-color: #8B5A2B;
          border-style: solid;
        }

        .edit-competence-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px 8px 12px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border-radius: 40px;
          animation: fadeInScale 0.3s ease;
          box-shadow: 0 2px 8px rgba(93, 58, 26, 0.2);
          transition: all 0.2s ease;
        }

        .edit-competence-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(93, 58, 26, 0.3);
        }

        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        .edit-competence-item .comp-icon {
          color: #ffd966;
          font-size: 12px;
        }

        .edit-competence-item .comp-name {
          color: white;
          font-size: 13px;
          font-weight: 600;
        }

        .edit-competence-item .comp-level-select {
          font-size: 10px;
          padding: 3px 10px;
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.12);
          color: white;
          cursor: pointer;
          outline: none;
          font-weight: 600;
          transition: all 0.2s;
        }

        .edit-competence-item .comp-level-select:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .edit-competence-item .comp-level-select option {
          background: #5D3A1A;
          color: white;
        }

        .edit-competence-item .remove-comp-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0 4px;
          font-size: 14px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          width: 22px;
          height: 22px;
        }

        .edit-competence-item .remove-comp-btn:hover {
          color: #ff6b6b;
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.15);
        }

        .edit-competences-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 16px;
          color: #94a3b8;
        }

        .edit-competences-empty i {
          font-size: 28px;
          color: #cbd5e1;
          margin-bottom: 6px;
        }

        .edit-competences-empty span {
          font-size: 14px;
          font-weight: 500;
        }

        .edit-competences-empty .empty-sub {
          font-size: 12px;
          font-weight: 400;
          color: #b0bec5;
          margin-top: 2px;
        }

        .edit-add-competence {
          margin-top: 16px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          border: 1px solid #eef2f0;
        }

        .edit-add-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .edit-add-header i {
          color: #8B5A2B;
          font-size: 16px;
        }

        .edit-add-fields {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .form-select-edit {
          flex: 1;
          min-width: 150px;
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          background: white;
          transition: all 0.2s;
          color: #1a1a1a;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 38px;
        }

        .form-select-edit:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
        }

        .form-select-edit.niveau-select {
          flex: 0.6;
          min-width: 120px;
        }

        .btn-add-competence-edit {
          padding: 10px 24px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .btn-add-competence-edit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(93, 58, 26, 0.3);
        }

        .btn-add-competence-edit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-refresh-edit {
          padding: 8px 16px;
          background: white;
          color: #475569;
          border: 1px solid #e2e8f0;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-refresh-edit:hover {
          background: #f1f5f9;
          border-color: #8B5A2B;
          color: #8B5A2B;
          transform: translateY(-1px);
        }

        .btn-refresh-edit i {
          font-size: 13px;
        }

        .form-label-edit {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-label-edit i {
          color: #8B5A2B;
          font-size: 14px;
          width: 18px;
        }

        /* FOOTER */
        .footer {
          background: #1a1a1a;
          padding: 60px 32px 32px;
          margin-top: 60px;
          width: 100%;
        }
        .footer-container { max-width: 1280px; margin: 0 auto; }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 60px;
          margin-bottom: 48px;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .footer-logo span { font-size: 22px; font-weight: 800; color: white; }
        .footer-logo span span { color: #8B5A2B; }
        .footer-brand p { color: #a0b0a0; font-size: 13px; line-height: 1.6; margin-bottom: 24px; }
        .social-links { display: flex; gap: 12px; }
        .social-links a {
          width: 36px;
          height: 36px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          transition: all 0.2s;
        }
        .social-links a:hover { background: #8B5A2B; color: #1a1a1a; }
        .footer-links h4 { color: white; margin-bottom: 20px; font-size: 16px; }
        .footer-links a {
          display: block;
          color: #a0b0a0;
          text-decoration: none;
          font-size: 13px;
          margin-bottom: 12px;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: #8B5A2B; }
        .footer-bottom {
          text-align: center;
          padding-top: 32px;
          border-top: 1px solid rgba(255,255,255,0.1);
          font-size: 12px;
          color: #a0b0a0;
        }

        @media (max-width: 1200px) {
          .search-wrapper-offres { padding: 0 40px; }
          .content-wrapper { padding: 0 40px 60px; }
          .offres-grid-premium { grid-template-columns: repeat(2, 1fr); }
          .why-section { padding: 60px 40px; }
          .why-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 40px; }
          .offres-grid-premium { grid-template-columns: 1fr; }
          .search-card-offres { flex-direction: column; border-radius: 32px; padding: 16px; }
          .search-field-offres { width: 100%; }
          .filter-chips-offres { width: 100%; justify-content: center; }
          .clear-search-offres { position: absolute; right: 55px; top: 25px; }
          .why-grid { grid-template-columns: 1fr 1fr; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
        }
        @media (max-width: 768px) {
          .offres-grid-premium { grid-template-columns: 1fr; }
          .why-grid { grid-template-columns: 1fr; }
          .why-section { padding: 40px 20px; }
          .why-section h2 { font-size: 28px; }
          .stats-grid { padding: 20px; }
          .add-existing-competence-fields {
            flex-direction: column;
            align-items: stretch;
          }
          .add-existing-competence-fields .form-select-premium {
            min-width: auto;
          }
          .add-existing-competence-fields .niveau-select {
            min-width: auto;
          }
          .btn-add-existing-competence {
            justify-content: center;
          }
          .edit-add-fields {
            flex-direction: column;
            align-items: stretch;
          }
          .edit-add-fields .form-select-edit {
            min-width: auto;
          }
          .edit-add-fields .niveau-select {
            min-width: auto;
          }
          .btn-add-competence-edit {
            justify-content: center;
          }
          .edit-competences-toolbar {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
          .edit-competences-list {
            padding: 12px;
            gap: 8px;
          }
          .edit-competence-item {
            padding: 6px 10px 6px 8px;
            font-size: 12px;
          }
          .edit-competence-item .comp-name {
            font-size: 12px;
          }
        }
        @media (max-width: 480px) {
          .edit-competences-wrapper {
            padding: 12px;
          }
          .edit-competence-item {
            width: 100%;
            justify-content: space-between;
          }
          .edit-competence-item .comp-level-select {
            font-size: 9px;
            padding: 2px 6px;
          }
          .edit-competences-counter .counter-number {
            font-size: 16px;
          }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr; }
          .hero-title { font-size: 36px; }
          .search-wrapper-offres { padding: 0 20px; margin-top: -20px; }
          .filter-chip-offres { padding: 6px 14px; font-size: 11px; }
          .search-field-offres { padding: 12px 20px; }
          .form-row-premium { grid-template-columns: 1fr; }
          .modal-content-premium { padding: 24px; }
          .modal-actions-premium { flex-direction: column; }
          .content-wrapper { padding: 0 16px 40px; }
          .why-section { padding: 30px 16px; }
          .pagination-premium .page-btn { width: 36px; height: 36px; font-size: 12px; }
          .notification-dropdown { width: 300px; right: -60px; }
          .competences-title-modal { flex-direction: column; gap: 10px; align-items: flex-start; }
          .add-competence-modal-content { padding: 20px; }
          .edit-competences-container { padding: 12px; }
        }
      `}</style>

      {/* ========== NAVBAR ========== */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="logo">
            <span>Stage<span>Flow</span></span>
          </Link>
          <div className="nav-links">
            <Link to="/">Accueil</Link>
            <Link to="/offres">Offres</Link>
            {user && <Link to={getDashboardLink()}>Tableau de bord</Link>}
            <Link to="/about">À propos</Link>
          </div>
          <div className="nav-actions">
            {/* ========== NOTIFICATIONS ========== */}
            <div className="notification-wrapper">
              <button 
                className="notification-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <button className="mark-all-read" onClick={markAllAsRead}>
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <i className="fas fa-bell-slash"></i>
                        <p>Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`notification-item ${notif.est_lu ? 'read' : 'unread'}`}
                          onClick={() => {
                            markAsRead(notif.id);
                            if (notif.lien) {
                              navigate(notif.lien);
                              setShowNotifications(false);
                            }
                          }}
                        >
                          <div className="notif-icon">
                            <i className={notif.icone || 'fas fa-bell'}></i>
                          </div>
                          <div className="notif-content">
                            <p className="notif-title">{notif.titre}</p>
                            <p className="notif-message">{notif.message}</p>
                            <span className="notif-time">{new Date(notif.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <button 
                            className="notif-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="notification-footer">
                      <Link to="/notifications">Voir toutes</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ========== USER MENU ========== */}
            {user ? (
              <div className="user-menu">
                <button className="user-btn">
                  <div className="user-avatar">
                    {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
                  </div>
                  <span>{user.prenom}</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className="user-dropdown">
                  <Link to={getDashboardLink()}><i className="fas fa-tachometer-alt"></i> Tableau de bord</Link>
                  <Link to="/profile"><i className="fas fa-user"></i> Mon profil</Link>
                  {user.role === 'recruteur' && (
                    <>
                      <Link to="/gestion-offres" className="active"><i className="fas fa-briefcase"></i> Mes offres</Link>
                      <Link to="/candidatures-reçues"><i className="fas fa-users"></i> Candidatures reçues</Link>
                      <Link to="/entreprise-profile"><i className="fas fa-building"></i> Mon entreprise</Link>
                    </>
                  )}
                  <hr />
                  <button onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Déconnexion</button>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">Connexion</Link>
                <Link to="/register" className="btn-register">Inscription</Link>
              </div>
            )}
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <div style={{ padding: '20px', textAlign: 'right' }}>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#4a5568', padding: '12px', borderRadius: '12px' }}>Accueil</Link>
          <Link to="/offres" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#4a5568', padding: '12px', borderRadius: '12px' }}>Offres</Link>
          <Link to="/gestion-offres" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#8B5A2B', padding: '12px', borderRadius: '12px', background: '#fef3e8' }}>Mes offres</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* ========== HERO PREMIUM ========== */}
      <section className="hero-gestion-premium">
        <div className="hero-gestion-bg"></div>
        <div className="hero-gestion-overlay"></div>
        <div className="hero-gestion-container">
          <div className="hero-gestion-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Gestion des offres
            </div>
            <h1 className="hero-title">
              Mes <span className="hero-name">offres de stage</span>
            </h1>
            <p className="hero-desc">
              Gérez vos offres publiées, modifiez les informations et suivez les candidatures
            </p>
            <div className="hero-buttons">
              <button onClick={() => setShowPublierModal(true)} className="hero-btn hero-btn-primary">
                <i className="fas fa-plus-circle"></i> Publier une offre
              </button>
              <Link to="/candidatures-reçues" className="hero-btn hero-btn-secondary">
                <i className="fas fa-users"></i> Voir les candidatures
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-card-glass">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Total offres</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.publiees}</div>
                <div className="stat-label">Publiées</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.archivees}</div>
                <div className="stat-label">Archivées</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.enAttente}</div>
                <div className="stat-label">En attente</div>
              </div>
            </div>
          </div>
          <div className="hero-avatar">
            <div className="avatar-wrapper">
              <div className="avatar-ring"></div>
              <div className="avatar-circle">
                {randomAvatar ? (
                  <img src={randomAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-initials">
                    <i className="fas fa-briefcase"></i>
                  </div>
                )}
                <div className="avatar-badge">
                  <i className="fas fa-chart-line"></i>
                </div>
              </div>
            </div>
            <div className="hero-quote">
              <i className="fas fa-quote-left"></i> “Publiez et gérez vos offres facilement”
            </div>
          </div>
        </div>
      </section>

      {/* ========== SEARCH BAR ========== */}
      <div className="search-wrapper-offres">
        <div className="search-card-offres">
          <div className="search-field-offres">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Rechercher par titre, ville ou type..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="filter-chips-offres">
            <div 
              className={`filter-chip-offres ${selectedStatus === 'tous' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('tous')}
            >
              <i className="fas fa-list"></i> Toutes
            </div>
            <div 
              className={`filter-chip-offres ${selectedStatus === 'publiée' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('publiée')}
            >
              <i className="fas fa-check-circle"></i> Publiées
            </div>
            <div 
              className={`filter-chip-offres ${selectedStatus === 'archivée' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('archivée')}
            >
              <i className="fas fa-archive"></i> Archivées
            </div>
            <div 
              className={`filter-chip-offres ${selectedStatus === 'en_attente' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('en_attente')}
            >
              <i className="fas fa-clock"></i> En attente
            </div>
          </div>
          {searchTerm && (
            <button className="clear-search-offres" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
          <button className="btn-add-offre-premium" onClick={() => setShowPublierModal(true)}>
            <i className="fas fa-plus-circle"></i> Nouvelle offre
          </button>
        </div>
      </div>

      {/* ========== STATS GRID ========== */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-briefcase"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total offres</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.publiees}</div>
            <div className="stat-label">Publiées</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-archive"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.archivees}</div>
            <div className="stat-label">Archivées</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-clock"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.enAttente}</div>
            <div className="stat-label">En attente</div>
          </div>
        </div>
      </div>

      {/* ========== CONTENT (Offres avec pagination 6 par page) ========== */}
      <div className="content-wrapper">
        <div className="main-content">
          {filteredOffres.length === 0 ? (
            <div className="empty-state-premium">
              <div className="empty-icon-premium">
                <i className="fas fa-briefcase"></i>
              </div>
              <h3 className="empty-title-premium">Aucune offre trouvée</h3>
              <p className="empty-desc-premium">
                {searchTerm || selectedStatus !== 'tous' 
                  ? "Essayez d'autres critères de recherche" 
                  : "Vous n'avez pas encore publié d'offre"}
              </p>
              {!searchTerm && selectedStatus === 'tous' && (
                <button onClick={() => setShowPublierModal(true)} className="btn-add-offre-premium" style={{ display: 'inline-flex' }}>
                  <i className="fas fa-plus-circle"></i> Publier ma première offre
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="offres-grid-premium">
                {currentOffres.map((offre, idx) => (
                  <div 
                    key={offre.idOffre} 
                    className="offre-card-premium" 
                    style={{ animationDelay: `${idx * 0.05}s` }}
                    onClick={() => window.location.href = `/offres/${offre.idOffre}`}
                  >
                    <div className="card-image-premium" style={{ backgroundImage: `url(${getImageForOffre(offre.idOffre)})` }}>
                      <div className="status-badge-premium" style={{ background: getStatusColor(offre.statut) }}>
                        <i className={getStatusIcon(offre.statut)}></i>
                        {getStatusLabel(offre.statut)}
                      </div>
                    </div>
                    <div className="card-content-premium">
                      <h3 className="offre-title-premium">{offre.titre}</h3>
                      <div className="offre-meta-premium">
                        <div className="meta-item-premium">
                          <i className="fas fa-building"></i>
                          <span>{offre.entreprise?.nom || 'Votre entreprise'}</span>
                        </div>
                        <div className="meta-item-premium">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{offre.ville}</span>
                        </div>
                        <div className="meta-item-premium">
                          <i className="fas fa-clock"></i>
                          <span>{offre.duree} mois</span>
                        </div>
                        <div className="meta-item-premium">
                          <i className="fas fa-tag"></i>
                          <span>{offre.typeStage}</span>
                        </div>
                      </div>
                      <div className="card-actions-premium" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-edit-premium" onClick={() => handleEdit(offre)}>
                          <i className="fas fa-edit"></i> Modifier
                        </button>
                        <button className="btn-delete-premium" onClick={() => { setSelectedOffre(offre); setShowDeleteModal(true); }}>
                          <i className="fas fa-trash-alt"></i> Supprimer
                        </button>
                        <button className="btn-statut-premium" onClick={() => handleStatutChange(offre.idOffre, offre.statut === 'publiée' ? 'archivée' : 'publiée')}>
                          <i className={`fas ${offre.statut === 'publiée' ? 'fa-archive' : 'fa-eye'}`}></i>
                          {offre.statut === 'publiée' ? 'Archiver' : 'Publier'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ========== PAGINATION ========== */}
              {totalPages > 1 && (
                <div className="pagination-premium">
                  <button 
                    className="page-btn" 
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => paginate(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button 
                    className="page-btn" 
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========== SECTION POURQUOI CHOISIR STAGEFLOW AVEC IMAGES ========== */}
      <div className="why-section">
        <div className="why-container">
          <div className="why-header">
            <span className="badge">✨ Pourquoi StageFlow</span>
            <h2>La plateforme des recruteurs</h2>
            <p className="subtitle">Des outils puissants pour trouver les meilleurs talents</p>
          </div>
          <div className="why-grid">
            <div className="why-card-with-image" style={{ backgroundImage: `url('${whyImages[0]}')` }}>
              <div className="card-number">01</div>
              <div className="card-content">
                <div className="icon"><i className="fas fa-robot"></i></div>
                <h4>IA Intelligente</h4>
                <p>Recommandations personnalisées basées sur les compétences et les besoins</p>
              </div>
            </div>
            <div className="why-card-with-image" style={{ backgroundImage: `url('${whyImages[1]}')` }}>
              <div className="card-number">02</div>
              <div className="card-content">
                <div className="icon"><i className="fas fa-bolt"></i></div>
                <h4>Gestion simplifiée</h4>
                <p>Publiez, modifiez et suivez toutes vos offres en un seul endroit</p>
              </div>
            </div>
            <div className="why-card-with-image" style={{ backgroundImage: `url('${whyImages[2]}')` }}>
              <div className="card-number">03</div>
              <div className="card-content">
                <div className="icon"><i className="fas fa-users"></i></div>
                <h4>Talents qualifiés</h4>
                <p>Accédez à un vivier d'étudiants compétents et motivés</p>
              </div>
            </div>
            <div className="why-card-with-image" style={{ backgroundImage: `url('${whyImages[3]}')` }}>
              <div className="card-number">04</div>
              <div className="card-content">
                <div className="icon"><i className="fas fa-chart-line"></i></div>
                <h4>Statistiques avancées</h4>
                <p>Analysez la performance de vos offres et optimisez vos recrutements</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== SECTION ASTUCES POUR VOS OFFRES ========== */}
      <div className="tips-section">
        <div className="tips-container">
          <div className="tips-header">
            <span className="badge">💡 Astuces</span>
            <h2>Optimisez vos offres</h2>
            <p>Conseils pour attirer les meilleurs talents</p>
          </div>
          <div className="tips-grid">
            <div className="tip-card" style={{ backgroundImage: `url('${tipImages[0]}')` }}>
              <div className="tip-number">01</div>
              <div className="tip-content">
                <div className="tip-icon"><i className="fas fa-bullseye"></i></div>
                <h4>Soyez précis</h4>
                <p>Décrivez clairement les missions, les compétences requises et les avantages du stage.</p>
              </div>
            </div>

            <div className="tip-card" style={{ backgroundImage: `url('${tipImages[1]}')` }}>
              <div className="tip-number">02</div>
              <div className="tip-content">
                <div className="tip-icon"><i className="fas fa-rocket"></i></div>
                <h4>Mettez en avant</h4>
                <p>Parlez des perspectives d'évolution, des formations et des projets passionnants.</p>
              </div>
            </div>

            <div className="tip-card" style={{ backgroundImage: `url('${tipImages[2]}')` }}>
              <div className="tip-number">03</div>
              <div className="tip-content">
                <div className="tip-icon"><i className="fas fa-heart"></i></div>
                <h4>Culture d'entreprise</h4>
                <p>Partagez vos valeurs, l'ambiance de travail et ce qui rend votre entreprise unique.</p>
              </div>
            </div>

            <div className="tip-card" style={{ backgroundImage: `url('${tipImages[3]}')` }}>
              <div className="tip-number">04</div>
              <div className="tip-content">
                <div className="tip-icon"><i className="fas fa-users"></i></div>
                <h4>Équipe dynamique</h4>
                <p>Une ambiance de travail stimulante avec des collaborateurs passionnés.</p>
              </div>
            </div>

            <div className="tip-card" style={{ backgroundImage: `url('${tipImages[4]}')` }}>
              <div className="tip-number">05</div>
              <div className="tip-content">
                <div className="tip-icon"><i className="fas fa-graduation-cap"></i></div>
                <h4>Formation continue</h4>
                <p>Des opportunités d'apprentissage et de développement professionnel.</p>
              </div>
            </div>

            <div className="tip-card" style={{ backgroundImage: `url('${tipImages[5]}')` }}>
              <div className="tip-number">06</div>
              <div className="tip-content">
                <div className="tip-icon"><i className="fas fa-handshake"></i></div>
                <h4>Accompagnement</h4>
                <p>Un mentor dédié pour vous guider et vous aider à progresser.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MODALS ========== */}
      {showDeleteModal && selectedOffre && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h2>Confirmer la suppression</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>&times;</button>
            </div>
            <p style={{ marginBottom: '20px', color: '#64748b' }}>
              Êtes-vous sûr de vouloir supprimer l'offre <strong>"{selectedOffre.titre}"</strong> ? Cette action est irréversible.
            </p>
            <div className="modal-actions-premium">
              <button className="btn-confirm-danger-premium" onClick={handleDelete}>Supprimer</button>
              <button className="btn-cancel-premium" onClick={() => setShowDeleteModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL ÉDITION AVEC DESIGN AMÉLIORÉ ========== */}
      {showEditModal && selectedOffre && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h2>
                <i className="fas fa-edit" style={{ color: '#8B5A2B' }}></i> 
                Modifier l'offre
              </h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdate} className="edit-form">
              <div className="form-group-premium">
                <label className="form-label-edit">
                  <i className="fas fa-heading"></i> Titre
                </label>
                <input type="text" value={editForm.titre} onChange={(e) => setEditForm({...editForm, titre: e.target.value})} required />
              </div>

              <div className="form-group-premium">
                <label className="form-label-edit">
                  <i className="fas fa-align-left"></i> Description
                </label>
                <textarea rows="4" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} required />
              </div>

              <div className="form-row-premium">
                <div className="form-group-premium">
                  <label className="form-label-edit">
                    <i className="fas fa-map-marker-alt"></i> Ville
                  </label>
                  <input type="text" value={editForm.ville} onChange={(e) => setEditForm({...editForm, ville: e.target.value})} required />
                </div>
                <div className="form-group-premium">
                  <label className="form-label-edit">
                    <i className="fas fa-clock"></i> Durée (mois)
                  </label>
                  <input type="number" value={editForm.duree} onChange={(e) => setEditForm({...editForm, duree: e.target.value})} required />
                </div>
              </div>

              <div className="form-row-premium">
                <div className="form-group-premium">
                  <label className="form-label-edit">
                    <i className="fas fa-tag"></i> Type de stage
                  </label>
                  <select value={editForm.typeStage} onChange={(e) => setEditForm({...editForm, typeStage: e.target.value})}>
                    <option value="PFE">PFE</option>
                    <option value="stage été">Stage été</option>
                    <option value="stage observation">Stage observation</option>
                    <option value="Alternance">Alternance</option>
                  </select>
                </div>
                <div className="form-group-premium">
                  <label className="form-label-edit">
                    <i className="fas fa-calendar-alt"></i> Date limite
                  </label>
                  <input type="date" value={editForm.dateLimite} onChange={(e) => setEditForm({...editForm, dateLimite: e.target.value})} required />
                </div>
              </div>

              <div className="form-group-premium">
                <label className="form-label-edit">
                  <i className="fas fa-toggle-on"></i> Statut
                </label>
                <select value={editForm.statut} onChange={(e) => setEditForm({...editForm, statut: e.target.value})}>
                  <option value="publiée">📢 Publiée</option>
                  <option value="archivée">📦 Archivée</option>
                  <option value="en_attente">⏳ En attente</option>
                </select>
              </div>

              {/* ========== SECTION COMPÉTENCES DESIGN AMÉLIORÉ ========== */}
              <div className="form-group-premium">
                <label className="form-label-edit">
                  <i className="fas fa-code"></i> Compétences requises
                </label>

                <div className="edit-competences-wrapper">
                  <div className="edit-competences-toolbar">
                    <div className="edit-competences-counter">
                      <span className="counter-number">{selectedCompetences.length}</span>
                      <span className="counter-text">compétence{selectedCompetences.length > 1 ? 's' : ''}</span>
                    </div>
                    <button 
                      type="button" 
                      className="btn-refresh-edit"
                      onClick={async () => {
                        try {
                          const response = await api.get(`/offres/${selectedOffre.idOffre}`);
                          const offreDetails = response.data;
                          if (offreDetails.competences && offreDetails.competences.length > 0) {
                            const comps = offreDetails.competences.map(c => ({
                              id: c.idCompetence || c.id,
                              niveau: c.pivot?.niveau || c.niveau || 'intermédiaire'
                            }));
                            setSelectedCompetences(comps);
                            toast.success('Compétences rechargées !');
                          } else {
                            setSelectedCompetences([]);
                            toast.info('Aucune compétence trouvée');
                          }
                        } catch (error) {
                          toast.error('Erreur lors du rechargement');
                        }
                      }}
                    >
                      <i className="fas fa-sync-alt"></i> Rafraîchir
                    </button>
                  </div>

                  <div className="edit-competences-list">
                    {selectedCompetences.length > 0 ? (
                      selectedCompetences.map(selected => {
                        const comp = competences.find(c => c.idCompetence === selected.id);
                        return comp ? (
                          <div key={selected.id} className="edit-competence-item">
                            <span className="comp-icon">
                              <i className="fas fa-check-circle"></i>
                            </span>
                            <span className="comp-name">{comp.nom}</span>
                            <select 
                              className="comp-level-select"
                              value={selected.niveau || 'intermédiaire'}
                              onChange={(e) => {
                                setSelectedCompetences(selectedCompetences.map(s => 
                                  s.id === selected.id ? { ...s, niveau: e.target.value } : s
                                ));
                              }}
                            >
                              <option value="débutant">🟢 Débutant</option>
                              <option value="intermédiaire">🟡 Intermédiaire</option>
                              <option value="avancé">🟠 Avancé</option>
                              <option value="expert">🔴 Expert</option>
                            </select>
                            <button 
                              type="button" 
                              className="remove-comp-btn"
                              onClick={() => {
                                setSelectedCompetences(selectedCompetences.filter(s => s.id !== selected.id));
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <div className="edit-competences-empty">
                        <i className="fas fa-code"></i>
                        <span>Aucune compétence sélectionnée</span>
                        <span className="empty-sub">Ajoutez des compétences ci-dessous</span>
                      </div>
                    )}
                  </div>

                  <div className="edit-add-competence">
                    <div className="edit-add-header">
                      <i className="fas fa-plus-circle"></i>
                      <span>Ajouter une compétence</span>
                    </div>
                    <div className="edit-add-fields">
                      <select 
                        className="form-select-edit"
                        value={editSelectedCompetence || ''}
                        onChange={(e) => setEditSelectedCompetence(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Choisir une compétence...</option>
                        {competences
                          .filter(c => !selectedCompetences.some(s => s.id === c.idCompetence))
                          .map(c => (
                            <option key={c.idCompetence} value={c.idCompetence}>
                              {c.nom} 
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {c.categorie ? ` - ${c.categorie}` : ''}
                              </span>
                            </option>
                          ))}
                      </select>
                      
                      <select 
                        className="form-select-edit niveau-select"
                        value={editTempNiveau}
                        onChange={(e) => setEditTempNiveau(e.target.value)}
                      >
                        <option value="débutant">🟢 Débutant</option>
                        <option value="intermédiaire">🟡 Intermédiaire</option>
                        <option value="avancé">🟠 Avancé</option>
                        <option value="expert">🔴 Expert</option>
                      </select>
                      
                      <button 
                        type="button" 
                        className="btn-add-competence-edit"
                        onClick={handleAddEditCompetence}
                        disabled={!editSelectedCompetence}
                      >
                        <i className="fas fa-plus"></i> Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions-premium">
                <button type="button" className="btn-cancel-premium" onClick={() => setShowEditModal(false)}>
                  <i className="fas fa-times"></i> Annuler
                </button>
                <button type="submit" className="btn-confirm-premium" disabled={editLoading}>
                  {editLoading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
                  ) : (
                    <><i className="fas fa-save"></i> Enregistrer les modifications</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPublierModal && (
        <div className="modal-overlay" onClick={() => setShowPublierModal(false)}>
          <div className="modal-content-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h2><i className="fas fa-plus-circle"></i> Publier une offre</h2>
              <button className="modal-close" onClick={() => setShowPublierModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handlePublierOffre}>
              <div className="form-group-premium">
                <label>Titre de l'offre <span>*</span></label>
                <input
                  type="text"
                  placeholder="Ex: Développeur Full Stack - Stage PFE"
                  value={newOffre.titre}
                  onChange={(e) => setNewOffre({...newOffre, titre: e.target.value})}
                  required
                />
              </div>

              <div className="form-group-premium">
                <label>Description <span>*</span></label>
                <textarea
                  rows="4"
                  placeholder="Décrivez les missions, le profil recherché, les conditions du stage..."
                  value={newOffre.description}
                  onChange={(e) => setNewOffre({...newOffre, description: e.target.value})}
                  required
                />
              </div>

              <div className="form-row-premium">
                <div className="form-group-premium">
                  <label>Ville <span>*</span></label>
                  <input
                    type="text"
                    placeholder="Ex: Casablanca, Rabat, Télétravail..."
                    value={newOffre.ville}
                    onChange={(e) => setNewOffre({...newOffre, ville: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group-premium">
                  <label>Durée (mois) <span>*</span></label>
                  <input
                    type="number"
                    placeholder="Ex: 6"
                    value={newOffre.duree}
                    onChange={(e) => setNewOffre({...newOffre, duree: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row-premium">
                <div className="form-group-premium">
                  <label>Type de stage <span>*</span></label>
                  <select value={newOffre.typeStage} onChange={(e) => setNewOffre({...newOffre, typeStage: e.target.value})}>
                    <option value="PFE">PFE - Projet de Fin d'Études</option>
                    <option value="stage été">Stage d'été</option>
                    <option value="stage observation">Stage d'observation</option>
                    <option value="Alternance">Alternance</option>
                  </select>
                </div>
                <div className="form-group-premium">
                  <label>Date limite <span>*</span></label>
                  <input
                    type="date"
                    value={newOffre.dateLimite}
                    onChange={(e) => setNewOffre({...newOffre, dateLimite: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* ========== SECTION COMPÉTENCES AVEC SÉLECTION ET NIVEAU ========== */}
              <div className="competences-section-modal">
                <div className="competences-title-modal">
                  <span><i className="fas fa-code"></i> Compétences requises</span>
                  <button 
                    type="button" 
                    className="add-competence-btn"
                    onClick={() => setShowAddCompetenceModal(true)}
                  >
                    <i className="fas fa-plus"></i> Nouvelle compétence
                  </button>
                </div>

                <div className="add-existing-competence-row">
                  <div className="add-existing-competence-fields">
                    <select 
                      className="form-select-premium"
                      value={selectedExistingCompetence || ''}
                      onChange={(e) => setSelectedExistingCompetence(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">Sélectionner une compétence...</option>
                      {competencesList
                        .filter(c => !selectedCompetencesPublier.some(s => s.id === c.idCompetence))
                        .map(c => (
                          <option key={c.idCompetence} value={c.idCompetence}>
                            {c.nom} - {c.categorie}
                          </option>
                        ))}
                    </select>
                    
                    <select 
                      className="form-select-premium niveau-select"
                      value={tempNiveau}
                      onChange={(e) => setTempNiveau(e.target.value)}
                    >
                      <option value="débutant">🟢 Débutant</option>
                      <option value="intermédiaire">🟡 Intermédiaire</option>
                      <option value="avancé">🟠 Avancé</option>
                      <option value="expert">🔴 Expert</option>
                    </select>
                    
                    <button 
                      type="button" 
                      className="btn-add-existing-competence"
                      onClick={handleAddExistingCompetence}
                      disabled={!selectedExistingCompetence}
                    >
                      <i className="fas fa-plus"></i> Ajouter
                    </button>
                  </div>
                </div>

                <div className="competences-grid-modal">
                  {selectedCompetencesPublier.map(selected => {
                    const comp = competencesList.find(c => c.idCompetence === selected.id);
                    return comp ? (
                      <div key={selected.id} className="competence-chip-premium selected">
                        <i className="fas fa-check-circle"></i>
                        {comp.nom}
                        <select 
                          className="competence-level-select"
                          value={selected.niveau}
                          onChange={(e) => {
                            setSelectedCompetencesPublier(selectedCompetencesPublier.map(s => 
                              s.id === selected.id ? { ...s, niveau: e.target.value } : s
                            ));
                          }}
                        >
                          <option value="débutant">Débutant</option>
                          <option value="intermédiaire">Intermédiaire</option>
                          <option value="avancé">Avancé</option>
                          <option value="expert">Expert</option>
                        </select>
                        <button 
                          type="button" 
                          className="remove-competence-btn"
                          onClick={() => {
                            setSelectedCompetencesPublier(selectedCompetencesPublier.filter(s => s.id !== selected.id));
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>

                {competencesList.length === 0 && (
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '8px' }}>
                    <i className="fas fa-info-circle"></i> Aucune compétence disponible. Cliquez sur "Nouvelle compétence" pour en ajouter.
                  </p>
                )}
              </div>

              <div className="modal-actions-premium">
                <button type="button" className="btn-cancel-premium" onClick={() => setShowPublierModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-confirm-premium" disabled={publierLoading}>
                  {publierLoading ? <><i className="fas fa-spinner fa-spin"></i> Publication...</> : <><i className="fas fa-paper-plane"></i> Publier l'offre</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL AJOUT COMPÉTENCE AVEC CATÉGORIES PRÉDÉFINIES ET NIVEAU ========== */}
      {showAddCompetenceModal && (
        <div className="modal-overlay" onClick={() => {
          if (!addingCompetence) {
            setShowAddCompetenceModal(false);
            setNewCompetence({ nom: '', categorie: '', niveau: 'intermédiaire' });
          }
        }}>
          <div className="modal-content-premium add-competence-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h2><i className="fas fa-plus-circle" style={{ color: '#8B5A2B' }}></i> Ajouter une compétence</h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  if (!addingCompetence) {
                    setShowAddCompetenceModal(false);
                    setNewCompetence({ nom: '', categorie: '', niveau: 'intermédiaire' });
                  }
                }}
                disabled={addingCompetence}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddCompetence}>
              <div className="form-group-premium">
                <label>Nom de la compétence <span>*</span></label>
                <input
                  type="text"
                  placeholder="Ex: React.js, Python, Gestion de projet..."
                  value={newCompetence.nom}
                  onChange={(e) => setNewCompetence({...newCompetence, nom: e.target.value})}
                  required
                  disabled={addingCompetence}
                />
              </div>

              {/* ========== CATÉGORIE AVEC OPTIONS PRÉDÉFINIES ========== */}
              <div className="form-group-premium">
                <label>Catégorie <span>*</span></label>
                <select 
                  value={newCompetence.categorie} 
                  onChange={(e) => setNewCompetence({...newCompetence, categorie: e.target.value})}
                  disabled={addingCompetence}
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
                <small>
                  <i className="fas fa-info-circle"></i> Choisissez la catégorie qui correspond le mieux à cette compétence
                </small>
              </div>

              {/* CHAMP NIVEAU */}
              <div className="form-group-premium">
                <label>Votre niveau <span>*</span></label>
                <select 
                  value={newCompetence.niveau} 
                  onChange={(e) => setNewCompetence({...newCompetence, niveau: e.target.value})}
                  disabled={addingCompetence}
                  required
                >
                  <option value="débutant">🟢 Débutant</option>
                  <option value="intermédiaire">🟡 Intermédiaire</option>
                  <option value="avancé">🟠 Avancé</option>
                  <option value="expert">🔴 Expert</option>
                </select>
                <small>
                  <i className="fas fa-info-circle"></i> Sélectionnez votre niveau de maîtrise pour cette compétence
                </small>
              </div>

              <div className="modal-actions-premium">
                <button 
                  type="button" 
                  className="btn-cancel-premium" 
                  onClick={() => {
                    if (!addingCompetence) {
                      setShowAddCompetenceModal(false);
                      setNewCompetence({ nom: '', categorie: '', niveau: 'intermédiaire' });
                    }
                  }}
                  disabled={addingCompetence}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-confirm-premium" disabled={addingCompetence}>
                  {addingCompetence ? <><i className="fas fa-spinner fa-spin"></i> Ajout...</> : <><i className="fas fa-check"></i> Ajouter</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== FOOTER ========== */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 2L20 8L28 10L22 18L22 26L16 30L10 26L10 18L4 10L12 8L16 2Z" fill="#8B5A2B"/>
                  <path d="M16 8L18 12L22 13L20 16L20 22L16 24L12 22L12 16L10 13L14 12L16 8Z" fill="#5D3A1A"/>
                </svg>
                <span>Stage<span>Flow</span></span>
              </div>
              <p>La plateforme intelligente de gestion et recommandation de stages.</p>
              <div className="social-links">
                <a href="#"><i className="fab fa-linkedin-in"></i></a>
                <a href="#"><i className="fab fa-twitter"></i></a>
                <a href="#"><i className="fab fa-facebook-f"></i></a>
                <a href="#"><i className="fab fa-instagram"></i></a>
              </div>
            </div>
            <div className="footer-links">
              <h4>Navigation</h4>
              <Link to="/">Accueil</Link>
              <Link to="/offres">Offres</Link>
            </div>
            <div className="footer-links">
              <h4>Mon compte</h4>
              <Link to="/profile">Mon profil</Link>
              <Link to="/gestion-offres">Mes offres</Link>
              <Link to="/candidatures-reçues">Candidatures reçues</Link>
            </div>
            <div className="footer-links">
              <h4>Suivez-nous</h4>
              <a href="#"><i className="fab fa-linkedin"></i> LinkedIn</a>
              <a href="#"><i className="fab fa-twitter"></i> Twitter</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 StageFlow – Université Cadi Ayyad, Marrakech</p>
          </div>
        </div>
      </footer>
    </div>
  );
}