import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

// Images pour l'avatar aléatoire (fallback)
const avatarImages = [
  '/images/formation1.png', '/images/formation2.png', '/images/formation3.png',
  '/images/formation4.png', '/images/formation5.png', '/images/formation6.png',
  '/images/formation8.png', '/images/formation9.png', '/images/formation10.png',
  '/images/fomration7.png',
];

export default function DashboardRecruteur() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [stats, setStats] = useState({
    totalOffres: 0,
    totalCandidatures: 0,
    enAttente: 0,
    acceptees: 0,
    refusees: 0,
    tauxAcceptation: 0
  });
  const [recentOffres, setRecentOffres] = useState([]);
  const [recentCandidatures, setRecentCandidatures] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('week');
  const [candidaturesParJour, setCandidaturesParJour] = useState([]);

  // ========== ÉTATS POUR LES NOTIFICATIONS ==========
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // ========== ÉTATS POUR LE MODAL DE PUBLICATION (AVEC NIVEAU ET CATÉGORIE) ==========
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

  // Base d'images pour les cartes
  const baseImages = [
    '/images/do.png', '/images/do1.png', '/images/do2.png', '/images/do3.png',
    '/images/do4.png', '/images/do5.png', '/images/do6.png', '/images/do7.png',
    '/images/do8.png', '/images/do9.png', '/images/doo.png', '/images/doo1.png',
    '/images/doo2.png', '/images/doo3.png', '/images/doo4.png', '/images/doo5.png',
  ];

  // Images pour les nouvelles sections
  const insightsImages = [
    '/images/why1.png',
    '/images/why2.png',
    '/images/why3.png',
    '/images/why4.png',
  ];

  const testimonialImages = [
    '/images/t4.png',
    '/images/t5.png',
    '/images/t6.png',
  ];

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    fetchCompetencesList();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (showPublierModal) {
      fetchCompetencesList();
    }
  }, [showPublierModal]);

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

  // ========== FONCTION POUR AJOUTER UNE COMPÉTENCE EXISTANTE AVEC NIVEAU ==========
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Récupérer les informations de l'entreprise du recruteur
      try {
        const entrepriseRes = await api.get('/recruteur/entreprise');
        if (entrepriseRes.data) {
          setCompanyName(entrepriseRes.data.nom || 'Mon entreprise');
          if (entrepriseRes.data.logo) {
            setCompanyLogo(entrepriseRes.data.logo);
          }
        }
      } catch (error) {
        console.error('Erreur chargement entreprise:', error);
        setCompanyName(user?.recruteur?.entreprise?.nom || 'Mon entreprise');
      }

      // Récupérer les offres de l'entreprise
      const offresRes = await api.get('/recruteur/offres');
      const offres = offresRes.data.data || offresRes.data || [];
      setRecentOffres(offres.slice(0, 5));

      // Récupérer les candidatures
      const candidaturesRes = await api.get('/recruteur/candidatures');
      const candidatures = candidaturesRes.data.data || candidaturesRes.data || [];
      setRecentCandidatures(candidatures.slice(0, 5));

      // Calculer les statistiques
      const enAttente = candidatures.filter(c => c.statut === 'en_attente').length;
      const acceptees = candidatures.filter(c => c.statut === 'acceptée').length;
      const refusees = candidatures.filter(c => c.statut === 'refusée').length;
      const totalCandidatures = candidatures.length;
      const tauxAcceptation = totalCandidatures > 0 ? Math.round((acceptees / totalCandidatures) * 100) : 0;

      setStats({
        totalOffres: offres.length,
        totalCandidatures,
        enAttente,
        acceptees,
        refusees,
        tauxAcceptation
      });

      // Simuler des données de candidatures par jour pour le graphique
      const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      const dataParJour = jours.map(() => Math.floor(Math.random() * 10));
      setCandidaturesParJour(dataParJour);

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
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
      fetchDashboardData();
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
          <p className="mt-6 text-gray-600 font-medium">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-recruteur">
      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .dashboard-recruteur {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
          color: #1a1a1a;
          overflow-x: hidden;
          width: 100%;
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
        .user-avatar-nav {
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

        /* ========== HERO DASHBOARD PREMIUM ========== */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-dashboard-premium {
          position: relative;
          min-height: 850px;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding-top: 50px;
        }
        .hero-dashboard-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/doo.png');
          background-size: cover;
          background-position: center;
          z-index: 0;
        }
        .hero-dashboard-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%);
          z-index: 1;
        }
        .hero-dashboard-container {
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
        .hero-dashboard-content {
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
          letter-spacing: 0.5px;
        }
        .badge-dot {
          width: 8px;
          height: 8px;
          background: #ffd966;
          border-radius: 50%;
          animation: pulse 2s infinite;
          box-shadow: 0 0 6px #ffd966;
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
        .hero-btn i { font-size: 16px; transition: transform 0.2s; }
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
        .hero-btn-outline {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: white;
        }
        .hero-btn-outline:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-3px);
          border-color: white;
        }
        .hero-btn-light {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
        }
        .hero-btn-light:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: translateY(-3px);
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
          .hero-dashboard-container { flex-direction: column; text-align: center; gap: 50px; }
          .hero-desc { margin-left: auto; margin-right: auto; }
          .hero-buttons { justify-content: center; }
          .hero-stats { justify-content: center; }
          .avatar-wrapper { width: 200px; height: 200px; }
          .avatar-initials { font-size: 48px; }
          .hero-title { font-size: 42px; }
        }
        @media (max-width: 700px) {
          .hero-title { font-size: 32px; }
          .avatar-wrapper { width: 160px; height: 160px; }
          .avatar-initials { font-size: 38px; }
          .hero-btn { padding: 8px 20px; font-size: 12px; }
        }

        /* ========== STATS GRID PREMIUM AVEC IMAGES ========== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
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
        .stat-card:nth-child(1) { background-image: url('images/s1.png'); }
        .stat-card:nth-child(2) { background-image: url('images/s2.png'); }
        .stat-card:nth-child(3) { background-image: url('images/s3.png'); }
        .stat-card:nth-child(4) { background-image: url('images/s4.png'); }
        .stat-card:nth-child(5) { background-image: url('images/doo5.png'); }
        .stat-card:nth-child(6) { background-image: url('images/doo4.png'); }
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
        .stat-number { font-size: 36px; font-weight: 800; color: #0f172a; line-height: 1.2; letter-spacing: -1px; margin-bottom: 6px; }
        .stat-label { font-size: 14px; font-weight: 500; color: #64748b; letter-spacing: -0.2px; }
        .stat-trend {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px solid #eef2f0;
          color: #10b981;
        }
        .stat-trend i { font-size: 12px; }
        .stat-trend.negative { color: #ef4444; }

        /* ========== DASHBOARD LAYOUT ========== */
        .dashboard-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 90px 60px;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 48px;
        }
        .dashboard-card {
          background: white;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
          border: 1px solid #f0f2f5;
          transition: all 0.3s ease;
        }
        .dashboard-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 40px -12px rgba(0,0,0,0.12);
        }
        .card-header {
          padding: 24px 28px;
          border-bottom: 1px solid #eef2f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
        }
        .card-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .card-header h3 i { color: #8B5A2B; }
        .btn-link {
          color: #8B5A2B;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: gap 0.2s;
        }
        .btn-link:hover { gap: 10px; }

        /* Chart */
        .chart-container { margin-top: 20px; padding: 0 20px 20px; }
        .chart-bars {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 200px;
          gap: 12px;
          margin-bottom: 16px;
        }
        .chart-bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .chart-bar {
          width: 100%;
          background: linear-gradient(180deg, #8B5A2B, #5D3A1A);
          border-radius: 8px 8px 4px 4px;
          transition: height 0.5s ease;
          min-height: 4px;
        }
        .chart-label {
          font-size: 11px;
          color: #64748b;
          text-align: center;
        }
        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #eef2f0;
        }
        .period-buttons {
          display: flex;
          gap: 8px;
        }
        .period-btn {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        .period-btn.active {
          background: #8B5A2B;
          color: white;
          border-color: #8B5A2B;
        }

        /* Offers & Candidatures Lists */
        .offers-list, .candidatures-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
        }
        .offer-item, .candidature-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8fafc;
          border-radius: 16px;
          transition: all 0.3s;
          text-decoration: none;
          color: inherit;
        }
        .offer-item:hover, .candidature-item:hover {
          background: #fef3e8;
          transform: translateX(4px);
        }
        .offer-info h4, .candidature-info h4 {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .offer-info p, .candidature-info p {
          font-size: 12px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .offer-stats {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .candidature-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        .candidature-badge.en-attente { background: #fef3c7; color: #92400e; }
        .candidature-badge.acceptee { background: #f0fdf4; color: #10b981; }
        .candidature-badge.refusee { background: #fee2e2; color: #dc2626; }
        .offer-count {
          font-size: 13px;
          font-weight: 700;
          background: #eef2f0;
          padding: 4px 10px;
          border-radius: 20px;
        }

        /* Empty State */
        .empty-state-card {
          text-align: center;
          padding: 48px 24px;
        }
        .empty-icon {
          width: 80px;
          height: 80px;
          background: #fef3e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .empty-icon i { font-size: 36px; color: #8B5A2B; }
        .empty-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .empty-desc { font-size: 13px; color: #64748b; margin-bottom: 20px; }
        .btn-primary-sm {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 40px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary-sm:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(93,58,26,0.3);
          gap: 12px;
        }

        /* Quick Actions */
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .quick-action-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          text-align: center;
          text-decoration: none;
          transition: all 0.3s;
          border: 1px solid #eef2f0;
        }
        .quick-action-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
          border-color: transparent;
        }
        .quick-action-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #fef3e8, #fff5ed);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .quick-action-icon i { font-size: 28px; color: #8B5A2B; }
        .quick-action-card h4 { font-size: 16px; font-weight: 700; margin-bottom: 6px; color: #0f172a; }
        .quick-action-card p { font-size: 12px; color: #64748b; }

        /* ========== MODAL PUBLIER OFFRE AVEC NIVEAU ET CATÉGORIE ========== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
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
        .modal-header-premium h2 i { color: #8B5A2B; }
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

        .competence-chip-modal {
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

        .competence-chip-modal:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .competence-chip-modal.selected {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border-color: #8B5A2B;
        }

        .competence-chip-modal i { font-size: 12px; }

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

        .modal-actions-premium {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-submit-premium {
          flex: 1;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 16px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-submit-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(93, 58, 26, 0.3);
        }
        .btn-submit-premium:disabled {
          opacity: 0.6;
          transform: none;
        }
        .btn-cancel-premium {
          flex: 1;
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 14px;
          border-radius: 16px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel-premium:hover { background: #e2e8f0; }

        /* ========== SECTION INSIGHTS REDESIGN AVEC IMAGES BACKGROUND ========== */
        .insights-section {
          position: relative;
          padding: 80px 32px;
          overflow: hidden;
          min-height: 500px;
        }

        .insights-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/home1.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }

        .insights-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.85) 0%, rgba(0, 0, 0, 0.75) 100%);
          z-index: 1;
        }

        .insights-container {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .insights-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .insights-badge {
          display: inline-block;
          background: rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(4px);
          padding: 8px 24px;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 600;
          color: #ffd966;
          letter-spacing: 0.5px;
          border: 1px solid rgba(255, 217, 102, 0.2);
          margin-bottom: 16px;
        }

        .insights-header h2 {
          font-size: 40px;
          font-weight: 800;
          color: white;
          margin-bottom: 12px;
        }

        .insights-header h2 span {
          background: linear-gradient(135deg, #ffd966, #ffb347);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .insights-header p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
          max-width: 600px;
          margin: 0 auto;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .insight-card {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          min-height: 320px;
          background-size: cover;
          background-position: center;
          transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .insight-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 217, 102, 0.3);
        }

        .insight-card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.3) 0%,
            rgba(0, 0, 0, 0.7) 60%,
            rgba(0, 0, 0, 0.9) 100%
          );
          z-index: 1;
          transition: background 0.4s ease;
        }

        .insight-card:hover .insight-card-overlay {
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(93, 58, 26, 0.6) 60%,
            rgba(93, 58, 26, 0.9) 100%
          );
        }

        .insight-card-content {
          position: relative;
          z-index: 2;
          padding: 32px 28px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          color: white;
        }

        .insight-icon {
          width: 56px;
          height: 56px;
          background: rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          border: 1px solid rgba(255, 217, 102, 0.2);
          transition: all 0.3s ease;
        }

        .insight-card:hover .insight-icon {
          background: rgba(255, 217, 102, 0.25);
          transform: scale(1.05);
        }

        .insight-icon i {
          font-size: 28px;
          color: #ffd966;
        }

        .insight-card-content h4 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
          color: white;
        }

        .insight-card-content p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .insight-stats {
          display: flex;
          align-items: baseline;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(4px);
          padding: 8px 16px;
          border-radius: 40px;
          width: fit-content;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .insight-number {
          font-size: 22px;
          font-weight: 800;
          color: #ffd966;
          line-height: 1;
        }

        .insight-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        /* Effet de bordure animée au hover */
        .insight-card::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 26px;
          background: linear-gradient(135deg, #ffd966, #8B5A2B, #ffd966);
          background-size: 300% 300%;
          opacity: 0;
          z-index: 0;
          transition: opacity 0.4s ease;
          animation: gradientBorder 3s ease infinite;
        }

        .insight-card:hover::before {
          opacity: 1;
        }

        @keyframes gradientBorder {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* ========== SECTION TÉMOIGNAGES RECRUTEURS ========== */
        .testimonials-section {
          padding: 80px 90px;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
        }
        .testimonials-container {
          max-width: 1280px;
          margin: 0 auto;
        }
        .testimonials-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .testimonials-header .badge {
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
        .testimonials-header h2 {
          font-size: 40px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 12px;
        }
        .testimonials-header p {
          font-size: 16px;
          color: #6c757d;
        }
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        .testimonial-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          text-align: center;
          transition: all 0.3s ease;
          border: 1px solid #f0f2f5;
          box-shadow: 0 4px 15px rgba(0,0,0,0.04);
        }
        .testimonial-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.08);
          border-color: transparent;
        }
        .testimonial-card .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          margin: 0 auto 16px;
          border: 3px solid #fef3e8;
        }
        .testimonial-card .stars {
          color: #fbbf24;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .testimonial-card .quote {
          font-size: 14px;
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 16px;
          font-style: italic;
        }
        .testimonial-card .name {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }
        .testimonial-card .position {
          font-size: 13px;
          color: #8B5A2B;
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

        /* ========== RESPONSIVE ========== */
        @media (max-width: 1200px) {
          .stats-grid, .dashboard-container { padding: 0 40px; }
          .stats-grid { padding: 40px; }
          .insights-section { padding: 60px 40px; }
          .testimonials-section { padding: 60px 40px; }
          .insights-grid { grid-template-columns: repeat(2, 1fr); }
          .testimonials-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .dashboard-grid { grid-template-columns: 1fr; gap: 24px; }
          .quick-actions { grid-template-columns: repeat(2, 1fr); }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .insights-grid { grid-template-columns: 1fr 1fr; }
          .testimonials-grid { grid-template-columns: 1fr; }
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
        }
        @media (max-width: 768px) {
          .notification-dropdown { width: 320px; right: -50px; }
          .insights-section { padding: 60px 20px; }
          .insights-header h2 { font-size: 28px; }
          .insights-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
          .insight-card { min-height: 240px; }
          .insight-card-content { padding: 24px 20px; }
          .insight-icon { width: 44px; height: 44px; }
          .insight-icon i { font-size: 20px; }
          .insight-card-content h4 { font-size: 15px; }
          .insight-number { font-size: 18px; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .quick-actions { grid-template-columns: 1fr; }
          .chart-bars { height: 150px; }
          .offer-item, .candidature-item { flex-direction: column; gap: 12px; text-align: center; }
          .dashboard-container { padding: 0 20px 40px; }
          .stats-grid { padding: 20px; }
          .form-row-premium { grid-template-columns: 1fr; gap: 12px; margin-bottom: 0; }
          .modal-content-premium { padding: 24px; }
          .modal-actions-premium { flex-direction: column; }
          .insights-grid { grid-template-columns: 1fr; }
          .insights-section { padding: 40px 16px; }
          .testimonials-section { padding: 40px 16px; }
          .insights-header h2 { font-size: 24px; }
          .testimonials-header h2 { font-size: 24px; }
          .notification-dropdown { width: 300px; right: -60px; }
          .insight-card { min-height: 200px; }
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
            <Link to={getDashboardLink()} className="active">Tableau de bord</Link>
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
                  <div className="user-avatar-nav">
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
                      <Link to="/gestion-offres"><i className="fas fa-briefcase"></i> Mes offres</Link>
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
          <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#8B5A2B', padding: '12px', borderRadius: '12px', background: '#fef3e8' }}>Tableau de bord</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* ========== HERO SECTION ========== */}
      <section className="hero-dashboard-premium">
        <div className="hero-dashboard-bg"></div>
        <div className="hero-dashboard-overlay"></div>
        <div className="hero-dashboard-container">
          <div className="hero-dashboard-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Espace Recruteur
            </div>
            <h1 className="hero-title">
              Bonjour, <span className="hero-name">{user?.prenom || user?.nom}</span> 
            </h1>
            <p className="hero-desc">
              Gérez vos offres, consultez les candidatures et trouvez les talents de demain.
            </p>
            <div className="hero-buttons">
              <Link to="/gestion-offres" className="hero-btn hero-btn-primary">
                <i className="fas fa-briefcase"></i> Gérer mes offres
              </Link>
              <Link to="/candidatures-reçues" className="hero-btn hero-btn-secondary">
                <i className="fas fa-users"></i> Voir les candidatures
              </Link>
              <Link to="/offres" className="hero-btn hero-btn-outline">
                <i className="fas fa-search"></i> Explorer les talents
              </Link>
              <Link to="/entreprise-profile" className="hero-btn hero-btn-light">
                <i className="fas fa-building"></i> Mon entreprise
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-card-glass">
                <div className="stat-number">{stats.totalOffres}</div>
                <div className="stat-label">Offres</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.totalCandidatures}</div>
                <div className="stat-label">Candidatures</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.tauxAcceptation}%</div>
                <div className="stat-label">Taux acceptation</div>
              </div>
            </div>
          </div>
          <div className="hero-avatar">
            <div className="avatar-wrapper">
              <div className="avatar-ring"></div>
              <div className="avatar-circle">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo entreprise" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-initials">
                    <i className="fas fa-building"></i>
                  </div>
                )}
                <div className="avatar-badge">
                  <i className="fas fa-check-circle"></i>
                </div>
              </div>
            </div>
            <div className="hero-quote">
              <i className="fas fa-quote-left"></i> "Les meilleurs talents commencent ici."
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS CARDS AVEC IMAGES ========== */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-briefcase"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalOffres}</div>
            <div className="stat-label">Offres publiées</div>
            <div className="stat-trend"><i className="fas fa-arrow-up"></i> +12%</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-users"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalCandidatures}</div>
            <div className="stat-label">Candidatures reçues</div>
            <div className="stat-trend"><i className="fas fa-arrow-up"></i> +8%</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-clock"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.enAttente}</div>
            <div className="stat-label">En attente</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.acceptees}</div>
            <div className="stat-label">Acceptées</div>
            <div className="stat-trend"><i className="fas fa-arrow-up"></i> +5%</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-times-circle"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.refusees}</div>
            <div className="stat-label">Refusées</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-chart-line"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.tauxAcceptation}%</div>
            <div className="stat-label">Taux d'acceptation</div>
          </div>
        </div>
      </div>

      {/* ========== DASHBOARD CONTENT ========== */}
      <div className="dashboard-container">
        <div className="dashboard-grid">
          {/* Graphique des candidatures */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3><i className="fas fa-chart-line"></i> Évolution des candidatures</h3>
              <div className="period-buttons">
                <button className={`period-btn ${chartPeriod === 'week' ? 'active' : ''}`} onClick={() => setChartPeriod('week')}>Semaine</button>
                <button className={`period-btn ${chartPeriod === 'month' ? 'active' : ''}`} onClick={() => setChartPeriod('month')}>Mois</button>
              </div>
            </div>
            <div className="chart-container">
              <div className="chart-bars">
                {candidaturesParJour.map((value, idx) => {
                  const maxValue = Math.max(...candidaturesParJour, 1);
                  const height = (value / maxValue) * 160;
                  return (
                    <div key={idx} className="chart-bar-wrapper">
                      <div className="chart-bar" style={{ height: `${height}px` }}></div>
                      <div className="chart-label">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][idx]}</div>
                    </div>
                  );
                })}
              </div>
              <div className="chart-legend">
                <span><i className="fas fa-circle" style={{ color: '#8B5A2B', fontSize: '10px' }}></i> Candidatures reçues</span>
              </div>
            </div>
          </div>

          {/* Dernières offres */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3><i className="fas fa-briefcase"></i> Dernières offres</h3>
              <Link to="/gestion-offres" className="btn-link">Voir tout →</Link>
            </div>
            {recentOffres.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon"><i className="fas fa-briefcase"></i></div>
                <p className="empty-title">Aucune offre</p>
                <p className="empty-desc">Vous n'avez pas encore publié d'offre</p>
                <button onClick={() => setShowPublierModal(true)} className="btn-primary-sm"><i className="fas fa-plus"></i> Publier une offre</button>
              </div>
            ) : (
              <div className="offers-list">
                {recentOffres.map(offre => (
                  <Link to={`/offres/${offre.idOffre}`} key={offre.idOffre} className="offer-item">
                    <div className="offer-info">
                      <h4>{offre.titre}</h4>
                      <p><i className="fas fa-map-marker-alt"></i> {offre.ville} • <i className="fas fa-clock"></i> {offre.duree} mois</p>
                    </div>
                    <div className="offer-stats">
                      <span className="offer-count">{offre.candidatures_count || 0} candidatures</span>
                      <i className="fas fa-chevron-right" style={{ color: '#8B5A2B' }}></i>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Dernières candidatures */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3><i className="fas fa-users"></i> Dernières candidatures</h3>
              <Link to="/candidatures-reçues" className="btn-link">Voir tout →</Link>
            </div>
            {recentCandidatures.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon"><i className="fas fa-users"></i></div>
                <p className="empty-title">Aucune candidature</p>
                <p className="empty-desc">Vous n'avez pas encore reçu de candidatures</p>
              </div>
            ) : (
              <div className="candidatures-list">
                {recentCandidatures.map(candidature => (
                  <div key={candidature.idCandidature} className="candidature-item">
                    <div className="candidature-info">
                      <h4>{candidature.etudiant?.user?.prenom} {candidature.etudiant?.user?.nom}</h4>
                      <p><i className="fas fa-graduation-cap"></i> {candidature.offre?.titre}</p>
                    </div>
                    <div className={`candidature-badge ${candidature.statut}`}>
                      {candidature.statut === 'en_attente' ? 'En attente' : candidature.statut === 'acceptée' ? 'Acceptée' : 'Refusée'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3><i className="fas fa-bolt"></i> Actions rapides</h3>
            </div>
            <div className="quick-actions">
              <button onClick={() => setShowPublierModal(true)} className="quick-action-card">
                <div className="quick-action-icon"><i className="fas fa-plus-circle"></i></div>
                <h4>Publier une offre</h4>
                <p>Créez une nouvelle offre de stage</p>
              </button>
              <Link to="/gestion-offres" className="quick-action-card">
                <div className="quick-action-icon"><i className="fas fa-edit"></i></div>
                <h4>Gérer mes offres</h4>
                <p>Modifiez ou archivez vos offres</p>
              </Link>
              <Link to="/candidatures-reçues" className="quick-action-card">
                <div className="quick-action-icon"><i className="fas fa-envelope-open-text"></i></div>
                <h4>Consulter candidatures</h4>
                <p>Traitez les candidatures reçues</p>
              </Link>
              <Link to="/entreprise-profile" className="quick-action-card">
                <div className="quick-action-icon"><i className="fas fa-building"></i></div>
                <h4>Mon entreprise</h4>
                <p>Modifiez les informations</p>
              </Link>
              <Link to="/profile" className="quick-action-card">
                <div className="quick-action-icon"><i className="fas fa-user-cog"></i></div>
                <h4>Mon profil</h4>
                <p>Mettez à jour vos informations</p>
              </Link>
              <Link to="/offres" className="quick-action-card">
                <div className="quick-action-icon"><i className="fas fa-search"></i></div>
                <h4>Explorer les offres</h4>
                <p>Voir toutes les offres disponibles</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========== SECTION INSIGHTS ========== */}
      <div className="insights-section">
        <div className="insights-bg"></div>
        <div className="insights-overlay"></div>
        <div className="insights-container">
          <div className="insights-header">
            <span className="insights-badge">📊 Statistiques & Tendances</span>
            <h2>Analysez vos performances</h2>
            <p>Suivez l'évolution de vos recrutements en temps réel</p>
          </div>
          <div className="insights-grid">
            <div className="insight-card" style={{ backgroundImage: "url('/images/stat1.png')" }}>
              <div className="insight-card-overlay"></div>
              <div className="insight-card-content">
                <div className="insight-icon"><i className="fas fa-users"></i></div>
                <h4>Talents qualifiés</h4>
                <p>Accédez à un vivier de 500+ étudiants compétents dans tous les domaines</p>
                <div className="insight-stats">
                  <span className="insight-number">500+</span>
                  <span className="insight-label">Profils actifs</span>
                </div>
              </div>
            </div>

            <div className="insight-card" style={{ backgroundImage: "url('/images/stat2.png')" }}>
              <div className="insight-card-overlay"></div>
              <div className="insight-card-content">
                <div className="insight-icon"><i className="fas fa-robot"></i></div>
                <h4>Matching intelligent</h4>
                <p>Notre IA analyse les profils pour vous proposer les meilleurs candidats</p>
                <div className="insight-stats">
                  <span className="insight-number">94%</span>
                  <span className="insight-label">Précision du matching</span>
                </div>
              </div>
            </div>

            <div className="insight-card" style={{ backgroundImage: "url('/images/stat3.png')" }}>
              <div className="insight-card-overlay"></div>
              <div className="insight-card-content">
                <div className="insight-icon"><i className="fas fa-chart-bar"></i></div>
                <h4>Suivi en temps réel</h4>
                <p>Consultez les statistiques de vos offres et candidatures instantanément</p>
                <div className="insight-stats">
                  <span className="insight-number">24/7</span>
                  <span className="insight-label">Disponibilité</span>
                </div>
              </div>
            </div>

            <div className="insight-card" style={{ backgroundImage: "url('/images/stat4.png')" }}>
              <div className="insight-card-overlay"></div>
              <div className="insight-card-content">
                <div className="insight-icon"><i className="fas fa-rocket"></i></div>
                <h4>Recrutement accéléré</h4>
                <p>Réduisez vos délais de recrutement grâce à nos outils intelligents</p>
                <div className="insight-stats">
                  <span className="insight-number">-60%</span>
                  <span className="insight-label">Temps de recrutement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== SECTION TÉMOIGNAGES ========== */}
      <div className="testimonials-section">
        <div className="testimonials-container">
          <div className="testimonials-header">
            <span className="badge">💬 Témoignages</span>
            <h2>Ce que disent nos recruteurs</h2>
            <p>Ils ont trouvé leurs talents grâce à StageFlow</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="avatar" style={{ backgroundImage: `url('${testimonialImages[0]}')` }}></div>
              <div className="stars">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
              <p className="quote">"StageFlow nous a permis de trouver des stagiaires parfaitement alignés avec nos besoins. L'IA de matching est impressionnante !"</p>
              <p className="name">Ahmed Benjelloun</p>
              <p className="position">Responsable RH, Maroc Telecom</p>
            </div>

            <div className="testimonial-card">
              <div className="avatar" style={{ backgroundImage: `url('${testimonialImages[1]}')` }}></div>
              <div className="stars">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
              <p className="quote">"La plateforme est intuitive et efficace. Nous avons reçu plus de 50 candidatures qualifiées en une semaine seulement."</p>
              <p className="name">Salma El Idrissi</p>
              <p className="position">Directrice RH, HPS</p>
            </div>

            <div className="testimonial-card">
              <div className="avatar" style={{ backgroundImage: `url('${testimonialImages[2]}')` }}></div>
              <div className="stars">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
              <p className="quote">"Un gain de temps considérable ! Les recommandations personnalisées nous permettent de cibler les profils les plus pertinents."</p>
              <p className="name">Karim El Fassi</p>
              <p className="position">CEO, NAPS</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MODAL PUBLIER OFFRE AVEC NIVEAU ET CATÉGORIE ========== */}
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

              {/* ========== SECTION COMPÉTENCES AVEC NIVEAU ET CATÉGORIE ========== */}
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

                {/* SECTION AJOUT COMPÉTENCE EXISTANTE AVEC NIVEAU */}
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

                {/* COMPÉTENCES SÉLECTIONNÉES AVEC NIVEAU */}
                <div className="competences-grid-modal">
                  {selectedCompetencesPublier.map(selected => {
                    const comp = competencesList.find(c => c.idCompetence === selected.id);
                    return comp ? (
                      <div key={selected.id} className="competence-chip-modal selected">
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
                <button type="submit" className="btn-submit-premium" disabled={publierLoading}>
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
                <button type="submit" className="btn-submit-premium" disabled={addingCompetence}>
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