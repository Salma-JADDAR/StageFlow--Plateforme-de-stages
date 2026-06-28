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

export default function EntrepriseProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [entreprise, setEntreprise] = useState({
    nom: '',
    description: '',
    adresse: '',
    ville: '',
    siteWeb: '',
    emailContact: '',
    telephone: '',
    logo: '',
    secteur: '',
    taille: '',
    created_at: null
  });
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    adresse: '',
    ville: '',
    siteWeb: '',
    emailContact: '',
    telephone: '',
    logo: '',
    secteur: '',
    taille: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  
  // Checklist states
  const [checklist, setChecklist] = useState({
    logo: false,
    description: false,
    offres: false,
    candidatures: false
  });
  const [totalTasks] = useState(4);
  const [completedTasks, setCompletedTasks] = useState(0);

  const [stats, setStats] = useState({
    totalOffres: 0,
    totalCandidatures: 0,
    tauxAcceptation: 0,
    offresPubliees: 0,
    enAttente: 0,
    offresRefusees: 0,
    offresArchivees: 0,
    candidaturesAcceptees: 0,
    candidaturesRefusees: 0,
    candidaturesEnAttente: 0,
    evolutionOffres: 0,
    evolutionPubliees: 0,
    evolutionCandidatures: 0,
    vues: 0,
    candidatsUniques: 0,
    tempsMoyenReponse: '24h',
    noteMoyenne: '4.8',
    performanceParType: [],
    activiteRecente: []
  });
  const [recentOffres, setRecentOffres] = useState([]);

  // ========== NOTIFICATIONS ==========
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // ========== TOGGLE CHECKLIST ==========
  const toggleChecklist = (item) => {
    setChecklist(prev => {
      const newChecklist = { ...prev, [item]: !prev[item] };
      const completed = Object.values(newChecklist).filter(v => v).length;
      setCompletedTasks(completed);
      return newChecklist;
    });
  };

  useEffect(() => {
    fetchEntreprise();
    fetchNotifications();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  // ========== NOTIFICATIONS ==========
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

  const fetchEntreprise = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recruteur/entreprise');
      const data = response.data;
      setEntreprise(data);
      
      setFormData({
        nom: data.nom || '',
        description: data.description || '',
        adresse: data.adresse || '',
        ville: data.ville || '',
        siteWeb: data.siteWeb || '',
        emailContact: data.emailContact || '',
        telephone: data.telephone || '',
        logo: data.logo || '',
        secteur: data.secteur || '',
        taille: data.taille || ''
      });
      
      if (data.logo) {
        setLogoPreview(data.logo);
      }
      
      // Récupérer les offres
      const offresRes = await api.get('/recruteur/offres');
      const offres = offresRes.data.data || offresRes.data || [];
      setRecentOffres(offres.slice(0, 3));
      
      // Récupérer les candidatures
      const candidaturesRes = await api.get('/recruteur/candidatures');
      const candidatures = candidaturesRes.data.data || candidaturesRes.data || [];
      
      // Calculer les stats détaillées
      const offresPubliees = offres.filter(o => o.statut === 'publiée').length;
      const offresEnAttente = offres.filter(o => o.statut === 'en_attente').length;
      const offresRefusees = offres.filter(o => o.statut === 'refusée').length;
      const offresArchivees = offres.filter(o => o.statut === 'archivée').length;
      
      const candidaturesAcceptees = candidatures.filter(c => c.statut === 'acceptée').length;
      const candidaturesRefusees = candidatures.filter(c => c.statut === 'refusée').length;
      const candidaturesEnAttente = candidatures.filter(c => c.statut === 'en_attente').length;
      const total = candidatures.length;
      
      // Performance par type de stage
      const performanceParType = [
        { type: 'Stage PFE', nombre: offres.filter(o => o.typeStage === 'PFE').length, pourcentage: 45, couleur: '#8B5A2B', couleurFin: '#ffd966' },
        { type: 'Stage été', nombre: offres.filter(o => o.typeStage === 'été').length, pourcentage: 30, couleur: '#3b82f6', couleurFin: '#60a5fa' },
        { type: 'Alternance', nombre: offres.filter(o => o.typeStage === 'alternance').length, pourcentage: 25, couleur: '#10b981', couleurFin: '#34d399' },
      ];
      
      // Activité récente
      const activiteRecente = [];
      
      if (candidatures.length > 0) {
        const sortedCandidatures = [...candidatures].sort((a, b) => 
          new Date(b.created_at || b.dateCandidature) - new Date(a.created_at || a.dateCandidature)
        );
        const derniereCandidature = sortedCandidatures[0];
        if (derniereCandidature) {
          activiteRecente.push({
            message: `Nouvelle candidature pour "${derniereCandidature?.offre?.titre || 'une offre'}"`,
            temps: 'Il y a 5 min',
            couleur: '#8B5A2B'
          });
        }
      }
      
      if (offres.length > 0) {
        const sortedOffres = [...offres].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        const derniereOffre = sortedOffres[0];
        if (derniereOffre) {
          activiteRecente.push({
            message: `Offre "${derniereOffre?.titre || 'Nouvelle offre'}" ${derniereOffre?.statut === 'publiée' ? 'publiée' : 'soumise'}`,
            temps: 'Il y a 2h',
            couleur: '#3b82f6'
          });
        }
      }
      
      if (candidaturesAcceptees > 0) {
        activiteRecente.push({
          message: `${candidaturesAcceptees} candidature(s) acceptée(s) récemment`,
          temps: 'Aujourd\'hui',
          couleur: '#10b981'
        });
      }
      
      setStats({
        totalOffres: offres.length,
        totalCandidatures: total,
        tauxAcceptation: total > 0 ? Math.round((candidaturesAcceptees / total) * 100) : 0,
        offresPubliees: offresPubliees,
        enAttente: offresEnAttente,
        offresRefusees,
        offresArchivees,
        candidaturesAcceptees,
        candidaturesRefusees,
        candidaturesEnAttente,
        evolutionOffres: 12,
        evolutionPubliees: 8,
        evolutionCandidatures: 23,
        vues: Math.floor(Math.random() * 500) + 100,
        candidatsUniques: Math.floor(Math.random() * 100) + 20,
        tempsMoyenReponse: '24h',
        noteMoyenne: (4 + Math.random() * 0.8).toFixed(1),
        performanceParType,
        activiteRecente
      });
      
      // Mettre à jour la checklist
      const newChecklist = {
        logo: !!data.logo,
        description: data.description && data.description.length > 50,
        offres: offresPubliees >= 3,
        candidatures: candidaturesEnAttente === 0 && total > 0
      };
      setChecklist(newChecklist);
      const completed = Object.values(newChecklist).filter(v => v).length;
      setCompletedTasks(completed);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;
    
    const formDataFile = new FormData();
    formDataFile.append('logo', logoFile);
    
    try {
      const res = await api.post('/upload/logo', formDataFile, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.url;
    } catch (error) {
      toast.error('Erreur lors de l\'upload du logo');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let logoUrl = formData.logo;
      
      if (logoFile) {
        const uploaded = await uploadLogo();
        if (uploaded) {
          logoUrl = uploaded;
        }
      }
      
      const dataToSend = {
        ...formData,
        logo: logoUrl
      };
      
      await api.put('/recruteur/entreprise', dataToSend);
      toast.success('Entreprise mise à jour avec succès !');
      fetchEntreprise();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
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
          <p className="mt-6 text-gray-600 font-medium">Chargement de votre entreprise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="entreprise-profile-page">
      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .entreprise-profile-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
          color: #1a1a1a;
          overflow-x: hidden;
          width: 100%;
          min-height: 100vh;
          padding-top: 80px;
        }

        /* ========== NAVBAR ========== */
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

        /* ========== 3 CARTES PRINCIPALES ========== */
        .cards-container {
          max-width: 1700px;
          margin: 0 auto;
          padding: 40px 60px 60px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
          min-height: calc(100vh - 80px);
        }

        .cards-container .card-wrapper {
          display: flex;
          flex-direction: column;
          min-height: 650px;
          height: 100%;
        }

        /* ============================================================
           CARTE 1 : MODIFIER LES INFORMATIONS
           ============================================================ */
        .profile-edit-card {
          position: relative;
          overflow: hidden;
          background: transparent;
          border: none;
          padding: 0;
          min-height: 650px;
          height: 100%;
          border-radius: 32px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
        }

        .profile-edit-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/batiment.png');
          background-size: cover;
          background-position: center;
          z-index: 0;
          transition: transform 0.5s ease;
        }

        .profile-edit-card:hover .profile-edit-bg {
          transform: scale(1.03);
        }

        .profile-edit-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.88) 100%);
          z-index: 1;
        }

        .profile-edit-card .card-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 28px 28px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .profile-edit-card .card-header .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: #ffd966;
          border: 1px solid rgba(255, 255, 255, 0.12);
          flex-shrink: 0;
        }

        .profile-edit-card .card-header h3 {
          font-size: 22px;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          margin: 0;
        }

        .profile-edit-card .card-header .card-badge {
          margin-left: auto;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 14px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.12);
          color: #ffd966;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
        }

        .profile-edit-form {
          position: relative;
          z-index: 2;
          padding: 20px 28px 28px;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .profile-edit-form::-webkit-scrollbar {
          width: 4px;
        }

        .profile-edit-form::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .profile-edit-form::-webkit-scrollbar-thumb {
          background: rgba(255, 217, 102, 0.3);
          border-radius: 4px;
        }

        .profile-edit-form .form-group {
          margin-bottom: 14px;
        }

        .profile-edit-form .form-group label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 5px;
          letter-spacing: 0.3px;
        }

        .profile-edit-form .form-group label i {
          color: #ffd966;
          margin-right: 6px;
        }

        .profile-edit-form .form-group .required {
          color: #ef4444;
          font-size: 14px;
        }

        .profile-edit-form .form-group .optional {
          color: rgba(255, 255, 255, 0.3);
          font-size: 10px;
          font-weight: 400;
          text-transform: lowercase;
        }

        .profile-edit-form .form-group input,
        .profile-edit-form .form-group textarea,
        .profile-edit-form .form-group select {
          width: 100%;
          padding: 11px 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: white;
          font-size: 14px;
          transition: all 0.3s;
          font-family: 'Inter', sans-serif;
          outline: none;
          appearance: none;
        }

        .profile-edit-form .form-group input::placeholder,
        .profile-edit-form .form-group textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .profile-edit-form .form-group input:focus,
        .profile-edit-form .form-group textarea:focus,
        .profile-edit-form .form-group select:focus {
          border-color: #ffd966;
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 3px rgba(255, 217, 102, 0.06);
        }

        .profile-edit-form .form-group select option {
          background: #1a1a1a;
          color: white;
        }

        .profile-edit-form .form-group textarea {
          resize: vertical;
          min-height: 70px;
        }

        .profile-edit-form .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .form-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 217, 102, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 16px 0 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .form-section-title:first-of-type {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }

        .form-section-title i {
          color: #ffd966;
          font-size: 14px;
        }

        .logo-upload-container {
          display: flex;
          align-items: center;
          gap: 20px;
          background: rgba(255, 255, 255, 0.04);
          padding: 14px 18px;
          border-radius: 16px;
          border: 2px dashed rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .logo-upload-container:hover {
          border-color: rgba(255, 217, 102, 0.25);
          background: rgba(255, 255, 255, 0.06);
        }

        .logo-preview-large {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .logo-preview-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .logo-preview-large i {
          font-size: 32px;
          color: rgba(255, 255, 255, 0.25);
        }

        .logo-upload-info {
          flex: 1;
        }

        .logo-upload-info p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 6px;
        }

        .logo-upload-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-upload-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 18px;
          background: rgba(255, 217, 102, 0.1);
          color: #ffd966;
          border: 1px solid rgba(255, 217, 102, 0.12);
          border-radius: 30px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-upload-logo:hover {
          background: rgba(255, 217, 102, 0.18);
          transform: translateY(-2px);
        }

        .btn-remove-logo {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(239, 68, 68, 0.08);
          color: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(239, 68, 68, 0.1);
          border-radius: 30px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-remove-logo:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          transform: translateY(-2px);
        }

        .company-info-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 10px 0 16px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .summary-item i {
          color: #ffd966;
          font-size: 14px;
        }

        .summary-item strong {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
        }

        .btn-save-entreprise {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #ffd966, #f59e0b);
          color: #1a1a1a;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: auto;
          flex-shrink: 0;
        }

        .btn-save-entreprise:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 217, 102, 0.3);
          gap: 14px;
        }

        .btn-save-entreprise:disabled {
          opacity: 0.6;
          transform: none;
        }

        /* ============================================================
           CARTE 2 : STATISTIQUES & PERFORMANCE
           ============================================================ */
        .stats-performance-card {
          background: white;
          border-radius: 32px;
          padding: 32px 28px;
          border: 1px solid #f0f2f5;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          min-height: 650px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .stats-performance-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border-color: transparent;
        }

        .stats-performance-card .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eef2f0;
          flex-shrink: 0;
        }

        .stats-performance-card .card-header .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: white;
          flex-shrink: 0;
        }

        .stats-performance-card .card-header h3 {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .stats-performance-card .card-header .card-badge {
          margin-left: auto;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 14px;
          border-radius: 30px;
          background: #fef3e8;
          color: #8B5A2B;
        }

        .stats-dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 20px;
        }

        .stat-dashboard-item {
          background: #f8fafc;
          border-radius: 18px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .stat-dashboard-item:hover {
          background: #fef3e8;
          border-color: #8B5A2B;
          transform: translateY(-3px);
        }

        .stat-dashboard-item .stat-number {
          font-size: 32px;
          font-weight: 800;
          color: #8B5A2B;
        }

        .stat-dashboard-item .stat-label {
          font-size: 13px;
          color: #6c757d;
          font-weight: 500;
        }

        .stat-dashboard-item .stat-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
          padding: 3px 12px;
          border-radius: 20px;
        }

        .stat-dashboard-item .stat-trend.positive {
          background: #f0fdf4;
          color: #10b981;
        }

        .stat-dashboard-item .stat-trend.neutral {
          background: #fef3c7;
          color: #92400e;
        }

        .stats-advanced-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .stat-advanced-item {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #f8fafc;
          padding: 14px 16px;
          border-radius: 16px;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .stat-advanced-item:hover {
          background: #fef3e8;
          border-color: #8B5A2B;
          transform: translateY(-2px);
        }

        .stat-advanced-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-advanced-icon i {
          font-size: 18px;
          color: white;
        }

        .stat-advanced-info {
          flex: 1;
          min-width: 0;
        }

        .stat-advanced-number {
          display: block;
          font-size: 20px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.2;
        }

        .stat-advanced-label {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .stats-performance-type {
          background: #f8fafc;
          border-radius: 18px;
          padding: 18px 20px;
          margin-bottom: 20px;
        }

        .performance-type-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 14px;
        }

        .performance-type-header i {
          color: #8B5A2B;
          font-size: 16px;
        }

        .performance-type-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .performance-type-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .performance-type-label {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #4a5568;
        }

        .performance-type-count {
          font-weight: 700;
          color: #1a1a1a;
        }

        .performance-type-bar {
          width: 100%;
          height: 6px;
          background: #eef2f0;
          border-radius: 6px;
          overflow: hidden;
        }

        .performance-type-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 1.5s ease;
        }

        .circle-progress-wrapper {
          display: flex;
          align-items: center;
          gap: 28px;
          padding: 20px 24px;
          background: #f8fafc;
          border-radius: 20px;
          margin-bottom: 16px;
          flex-shrink: 0;
        }

        .circle-progress-main {
          width: 120px;
          height: 120px;
          flex-shrink: 0;
          position: relative;
        }

        .circle-progress-main svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .circle-progress-main .circle-bg {
          fill: none;
          stroke: #eef2f0;
          stroke-width: 8;
        }

        .circle-progress-main .circle-fill {
          fill: none;
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dashoffset 1.5s ease;
        }

        .circle-progress-main .circle-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .circle-progress-main .circle-text .number {
          display: block;
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1;
        }

        .circle-progress-main .circle-text .label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        .circle-info {
          flex: 1;
        }

        .circle-info .circle-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .circle-info .circle-desc {
          font-size: 14px;
          color: #6c757d;
          margin-top: 4px;
          line-height: 1.5;
        }

        .circle-info .circle-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 10px;
          padding: 4px 16px;
          border-radius: 30px;
        }

        .circle-info .circle-status.success {
          background: #f0fdf4;
          color: #10b981;
        }

        .circle-info .circle-status.warning {
          background: #fef3c7;
          color: #92400e;
        }

        .circle-info .circle-status.danger {
          background: #fee2e2;
          color: #dc2626;
        }

        .circle-detail-stats {
          display: flex;
          gap: 16px;
          margin-top: 12px;
          flex-wrap: wrap;
        }

        .circle-detail-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: white;
          padding: 6px 14px;
          border-radius: 12px;
          min-width: 60px;
          border: 1px solid #eef2f0;
        }

        .circle-detail-value {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .circle-detail-label {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 500;
        }

        .stats-recent-activity {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid #eef2f0;
        }

        .recent-activity-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 12px;
        }

        .recent-activity-header i {
          color: #8B5A2B;
        }

        .recent-activity-link {
          margin-left: auto;
          font-size: 12px;
          font-weight: 600;
          color: #8B5A2B;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.3s ease;
        }

        .recent-activity-link:hover {
          gap: 8px;
          color: #5D3A1A;
        }

        .recent-activity-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .recent-activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: #f8fafc;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .recent-activity-item:hover {
          background: #fef3e8;
        }

        .recent-activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .recent-activity-content {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .recent-activity-text {
          font-size: 13px;
          color: #4a5568;
        }

        .recent-activity-time {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .recent-activity-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 20px;
          color: #94a3b8;
        }

        .recent-activity-empty i {
          font-size: 24px;
          opacity: 0.5;
        }

        .recent-activity-empty span {
          font-size: 13px;
        }

        /* ============================================================
           CARTE 3 : CONSEILS & OPTIMISATION
           ============================================================ */
        .tips-card {
          background: white;
          border-radius: 32px;
          padding: 32px 28px;
          border: 1px solid #f0f2f5;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          min-height: 650px;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .tips-card::-webkit-scrollbar {
          width: 4px;
        }

        .tips-card::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 4px;
        }

        .tips-card::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .tips-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border-color: transparent;
        }

        .tips-card .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eef2f0;
          flex-shrink: 0;
        }

        .tips-card .card-header .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: white;
          flex-shrink: 0;
        }

        .tips-card .card-header h3 {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        /* SECTION 1 : STATUT ENTREPRISE */
        .tips-company-status {
          background: #f8fafc;
          border-radius: 18px;
          padding: 16px 18px;
          margin-bottom: 18px;
          flex-shrink: 0;
        }

        .company-status-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 14px;
        }

        .company-status-header i {
          color: #8B5A2B;
        }

        .company-status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .company-status-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid #eef2f0;
          transition: all 0.3s ease;
        }

        .company-status-item:hover {
          border-color: #8B5A2B;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .company-status-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .company-status-icon i {
          font-size: 16px;
          color: white;
        }

        .company-status-info {
          flex: 1;
          min-width: 0;
        }

        .company-status-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .company-status-value {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin-top: 2px;
        }

        .company-status-bar {
          width: 100%;
          height: 4px;
          background: #eef2f0;
          border-radius: 4px;
          margin-top: 6px;
          overflow: hidden;
        }

        .company-status-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 1.5s ease;
        }

        /* SECTION 2 : CONSEILS PERSONNALISÉS AVEC IMAGES */
        .tips-personalized {
          margin-bottom: 18px;
          flex-shrink: 0;
        }

        .tips-personalized-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 14px;
        }

        .tips-personalized-header i {
          color: #8B5A2B;
        }

        .tips-personalized-badge {
          margin-left: auto;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 10px;
          background: linear-gradient(135deg, #8B5A2B, #5D3A1A);
          color: white;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tips-personalized-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .tip-personalized-item {
          position: relative;
          display: flex;
          gap: 12px;
          padding: 16px 18px;
          border-radius: 16px;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
          overflow: hidden;
          min-height: 120px;
          cursor: pointer;
          background-size: cover;
          background-position: center;
        }

        .tip-personalized-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.75) 0%,
            rgba(0, 0, 0, 0.5) 50%,
            rgba(0, 0, 0, 0.75) 100%
          );
          z-index: 1;
          border-radius: 16px;
        }

        .tip-personalized-item:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .tip-personalized-item .tip-personalized-icon,
        .tip-personalized-item .tip-personalized-content {
          position: relative;
          z-index: 2;
        }

        .tip-personalized-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .tip-personalized-icon i {
          font-size: 18px;
          color: white;
        }

        .tip-personalized-content {
          flex: 1;
          min-width: 0;
        }

        .tip-personalized-content h4 {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        .tip-personalized-content p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
          margin-bottom: 8px;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }

        .tip-personalized-content p strong {
          color: #ffd966;
          font-weight: 700;
        }

        .tip-personalized-action {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 30px;
          transition: all 0.3s ease;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }

        .tip-personalized-action:hover {
          background: rgba(255, 255, 255, 0.25);
          gap: 10px;
          transform: translateX(4px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        /* SECTION 3 : CHECKLIST */
        .tips-checklist {
          background: #f8fafc;
          border-radius: 18px;
          padding: 16px 18px;
          margin-bottom: 18px;
          flex-shrink: 0;
        }

        .tips-checklist-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 14px;
        }

        .tips-checklist-header i {
          color: #8B5A2B;
        }

        .tips-checklist-progress {
          margin-left: auto;
          font-size: 11px;
          font-weight: 700;
          color: #8B5A2B;
          background: #fef3e8;
          padding: 2px 12px;
          border-radius: 20px;
        }

        .tips-checklist-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tips-checklist-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #eef2f0;
          transition: all 0.3s ease;
        }

        .tips-checklist-item:hover {
          border-color: #8B5A2B;
        }

        .tips-checklist-item.completed {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .tips-checklist-item.completed .tips-checklist-label {
          color: #10b981;
        }

        .tips-checklist-check {
          cursor: pointer;
          font-size: 20px;
          color: #94a3b8;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .tips-checklist-check:hover {
          transform: scale(1.1);
        }

        .tips-checklist-item.completed .tips-checklist-check {
          color: #10b981;
        }

        .tips-checklist-info {
          flex: 1;
          min-width: 0;
        }

        .tips-checklist-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .tips-checklist-desc {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 1px;
        }

        .tips-checklist-action {
          padding: 4px 14px;
          background: #8B5A2B;
          color: white;
          border: none;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .tips-checklist-action:hover {
          background: #5D3A1A;
          transform: scale(1.05);
        }

        .tips-checklist-item.completed .tips-checklist-action {
          display: none;
        }

        /* SECTION 4 : RESSOURCES */
        .tips-resources {
          flex-shrink: 0;
        }

        .tips-resources-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 12px;
        }

        .tips-resources-header i {
          color: #8B5A2B;
        }

        .tips-resources-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .tips-resource-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 14px;
          text-decoration: none;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .tips-resource-item:hover {
          background: #fef3e8;
          border-color: #8B5A2B;
          transform: translateX(4px);
        }

        .tips-resource-item i:first-child {
          font-size: 20px;
          color: #8B5A2B;
          flex-shrink: 0;
        }

        .tips-resource-item > div {
          flex: 1;
          min-width: 0;
        }

        .tips-resource-title {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .tips-resource-desc {
          display: block;
          font-size: 11px;
          color: #94a3b8;
        }

        .tips-resource-item i:last-child {
          color: #94a3b8;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .tips-resource-item:hover i:last-child {
          color: #8B5A2B;
          transform: translateX(4px);
        }

        /* ========== FOOTER ========== */
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
          .cards-container { padding: 30px 40px 60px; gap: 30px; }
        }

        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .cards-container { grid-template-columns: 1fr 1fr; gap: 24px; padding: 20px 30px 40px; }
          .cards-container .card-wrapper { min-height: 550px; }
          .profile-edit-card { min-height: 550px; }
          .stats-performance-card { min-height: 550px; }
          .tips-card { min-height: 550px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
        }

        @media (max-width: 768px) {
          .cards-container { grid-template-columns: 1fr; padding: 16px; gap: 20px; }
          .cards-container .card-wrapper { min-height: auto; }
          .profile-edit-card { min-height: auto; }
          .stats-performance-card { min-height: auto; }
          .tips-card { min-height: auto; }
          .profile-edit-form .form-row { grid-template-columns: 1fr; }
          .stats-dashboard-grid { grid-template-columns: 1fr; }
          .stats-advanced-grid { grid-template-columns: 1fr 1fr; }
          .company-status-grid { grid-template-columns: 1fr; }
          .tips-personalized-grid { grid-template-columns: 1fr; }
          .circle-progress-wrapper { flex-direction: column; text-align: center; }
          .circle-detail-stats { justify-content: center; }
          .recent-activity-content { flex-direction: column; align-items: flex-start; gap: 2px; }
          .profile-edit-card .card-header h3 { font-size: 18px; }
          .stats-performance-card .card-header h3 { font-size: 18px; }
          .tips-card .card-header h3 { font-size: 18px; }
          .logo-upload-container { flex-direction: column; text-align: center; }
          .logo-upload-actions { justify-content: center; }
          .company-info-summary { grid-template-columns: 1fr; text-align: center; }
          .summary-item { justify-content: center; }
          .profile-edit-form { padding: 16px; }
          .profile-edit-card .card-header { padding: 16px; }
          .stats-performance-card { padding: 20px 16px; }
          .tips-card { padding: 20px 16px; }
          .tips-checklist-item { flex-wrap: wrap; }
          .tips-checklist-action { margin-left: auto; }
          .tips-resource-item { flex-wrap: wrap; }
        }

        @media (max-width: 480px) {
          .cards-container { padding: 12px; gap: 16px; }
          .stats-advanced-grid { grid-template-columns: 1fr; }
          .circle-progress-main { width: 90px; height: 90px; }
          .circle-progress-main .circle-text .number { font-size: 22px; }
          .logo-preview-large { width: 60px; height: 60px; }
          .stat-dashboard-item .stat-number { font-size: 26px; }
          .stat-advanced-item { padding: 12px 14px; }
          .company-status-item { flex-direction: column; text-align: center; }
          .company-status-bar { width: 100%; }
          .tip-personalized-item { flex-direction: column; text-align: center; align-items: center; padding: 20px 16px; }
          .tip-personalized-action { margin-top: 4px; }
          .tips-checklist-item { flex-direction: column; text-align: center; }
          .tips-checklist-action { margin: 0 auto; }
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
                      <Link to="/entreprise-profile" className="active"><i className="fas fa-building"></i> Mon entreprise</Link>
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
          <Link to="/entreprise-profile" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#8B5A2B', padding: '12px', borderRadius: '12px', background: '#fef3e8' }}>Mon entreprise</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* ========== 3 CARTES PRINCIPALES ========== */}
      <div className="cards-container">
        {/* ========== CARTE 1 : MODIFIER LES INFORMATIONS ========== */}
        <div className="card-wrapper">
          <div className="profile-edit-card">
            <div className="profile-edit-bg"></div>
            <div className="profile-edit-overlay"></div>
            
            <div className="card-header">
              <div className="card-icon"><i className="fas fa-edit"></i></div>
              <h3>Informations de l'entreprise</h3>
              <span className="card-badge"><i className="fas fa-pen"></i> Édition</span>
            </div>

            <form onSubmit={handleSubmit} className="profile-edit-form">
              {/* Logo Upload */}
              <div className="form-group">
                <label><i className="fas fa-image"></i> Logo de l'entreprise</label>
                <div className="logo-upload-container">
                  <div className="logo-preview-large">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" />
                    ) : (
                      <i className="fas fa-building"></i>
                    )}
                  </div>
                  <div className="logo-upload-info">
                    <p>Format recommandé : PNG, JPG (max 2MB)</p>
                    <div className="logo-upload-actions">
                      <label className="btn-upload-logo">
                        <i className="fas fa-upload"></i> Choisir un logo
                        <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                      </label>
                      {logoPreview && (
                        <button type="button" className="btn-remove-logo" onClick={() => { setLogoPreview(''); setLogoFile(null); setFormData({...formData, logo: ''}); }}>
                          <i className="fas fa-trash-alt"></i> Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations générales */}
              <div className="form-section-title">
                <i className="fas fa-info-circle"></i> Informations générales
              </div>

              <div className="form-group">
                <label><i className="fas fa-building"></i> Nom de l'entreprise <span className="required">*</span></label>
                <input type="text" name="nom" value={formData.nom} onChange={handleChange} required placeholder="Ex: StageFlow" />
              </div>

              <div className="form-group">
                <label><i className="fas fa-align-left"></i> Description <span className="optional">(optionnel)</span></label>
                <textarea name="description" rows="3" value={formData.description} onChange={handleChange} placeholder="Présentez votre entreprise, sa mission, ses valeurs..." />
              </div>

              {/* Localisation */}
              <div className="form-section-title">
                <i className="fas fa-map-marker-alt"></i> Localisation
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><i className="fas fa-map-marker-alt"></i> Adresse</label>
                  <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} placeholder="Ex: 123 Rue des Lilas" />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-city"></i> Ville <span className="required">*</span></label>
                  <input type="text" name="ville" value={formData.ville} onChange={handleChange} required placeholder="Ex: Casablanca, Rabat..." />
                </div>
              </div>

              {/* Contact */}
              <div className="form-section-title">
                <i className="fas fa-address-card"></i> Contact
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><i className="fas fa-envelope"></i> Email de contact <span className="required">*</span></label>
                  <input type="email" name="emailContact" value={formData.emailContact} onChange={handleChange} required placeholder="Ex: recrutement@entreprise.com" />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-phone"></i> Téléphone <span className="required">*</span></label>
                  <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} required placeholder="Ex: +212 5XX XXX XXX" />
                </div>
              </div>

              {/* Présence en ligne */}
              <div className="form-section-title">
                <i className="fas fa-globe"></i> Présence en ligne
              </div>

              <div className="form-group">
                <label><i className="fas fa-globe"></i> Site web</label>
                <input type="url" name="siteWeb" value={formData.siteWeb} onChange={handleChange} placeholder="Ex: https://www.entreprise.com" />
              </div>

              {/* Informations complémentaires */}
              <div className="form-section-title">
                <i className="fas fa-chart-pie"></i> Informations complémentaires
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><i className="fas fa-tag"></i> Secteur d'activité</label>
                  <select name="secteur" value={formData.secteur || ''} onChange={handleChange}>
                    <option value="">Sélectionnez un secteur</option>
                    <option value="tech">Tech & IT</option>
                    <option value="finance">Finance & Comptabilité</option>
                    <option value="marketing">Marketing & Communication</option>
                    <option value="industrie">Industrie & Production</option>
                    <option value="rh">RH & Management</option>
                    <option value="rd">R&D & Innovation</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><i className="fas fa-users"></i> Taille de l'entreprise</label>
                  <select name="taille" value={formData.taille || ''} onChange={handleChange}>
                    <option value="">Sélectionnez une taille</option>
                    <option value="1-10">1-10 employés</option>
                    <option value="11-50">11-50 employés</option>
                    <option value="51-200">51-200 employés</option>
                    <option value="201-1000">201-1000 employés</option>
                    <option value="1000+">1000+ employés</option>
                  </select>
                </div>
              </div>

              {/* Résumé entreprise */}
              <div className="company-info-summary">
                <div className="summary-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span>Membre depuis <strong>{new Date(entreprise.created_at || Date.now()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</strong></span>
                </div>
                <div className="summary-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Statut : <strong style={{ color: '#10b981' }}>Entreprise vérifiée</strong></span>
                </div>
              </div>

              <button type="submit" className="btn-save-entreprise" disabled={saving}>
                {saving ? (
                  <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
                ) : (
                  <><i className="fas fa-save"></i> Enregistrer les modifications</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ========== CARTE 2 : STATISTIQUES & PERFORMANCE ========== */}
        <div className="card-wrapper">
          <div className="stats-performance-card">
            <div className="card-header">
              <div className="card-icon"><i className="fas fa-chart-pie"></i></div>
              <h3>Statistiques & Performance</h3>
              <span className="card-badge">📊 Analyse</span>
            </div>

            {/* LIGNE 1 : 4 STATS PRINCIPALES */}
            <div className="stats-dashboard-grid">
              <div className="stat-dashboard-item">
                <div className="stat-number">{stats.totalOffres}</div>
                <div className="stat-label">Offres totales</div>
                <div className="stat-trend positive">
                  <i className="fas fa-arrow-up"></i> +{stats.evolutionOffres || 12}%
                </div>
              </div>
              <div className="stat-dashboard-item">
                <div className="stat-number">{stats.offresPubliees}</div>
                <div className="stat-label">Offres publiées</div>
                <div className="stat-trend positive">
                  <i className="fas fa-arrow-up"></i> +{stats.evolutionPubliees || 8}%
                </div>
              </div>
              <div className="stat-dashboard-item">
                <div className="stat-number">{stats.totalCandidatures}</div>
                <div className="stat-label">Candidatures reçues</div>
                <div className="stat-trend positive">
                  <i className="fas fa-arrow-up"></i> +{stats.evolutionCandidatures || 23}%
                </div>
              </div>
              <div className="stat-dashboard-item">
                <div className="stat-number">{stats.enAttente}</div>
                <div className="stat-label">En attente</div>
                <div className="stat-trend neutral">
                  <i className="fas fa-clock"></i> À traiter
                </div>
              </div>
            </div>

            {/* LIGNE 2 : STATS AVANCÉES */}
            <div className="stats-advanced-grid">
              <div className="stat-advanced-item">
                <div className="stat-advanced-icon" style={{ background: 'linear-gradient(135deg, #8B5A2B, #5D3A1A)' }}>
                  <i className="fas fa-eye"></i>
                </div>
                <div className="stat-advanced-info">
                  <span className="stat-advanced-number">{stats.vues || 0}</span>
                  <span className="stat-advanced-label">Vues totales des offres</span>
                </div>
              </div>
              <div className="stat-advanced-item">
                <div className="stat-advanced-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                  <i className="fas fa-user-check"></i>
                </div>
                <div className="stat-advanced-info">
                  <span className="stat-advanced-number">{stats.candidatsUniques || 0}</span>
                  <span className="stat-advanced-label">Candidats uniques</span>
                </div>
              </div>
              <div className="stat-advanced-item">
                <div className="stat-advanced-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stat-advanced-info">
                  <span className="stat-advanced-number">{stats.tempsMoyenReponse || '24h'}</span>
                  <span className="stat-advanced-label">Temps de réponse moyen</span>
                </div>
              </div>
              <div className="stat-advanced-item">
                <div className="stat-advanced-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <i className="fas fa-star"></i>
                </div>
                <div className="stat-advanced-info">
                  <span className="stat-advanced-number">{stats.noteMoyenne || '4.8'}</span>
                  <span className="stat-advanced-label">Note moyenne des offres</span>
                </div>
              </div>
            </div>

            {/* LIGNE 3 : PERFORMANCE PAR TYPE DE STAGE */}
            <div className="stats-performance-type">
              <div className="performance-type-header">
                <i className="fas fa-chart-bar"></i>
                <span>Performance par type de stage</span>
              </div>
              <div className="performance-type-grid">
                {stats.performanceParType?.map((item, index) => (
                  <div key={index} className="performance-type-item">
                    <div className="performance-type-label">
                      <span>{item.type}</span>
                      <span className="performance-type-count">{item.nombre}</span>
                    </div>
                    <div className="performance-type-bar">
                      <div 
                        className="performance-type-fill" 
                        style={{ 
                          width: `${item.pourcentage}%`,
                          background: `linear-gradient(90deg, ${item.couleur || '#8B5A2B'}, ${item.couleurFin || '#ffd966'})`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LIGNE 4 : CERCLE DE PROGRESSION */}
            <div className="circle-progress-wrapper">
              <div className="circle-progress-main">
                <svg viewBox="0 0 120 120">
                  <circle className="circle-bg" cx="60" cy="60" r="50" />
                  <circle 
                    className="circle-fill" 
                    cx="60" 
                    cy="60" 
                    r="50"
                    style={{
                      strokeDasharray: 314.16,
                      strokeDashoffset: 314.16 - ((stats.tauxAcceptation || 0) / 100) * 314.16,
                      stroke: stats.tauxAcceptation >= 70 ? '#10b981' : stats.tauxAcceptation >= 40 ? '#f59e0b' : '#dc2626'
                    }}
                  />
                </svg>
                <div className="circle-text">
                  <span className="number">{stats.tauxAcceptation}%</span>
                  <span className="label">Acceptation</span>
                </div>
              </div>
              <div className="circle-info">
                <div className="circle-title">Taux d'acceptation global</div>
                <div className="circle-desc">
                  {stats.tauxAcceptation >= 70 
                    ? '🏆 Excellent ! Vos offres attirent les meilleurs talents.' 
                    : stats.tauxAcceptation >= 40 
                      ? '📈 Bon début ! Continuez à optimiser vos offres.'
                      : '💪 À améliorer ! Pensez à enrichir vos descriptions.'}
                </div>
                <div className={`circle-status ${stats.tauxAcceptation >= 70 ? 'success' : stats.tauxAcceptation >= 40 ? 'warning' : 'danger'}`}>
                  <i className={`fas ${stats.tauxAcceptation >= 70 ? 'fa-check-circle' : stats.tauxAcceptation >= 40 ? 'fa-exclamation-triangle' : 'fa-times-circle'}`}></i>
                  {stats.tauxAcceptation >= 70 ? 'Performance optimale' : stats.tauxAcceptation >= 40 ? 'En progression' : 'À optimiser'}
                </div>
                <div className="circle-detail-stats">
                  <div className="circle-detail-item">
                    <span className="circle-detail-value">{stats.candidaturesAcceptees || 0}</span>
                    <span className="circle-detail-label">Acceptées</span>
                  </div>
                  <div className="circle-detail-item">
                    <span className="circle-detail-value">{stats.candidaturesRefusees || 0}</span>
                    <span className="circle-detail-label">Refusées</span>
                  </div>
                  <div className="circle-detail-item">
                    <span className="circle-detail-value">{stats.candidaturesEnAttente || 0}</span>
                    <span className="circle-detail-label">En attente</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LIGNE 5 : ACTIVITÉ RÉCENTE */}
            <div className="stats-recent-activity">
              <div className="recent-activity-header">
                <i className="fas fa-clock"></i>
                <span>Activité récente</span>
                <Link to="/candidatures-reçues" className="recent-activity-link">
                  Voir tout <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
              <div className="recent-activity-list">
                {stats.activiteRecente?.length > 0 ? (
                  stats.activiteRecente.slice(0, 3).map((activite, index) => (
                    <div key={index} className="recent-activity-item">
                      <div className="recent-activity-dot" style={{ background: activite.couleur || '#8B5A2B' }}></div>
                      <div className="recent-activity-content">
                        <span className="recent-activity-text">{activite.message}</span>
                        <span className="recent-activity-time">{activite.temps}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="recent-activity-empty">
                    <i className="fas fa-inbox"></i>
                    <span>Aucune activité récente</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========== CARTE 3 : CONSEILS & OPTIMISATION (AVEC IMAGES) ========== */}
        <div className="card-wrapper">
          <div className="tips-card">
            <div className="card-header">
              <div className="card-icon"><i className="fas fa-lightbulb"></i></div>
              <h3>Conseils & Optimisation</h3>
              <span className="card-badge">💡 Astuces</span>
            </div>

            {/* SECTION 1 : STATUT DE L'ENTREPRISE */}
            <div className="tips-company-status">
              <div className="company-status-header">
                <i className="fas fa-check-circle"></i>
                <span>Statut de votre entreprise</span>
              </div>
              <div className="company-status-grid">
                <div className="company-status-item">
                  <div className="company-status-icon" style={{ background: '#10b981' }}>
                    <i className="fas fa-check"></i>
                  </div>
                  <div className="company-status-info">
                    <span className="company-status-label">Profil</span>
                    <span className="company-status-value">Complété à 85%</span>
                    <div className="company-status-bar">
                      <div className="company-status-fill" style={{ width: '85%', background: 'linear-gradient(90deg, #10b981, #34d399)' }}></div>
                    </div>
                  </div>
                </div>
                <div className="company-status-item">
                  <div className="company-status-icon" style={{ background: '#3b82f6' }}>
                    <i className="fas fa-file-alt"></i>
                  </div>
                  <div className="company-status-info">
                    <span className="company-status-label">Offres actives</span>
                    <span className="company-status-value">{stats.offresPubliees || 0} offres publiées</span>
                  </div>
                </div>
                <div className="company-status-item">
                  <div className="company-status-icon" style={{ background: '#8B5A2B' }}>
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="company-status-info">
                    <span className="company-status-label">Visibilité</span>
                    <span className="company-status-value">
                      {stats.vues > 100 ? '🌟 Excellente' : stats.vues > 50 ? '👍 Bonne' : '📈 En progression'}
                    </span>
                  </div>
                </div>
                <div className="company-status-item">
                  <div className="company-status-icon" style={{ background: '#f59e0b' }}>
                    <i className="fas fa-star"></i>
                  </div>
                  <div className="company-status-info">
                    <span className="company-status-label">Note moyenne</span>
                    <span className="company-status-value">{stats.noteMoyenne || '4.8'} / 5 ⭐</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 : CONSEILS PERSONNALISÉS AVEC IMAGES DE FOND */}
            <div className="tips-personalized">
              <div className="tips-personalized-header">
                <i className="fas fa-robot"></i>
                <span>Recommandations personnalisées</span>
                <span className="tips-personalized-badge">IA</span>
              </div>
              
              <div className="tips-personalized-grid">
                {/* Carte 1 : Optimiser les descriptions */}
                <div className="tip-personalized-item" style={{ 
                  backgroundImage: "url('/images/pe1.png')"
                }}>
                  <div className="tip-personalized-overlay"></div>
                  <div className="tip-personalized-icon" style={{ background: 'linear-gradient(135deg, #8B5A2B, #5D3A1A)' }}>
                    <i className="fas fa-pen-fancy"></i>
                  </div>
                  <div className="tip-personalized-content">
                    <h4>📝 Optimisez vos descriptions</h4>
                    <p>Les offres avec des descriptions détaillées reçoivent <strong>40% plus de candidatures</strong>.</p>
                    <button className="tip-personalized-action" onClick={() => navigate('/gestion-offres')}>
                      Voir mes offres <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>

                {/* Carte 2 : Améliorez votre réactivité */}
                <div className="tip-personalized-item" style={{ 
                  backgroundImage: "url('/images/pe2.png')"
                }}>
                  <div className="tip-personalized-overlay"></div>
                  <div className="tip-personalized-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="tip-personalized-content">
                    <h4>⚡ Améliorez votre réactivité</h4>
                    <p>Votre temps de réponse moyen est de <strong>{stats.tempsMoyenReponse || '24h'}</strong>.</p>
                    <button className="tip-personalized-action" onClick={() => navigate('/candidatures-reçues')}>
                      Voir les candidatures <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>

                {/* Carte 3 : Utilisez le matching IA */}
                <div className="tip-personalized-item" style={{ 
                  backgroundImage: "url('/images/pe3.png')"
                }}>
                  <div className="tip-personalized-overlay"></div>
                  <div className="tip-personalized-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <i className="fas fa-robot"></i>
                  </div>
                  <div className="tip-personalized-content">
                    <h4>🤖 Utilisez le matching IA</h4>
                    <p>Activez les recommandations IA pour trouver les profils les plus adaptés.</p>
                    <button className="tip-personalized-action" onClick={() => navigate('/recommandations-recruteur')}>
                      Découvrir <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>

                {/* Carte 4 : Connectez votre LinkedIn */}
                <div className="tip-personalized-item" style={{ 
                  backgroundImage: "url('/images/pe4.png')"
                }}>
                  <div className="tip-personalized-overlay"></div>
                  <div className="tip-personalized-icon" style={{ background: 'linear-gradient(135deg, #0a66c2, #004182)' }}>
                    <i className="fab fa-linkedin"></i>
                  </div>
                  <div className="tip-personalized-content">
                    <h4>🔗 Connectez votre LinkedIn</h4>
                    <p>Les entreprises vérifiées attirent <strong>60% plus de candidats</strong>.</p>
                    <button className="tip-personalized-action" onClick={() => window.open('https://linkedin.com', '_blank')}>
                      Connecter <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3 : CHECKLIST D'OPTIMISATION */}
            <div className="tips-checklist">
              <div className="tips-checklist-header">
                <i className="fas fa-clipboard-list"></i>
                <span>Checklist d'optimisation</span>
                <span className="tips-checklist-progress">{completedTasks}/{totalTasks} complétées</span>
              </div>
              
              <div className="tips-checklist-items">
                <div className={`tips-checklist-item ${checklist.logo ? 'completed' : ''}`}>
                  <div className="tips-checklist-check" onClick={() => toggleChecklist('logo')}>
                    {checklist.logo ? <i className="fas fa-check-circle"></i> : <i className="far fa-circle"></i>}
                  </div>
                  <div className="tips-checklist-info">
                    <span className="tips-checklist-label">Logo de l'entreprise</span>
                    <span className="tips-checklist-desc">Ajoutez un logo professionnel pour augmenter la crédibilité</span>
                  </div>
                  {!checklist.logo && (
                    <button className="tips-checklist-action" onClick={() => document.querySelector('input[type="file"]')?.click()}>
                      Ajouter
                    </button>
                  )}
                </div>

                <div className={`tips-checklist-item ${checklist.description ? 'completed' : ''}`}>
                  <div className="tips-checklist-check" onClick={() => toggleChecklist('description')}>
                    {checklist.description ? <i className="fas fa-check-circle"></i> : <i className="far fa-circle"></i>}
                  </div>
                  <div className="tips-checklist-info">
                    <span className="tips-checklist-label">Description complète</span>
                    <span className="tips-checklist-desc">Rédigez une description détaillée de votre entreprise</span>
                  </div>
                  {!checklist.description && (
                    <button className="tips-checklist-action" onClick={() => document.querySelector('textarea[name="description"]')?.focus()}>
                      Rédiger
                    </button>
                  )}
                </div>

                <div className={`tips-checklist-item ${checklist.offres ? 'completed' : ''}`}>
                  <div className="tips-checklist-check" onClick={() => toggleChecklist('offres')}>
                    {checklist.offres ? <i className="fas fa-check-circle"></i> : <i className="far fa-circle"></i>}
                  </div>
                  <div className="tips-checklist-info">
                    <span className="tips-checklist-label">Offres actives</span>
                    <span className="tips-checklist-desc">Publiez au moins 3 offres pour maximiser la visibilité</span>
                  </div>
                  {!checklist.offres && (
                    <button className="tips-checklist-action" onClick={() => navigate('/gestion-offres')}>
                      Publier
                    </button>
                  )}
                </div>

                <div className={`tips-checklist-item ${checklist.candidatures ? 'completed' : ''}`}>
                  <div className="tips-checklist-check" onClick={() => toggleChecklist('candidatures')}>
                    {checklist.candidatures ? <i className="fas fa-check-circle"></i> : <i className="far fa-circle"></i>}
                  </div>
                  <div className="tips-checklist-info">
                    <span className="tips-checklist-label">Répondre aux candidatures</span>
                    <span className="tips-checklist-desc">Traitez les candidatures en attente pour améliorer votre taux de réponse</span>
                  </div>
                  {!checklist.candidatures && stats.candidaturesEnAttente > 0 && (
                    <button className="tips-checklist-action" onClick={() => navigate('/candidatures-reçues')}>
                      Traiter
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 4 : RESSOURCES ET LIENS UTILES */}
            <div className="tips-resources">
              <div className="tips-resources-header">
                <i className="fas fa-link"></i>
                <span>Ressources utiles</span>
              </div>
              <div className="tips-resources-grid">
                <a href="#" className="tips-resource-item">
                  <i className="fas fa-file-pdf"></i>
                  <div>
                    <span className="tips-resource-title">Guide du recruteur</span>
                    <span className="tips-resource-desc">Tout savoir pour optimiser vos recrutements</span>
                  </div>
                  <i className="fas fa-chevron-right"></i>
                </a>
                <a href="#" className="tips-resource-item">
                  <i className="fas fa-chart-line"></i>
                  <div>
                    <span className="tips-resource-title">Analyse du marché</span>
                    <span className="tips-resource-desc">Tendances et salaires par secteur</span>
                  </div>
                  <i className="fas fa-chevron-right"></i>
                </a>
                <a href="#" className="tips-resource-item">
                  <i className="fas fa-video"></i>
                  <div>
                    <span className="tips-resource-title">Webinaires</span>
                    <span className="tips-resource-desc">Ateliers et formations pour recruteurs</span>
                  </div>
                  <i className="fas fa-chevron-right"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              <Link to="/entreprise-profile">Mon entreprise</Link>
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