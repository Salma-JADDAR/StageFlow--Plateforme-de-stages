import { useEffect, useState } from 'react';
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

// Images pour les cartes de candidatures
const baseImages = [
  '/images/do.png', '/images/do1.png', '/images/do2.png', '/images/do3.png',
  '/images/do4.png', '/images/do5.png', '/images/do6.png', '/images/do7.png',
  '/images/do8.png', '/images/do9.png', '/images/doo.png', '/images/doo1.png',
  '/images/doo2.png', '/images/doo3.png', '/images/doo4.png', '/images/doo5.png',
];

// Fonction pour récupérer une image pour les offres recommandées
const getImageForOffre = (id) => {
  const index = (id * 3) % baseImages.length;
  return baseImages[index];
};

export default function MesCandidatures() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [candidatures, setCandidatures] = useState([]);
  const [filteredCandidatures, setFilteredCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCandidature, setSelectedCandidature] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [randomAvatar, setRandomAvatar] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    acceptees: 0,
    refusees: 0
  });

  // ========== ÉTATS POUR LES NOTIFICATIONS ==========
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // ========== ÉTAT POUR LES RECOMMANDATIONS ==========
  const [recommendedOffres, setRecommendedOffres] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'etudiant') return '/dashboard';
    if (user.role === 'recruteur') return '/dashboard-recruteur';
    if (user.role === 'admin') return '/dashboard-admin';
    return '/profile';
  };

  // ========== RÉCUPÉRATION DES RECOMMANDATIONS ==========
  const fetchRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const response = await api.get('/etudiant/recommendations');
      console.log('Recommandations reçues :', response.data);
      const data = response.data || [];
      setRecommendedOffres(data);
    } catch (error) {
      console.error('Erreur chargement recommandations:', error);
      setRecommendedOffres([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchCandidatures();
    fetchNotifications();
    fetchRecommendations();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const randomIndex = Math.floor(Math.random() * avatarImages.length);
    setRandomAvatar(avatarImages[randomIndex]);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    filterCandidatures();
  }, [selectedStatus, searchTerm, candidatures]);

  const fetchCandidatures = async () => {
    try {
      setLoading(true);
      const response = await api.get('/etudiant/mes-candidatures');
      const data = response.data.data || response.data;
      setCandidatures(data);
      
      const enAttente = data.filter(c => c.statut === 'en_attente').length;
      const acceptees = data.filter(c => c.statut === 'acceptée').length;
      const refusees = data.filter(c => c.statut === 'refusée').length;
      
      setStats({
        total: data.length,
        enAttente,
        acceptees,
        refusees
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des candidatures');
    } finally {
      setLoading(false);
    }
  };

  const filterCandidatures = () => {
    let filtered = [...candidatures];
    
    if (selectedStatus !== 'tous') {
      filtered = filtered.filter(c => c.statut === selectedStatus);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.offre?.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.offre?.entreprise?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.offre?.ville?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCandidatures(filtered);
  };

  const handleAnnuler = async (id) => {
    if (confirm('Voulez-vous vraiment annuler cette candidature ?')) {
      try {
        await api.delete(`/etudiant/candidatures/${id}`);
        toast.success('Candidature annulée');
        fetchCandidatures();
      } catch (error) {
        toast.error('Erreur lors de l\'annulation');
      }
    }
  };

  const handleViewDetails = (candidature) => {
    setSelectedCandidature(candidature);
    setShowDetailModal(true);
  };

  const getStatusColor = (statut) => {
    switch(statut) {
      case 'acceptée': return '#10b981';
      case 'refusée': return '#dc2626';
      case 'en_attente': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (statut) => {
    switch(statut) {
      case 'acceptée': return 'fas fa-check-circle';
      case 'refusée': return 'fas fa-times-circle';
      case 'en_attente': return 'fas fa-clock';
      default: return 'fas fa-question-circle';
    }
  };

  const getStatusLabel = (statut) => {
    switch(statut) {
      case 'acceptée': return 'Acceptée';
      case 'refusée': return 'Refusée';
      case 'en_attente': return 'En attente';
      default: return statut;
    }
  };

  const getImageForCandidature = (id) => {
    const index = (id * 2) % baseImages.length;
    return baseImages[index];
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-[#8B5A2B] rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Chargement de vos candidatures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candidatures-page">
      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        :root {
          --primary: #8B5A2B;
          --primary-dark: #5D3A1A;
          --primary-light: #ffd966;
          --secondary: #0f172a;
          --gray-50: #f8fafc;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-600: #475569;
          --gray-700: #334155;
          --gray-900: #0f172a;
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
          --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .candidatures-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--gray-50);
          color: var(--gray-900);
          min-height: 100vh;
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
        .mark-all-read:hover { color: #5D3A1A; }
        .notification-list { max-height: 400px; overflow-y: auto; }
        .notification-list::-webkit-scrollbar { width: 4px; }
        .notification-list::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .notification-empty {
          text-align: center;
          padding: 40px 20px;
          color: #94a3b8;
        }
        .notification-empty i { font-size: 40px; margin-bottom: 12px; display: block; color: #cbd5e1; }
        .notification-empty p { font-size: 14px; }
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
        .notification-item:hover { background: #fafbfc; }
        .notification-item.unread { background: #fef3e8; }
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
        .notif-icon i { font-size: 16px; color: #8B5A2B; }
        .notif-content { flex: 1; min-width: 0; }
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
        .notif-delete:hover { background: #fee2e2; color: #dc2626; }
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
        .notification-footer a:hover { color: #5D3A1A; }

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

        /* ========== HERO CANDIDATURES ========== */
        .hero-candidatures {
          position: relative;
          min-height: 850px;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding-top: 50px;
        }
        .hero-candidatures-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/doo1.png');
          background-size: cover;
          background-position: center;
          z-index: 0;
        }
        .hero-candidatures-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(100deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.7) 100%);
          z-index: 1;
        }
        .hero-candidatures-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 60px;
          position: relative;
          z-index: 2;
          width: 100%;
        }
        .hero-candidatures-content { flex: 1; }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(139, 90, 43, 0.2);
          backdrop-filter: blur(4px);
          padding: 6px 16px;
          border-radius: 40px;
          margin-bottom: 24px;
        }
        .badge-dot {
          width: 8px;
          height: 8px;
          background: #ffd966;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .hero-title {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 24px;
          color: white;
        }
        .hero-name {
          background: linear-gradient(135deg, #ffd966, #ffb347);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-desc {
          font-size: 16px;
          color: rgba(255,255,255,0.9);
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 500px;
        }
        .hero-buttons {
          display: flex;
          gap: 16px;
          margin-bottom: 48px;
        }
        .hero-btn-primary {
          padding: 12px 28px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border-radius: 50px;
          color: white;
          text-decoration: none;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s;
        }
        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(93,58,26,0.3);
          gap: 15px;
        }
        .hero-btn-secondary {
          padding: 12px 28px;
          border: 2px solid white;
          border-radius: 50px;
          color: white;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.3s;
        }
        .hero-btn-secondary:hover { background: white; color: #8B5A2B; }
        .hero-stats {
          display: flex;
          gap: 48px;
        }
        .stat-hero {
          display: flex;
          flex-direction: column;
        }
        .stat-number-hero {
          font-size: 28px;
          font-weight: 800;
          color: #ffd966;
        }
        .stat-label-hero {
          font-size: 13px;
          color: rgba(255,255,255,0.8);
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
          .hero-candidatures-container { flex-direction: column; text-align: center; gap: 50px; }
          .hero-desc { margin: 0 auto 32px; }
          .hero-buttons { justify-content: center; }
          .hero-stats { justify-content: center; }
          .avatar-wrapper { width: 200px; height: 200px; }
          .hero-title { font-size: 42px; }
        }
        @media (max-width: 700px) {
          .hero-title { font-size: 32px; }
          .avatar-wrapper { width: 160px; height: 160px; }
        }

        /* ========== SEARCH BAR ========== */
        .search-wrapper {
          max-width: 1280px;
          margin: -28px auto 0;
          padding: 0 32px;
          position: relative;
          z-index: 10;
        }
        .search-card {
          background: white;
          border-radius: 60px;
          padding: 8px;
          display: flex;
          gap: 12px;
          box-shadow: var(--shadow-2xl);
          border: 1px solid rgba(0, 0, 0, 0.04);
          flex-wrap: wrap;
        }
        .search-field {
          flex: 2;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          background: var(--gray-50);
          border-radius: 50px;
          transition: all 0.2s;
        }
        .search-field:focus-within {
          background: white;
          box-shadow: 0 0 0 2px var(--primary);
        }
        .search-field i { color: #94a3b8; font-size: 18px; }
        .search-field input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          background: transparent;
          font-weight: 500;
        }
        .filter-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 4px;
        }
        .filter-chip {
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
        .filter-chip:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }
        .filter-chip.active {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          box-shadow: 0 4px 12px rgba(93, 58, 26, 0.2);
        }
        .filter-chip i { font-size: 12px; }
        .clear-search {
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
        .clear-search:hover {
          background: #fee2e2;
          color: #dc2626;
          transform: scale(1.05);
        }

        /* ========== STATS GRID ========== */
        .stats-grid {
          max-width: 1280px;
          margin: 40px auto 0;
          padding: 0 32px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .stat-card {
          background: white;
          border-radius: 20px;
          padding: 24px 20px;
          display: flex;
          align-items: center;
          gap: 18px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #eef2f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px -8px rgba(0,0,0,0.08);
          border-color: transparent;
        }
        .stat-icon {
          width: 60px;
          height: 60px;
          background: #fef3e8;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-icon i { font-size: 28px; color: #8B5A2B; }
        .stat-info { flex: 1; }
        .stat-number {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
          margin-bottom: 2px;
        }
        .stat-label {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
        }

        /* ========== CANDIDATURES GRID ========== */
        .candidatures-grid {
          max-width: 1280px;
          margin: 32px auto 0;
          padding: 0 32px 60px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        .candidature-card {
          background: transparent;
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #eef2f0;
          cursor: pointer;
          position: relative;
          animation: fadeInUp 0.5s ease forwards;
          opacity: 0;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .candidature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.15);
          border-color: transparent;
        }
        .card-bg {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 350px;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: flex-end;
        }
        .card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg,
            rgba(0, 0, 0, 0.1) 0%,
            rgba(0, 0, 0, 0.4) 40%,
            rgba(0, 0, 0, 0.85) 100%
          );
          z-index: 0;
          transition: all 0.4s ease;
        }
        .candidature-card:hover .card-overlay {
          background: linear-gradient(180deg,
            rgba(0, 0, 0, 0.05) 0%,
            rgba(93, 58, 26, 0.3) 40%,
            rgba(0, 0, 0, 0.9) 100%
          );
        }
        .card-content {
          position: relative;
          z-index: 1;
          padding: 24px;
          width: 100%;
          color: white;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .company-logo {
          width: 58px;
          height: 58px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 26px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s;
        }
        .candidature-card:hover .company-logo {
          background: rgba(255, 217, 102, 0.2);
          transform: scale(1.05);
        }
        .status-badge {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(4px);
          padding: 5px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .status-badge i { font-size: 11px; }
        .card-title {
          font-size: 19px;
          font-weight: 700;
          margin: 8px 0 4px;
          line-height: 1.3;
          transition: color 0.2s;
        }
        .candidature-card:hover .card-title { color: #ffd966; }
        .company-name {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .company-name i { font-size: 12px; color: #ffd966; }
        .card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          padding: 12px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          margin-bottom: 14px;
        }
        .card-meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }
        .card-meta-item i { color: #ffd966; width: 14px; font-size: 12px; }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .view-link {
          color: #ffd966;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
          background: rgba(255, 217, 102, 0.1);
          padding: 8px 16px;
          border-radius: 40px;
          border: 1px solid rgba(255, 217, 102, 0.15);
        }
        .candidature-card:hover .view-link {
          gap: 12px;
          background: rgba(255, 217, 102, 0.2);
          color: #ffe08c;
        }
        .btn-annuler {
          background: rgba(220, 38, 38, 0.15);
          border: 1px solid rgba(220, 38, 38, 0.3);
          color: #f87171;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(4px);
        }
        .btn-annuler:hover {
          background: #dc2626;
          color: white;
          transform: scale(1.02);
        }

        /* ========== EMPTY STATE ========== */
        .empty-state {
          text-align: center;
          padding: 80px 40px;
          background: white;
          border-radius: 32px;
          max-width: 1280px;
          margin: 40px auto 60px;
          border: 1px solid #eef2f0;
        }
        .empty-icon {
          width: 100px;
          height: 100px;
          background: #fef3e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .empty-icon i { font-size: 48px; color: #8B5A2B; }
        .empty-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1a1a1a;
        }
        .empty-desc {
          color: #64748b;
          margin-bottom: 24px;
        }
        .btn-decouvrir {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          padding: 12px 28px;
          border-radius: 40px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
        }
        .btn-decouvrir:hover {
          transform: translateY(-2px);
          gap: 12px;
          box-shadow: 0 6px 20px rgba(93, 58, 26, 0.3);
        }

        /* ========== SECTION RECOMMANDÉES ========== */
        .section-recommended-premium {
          padding: 60px 32px;
          background: #f8fafc;
        }
        .container-recommended-premium {
          max-width: 1280px;
          margin: 0 auto;
        }
        .section-header-recommended-premium {
          text-align: center;
          margin-bottom: 48px;
        }
        .section-header-recommended-premium .section-badge {
          display: inline-block;
          background: rgba(139,90,43,0.1);
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 12px;
        }
        .section-header-recommended-premium h2 {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .section-header-recommended-premium p {
          color: #64748b;
          font-size: 16px;
        }

        .offres-recommended-grid-premium {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
          margin-bottom: 32px;
        }

        .offre-recommended-card-premium {
          border-radius: 24px;
          overflow: hidden;
          text-decoration: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #eef2f0;
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          height: 100%;
          position: relative;
          cursor: pointer;
        }

        .offre-recommended-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.15);
          border-color: transparent;
        }

        .recommended-card-bg-premium {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 380px;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: flex-end;
          padding: 24px;
        }

        .recommended-card-overlay-premium {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg,
            rgba(0, 0, 0, 0.1) 0%,
            rgba(0, 0, 0, 0.4) 40%,
            rgba(0, 0, 0, 0.85) 100%
          );
          z-index: 0;
          transition: all 0.4s ease;
        }

        .offre-recommended-card-premium:hover .recommended-card-overlay-premium {
          background: linear-gradient(180deg,
            rgba(0, 0, 0, 0.05) 0%,
            rgba(93, 58, 26, 0.3) 40%,
            rgba(0, 0, 0, 0.9) 100%
          );
        }

        .recommended-card-content-premium {
          position: relative;
          z-index: 1;
          width: 100%;
          color: white;
        }

        .recommended-card-header-premium {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .recommended-company-logo-premium {
          width: 54px;
          height: 54px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s;
        }

        .offre-recommended-card-premium:hover .recommended-company-logo-premium {
          background: rgba(255, 217, 102, 0.2);
          transform: scale(1.05);
        }

        .recommended-score-badge-premium {
          background: rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(4px);
          padding: 4px 14px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 700;
          color: #ffd966;
          border: 1px solid rgba(255, 217, 102, 0.2);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .recommended-score-badge-premium i {
          font-size: 12px;
          color: #f59e0b;
        }

        .recommended-title-premium {
          font-size: 20px;
          font-weight: 700;
          margin: 8px 0 4px;
          line-height: 1.3;
          color: white;
          transition: color 0.2s;
        }

        .offre-recommended-card-premium:hover .recommended-title-premium {
          color: #ffd966;
        }

        .recommended-company-name-premium {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .recommended-company-name-premium i {
          font-size: 12px;
          color: #ffd966;
        }

        .recommended-tags-premium {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .recommended-tags-premium span {
          display: inline-block;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          padding: 4px 12px;
          border-radius: 30px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .recommended-meta-premium {
          display: flex;
          gap: 16px;
          padding: 10px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          margin-bottom: 14px;
        }

        .recommended-meta-premium span {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }

        .recommended-meta-premium i {
          color: #ffd966;
          font-size: 12px;
          width: 14px;
        }

        .recommended-card-footer-premium {
          display: flex;
          justify-content: flex-end;
        }

        .recommended-view-link-premium {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #ffd966;
          font-weight: 700;
          font-size: 14px;
          padding: 8px 20px;
          background: rgba(255, 217, 102, 0.1);
          border-radius: 40px;
          border: 1px solid rgba(255, 217, 102, 0.15);
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
        }

        .offre-recommended-card-premium:hover .recommended-view-link-premium {
          gap: 16px;
          background: rgba(255, 217, 102, 0.2);
          color: #ffe08c;
        }

        .recommended-action-premium {
          text-align: center;
        }

        .btn-recommended-all-premium {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 32px;
          background: white;
          border: 2px solid #8B5A2B;
          border-radius: 50px;
          color: #8B5A2B;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s;
        }

        .btn-recommended-all-premium:hover {
          background: #8B5A2B;
          color: white;
          gap: 14px;
          box-shadow: 0 6px 20px rgba(139,90,43,0.2);
        }

        /* ========== SECTION ASTUCES ========== */
        .section-tips-premium {
          position: relative;
          padding: 80px 32px 60px;
          background-image: url('/images/formation12.png');
          background-size: cover;
          background-position: center;
          overflow: hidden;
          margin-bottom: 50px;
        }

        .section-tips-premium::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.85) 0%, rgba(0, 0, 0, 0.7) 100%);
          z-index: 0;
        }

        .container-tips-premium {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .section-header-tips-premium {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-header-tips-premium .section-badge {
          display: inline-block;
          background: rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(4px);
          padding: 6px 20px;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 600;
          color: #ffd966;
          letter-spacing: 0.5px;
          border: 1px solid rgba(255, 217, 102, 0.2);
          margin-bottom: 16px;
        }

        .section-header-tips-premium h2 {
          font-size: 38px;
          font-weight: 800;
          color: white;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }

        .section-header-tips-premium p {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 400;
        }

        .tips-grid-premium {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 28px;
        }

        .tip-card-premium {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          border-radius: 24px;
          padding: 32px 24px 28px;
          text-align: center;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          cursor: default;
        }

        .tip-card-premium::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #ffd966, #ffb347);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }

        .tip-card-premium:hover::after {
          transform: scaleX(1);
        }

        .tip-card-premium:hover {
          transform: translateY(-8px);
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 217, 102, 0.3);
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.4);
        }

        .tip-number {
          position: absolute;
          top: 12px;
          right: 20px;
          font-size: 48px;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.04);
          line-height: 1;
          letter-spacing: -2px;
          transition: all 0.3s;
        }

        .tip-card-premium:hover .tip-number {
          color: rgba(255, 217, 102, 0.08);
          transform: scale(1.05);
        }

        .tip-icon-premium {
          width: 72px;
          height: 72px;
          background: rgba(255, 217, 102, 0.12);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          border: 1px solid rgba(255, 217, 102, 0.2);
          transition: all 0.3s;
        }

        .tip-card-premium:hover .tip-icon-premium {
          background: rgba(255, 217, 102, 0.2);
          transform: scale(1.05);
          border-color: rgba(255, 217, 102, 0.4);
        }

        .tip-icon-premium i {
          font-size: 32px;
          color: #ffd966;
        }

        .tip-card-premium h4 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 12px;
          color: white;
        }

        .tip-card-premium p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.6;
          margin-bottom: 18px;
        }

        .tip-tag {
          display: inline-block;
          background: rgba(255, 217, 102, 0.12);
          padding: 4px 16px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          color: #ffd966;
          border: 1px solid rgba(255, 217, 102, 0.15);
          letter-spacing: 0.3px;
          transition: all 0.3s;
        }

        .tip-card-premium:hover .tip-tag {
          background: rgba(255, 217, 102, 0.2);
          border-color: rgba(255, 217, 102, 0.3);
        }

        .tips-cta-premium {
          text-align: center;
          margin-top: 48px;
        }

        .btn-tips-premium {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 14px 36px;
          background: white;
          border-radius: 50px;
          font-weight: 700;
          font-size: 16px;
          color: #5D3A1A;
          text-decoration: none;
          transition: all 0.3s;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .btn-tips-premium:hover {
          transform: translateY(-3px);
          gap: 18px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
          background: #faf7f2;
        }

        /* ========== MODAL DETAIL ========== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal {
          background: white;
          border-radius: 28px;
          max-width: 820px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal::-webkit-scrollbar { width: 4px; }
        .modal::-webkit-scrollbar-thumb { background: #8B5A2B; border-radius: 4px; }

        .modal-image {
          position: relative;
          width: 100%;
          height: 220px;
          background-size: cover;
          background-position: center;
          border-radius: 28px 28px 0 0;
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          padding: 20px;
        }

        .modal-image::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%);
          border-radius: 28px 28px 0 0;
        }

        .modal-badge {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 40px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-weight: 600;
          font-size: 14px;
        }

        .modal-badge i {
          font-size: 16px;
        }

        .modal-badge span {
          color: white;
        }

        .modal-content {
          padding: 32px 36px 36px;
        }

        .modal-title {
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 6px;
          line-height: 1.2;
        }

        .modal-subtitle {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          color: #64748b;
          margin-bottom: 24px;
        }

        .modal-subtitle i {
          color: #8B5A2B;
          font-size: 18px;
        }

        .modal-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 16px;
        }

        .modal-grid-item {
          text-align: center;
        }

        .modal-grid-item i {
          font-size: 20px;
          color: #8B5A2B;
          margin-bottom: 4px;
          display: block;
        }

        .modal-grid-label {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .modal-grid-value {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin-top: 2px;
        }

        .lettre-motivation {
          background: #fefcf8;
          border: 1px solid #eef2f0;
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 28px;
        }

        .lettre-motivation strong {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #8B5A2B;
          margin-bottom: 10px;
        }

        .lettre-motivation strong i {
          font-size: 18px;
        }

        .lettre-motivation p {
          font-size: 14px;
          line-height: 1.7;
          color: #334155;
          white-space: pre-wrap;
          max-height: 160px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .lettre-motivation p::-webkit-scrollbar { width: 3px; }
        .lettre-motivation p::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

        .modal-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
        }

        .btn-close-modal {
          padding: 12px 32px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          border-radius: 40px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-close-modal:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(93, 58, 26, 0.3);
          gap: 14px;
        }

        .btn-close-modal i {
          font-size: 16px;
        }

        /* ========== FOOTER ========== */
        .footer {
          background: #1a1a1a;
          padding: 60px 32px 32px;
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
        @media (max-width: 1100px) {
          .candidatures-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .offres-recommended-grid-premium { grid-template-columns: repeat(2, 1fr); }
          .tips-grid-premium { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .search-card { flex-direction: column; border-radius: 32px; padding: 16px; }
          .search-field { width: 100%; }
          .filter-chips { width: 100%; justify-content: center; flex-wrap: wrap; }
          .clear-search { position: absolute; right: 55px; top: 25px; }
        }
        @media (max-width: 768px) {
          .candidatures-grid { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: 1fr; gap: 16px; padding: 0 16px; }
          .stat-number { font-size: 28px; }
          .section-recommended-premium { padding: 40px 16px; }
          .section-header-recommended-premium h2 { font-size: 26px; }
          .offres-recommended-grid-premium { grid-template-columns: 1fr; }
          .hero-title { font-size: 32px; }
          .modal-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 16px; }
          .modal-grid-value { font-size: 14px; }
          .modal-actions { flex-direction: column; }
          .btn-close-modal { justify-content: center; width: 100%; padding: 14px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .notification-dropdown { width: 320px; right: -50px; }
          .recommended-card-bg-premium { min-height: 320px; }
          .section-tips-premium { padding: 60px 20px 40px; }
          .section-header-tips-premium h2 { font-size: 28px; }
          .section-header-tips-premium p { font-size: 16px; }
          .tips-grid-premium { grid-template-columns: 1fr; gap: 20px; }
          .tip-card-premium { padding: 24px 20px; }
          .tip-number { font-size: 36px; }
          .tip-icon-premium { width: 60px; height: 60px; }
          .tip-icon-premium i { font-size: 26px; }
          .btn-tips-premium { padding: 12px 28px; font-size: 14px; }
          .modal { max-width: 100%; border-radius: 24px 24px 0 0; max-height: 95vh; margin: 0; }
          .modal-image { height: 160px; border-radius: 24px 24px 0 0; }
          .modal-image::after { border-radius: 24px 24px 0 0; }
          .modal-content { padding: 24px 20px 28px; }
          .modal-title { font-size: 22px; }
        }
        @media (max-width: 640px) {
          .card-bg { min-height: 280px; }
          .card-content { padding: 16px; }
          .card-title { font-size: 16px; }
          .card-meta { gap: 10px; }
          .card-meta-item { font-size: 11px; }
          .notification-dropdown { width: 300px; right: -60px; }
          .tip-card-premium h4 { font-size: 18px; }
          .tip-card-premium p { font-size: 13px; }
        }
        @media (max-width: 480px) {
          .modal-image { height: 130px; padding: 12px; }
          .modal-content { padding: 16px 14px 20px; }
          .modal-title { font-size: 18px; }
          .modal-subtitle { font-size: 13px; }
          .modal-grid { gap: 8px; padding: 12px; }
          .modal-grid-item i { font-size: 16px; }
          .modal-grid-value { font-size: 12px; }
          .lettre-motivation { padding: 14px 16px; }
          .lettre-motivation p { font-size: 13px; max-height: 120px; }
          .modal-badge { font-size: 12px; padding: 5px 12px; }
          .btn-close-modal { font-size: 13px; padding: 12px; }
          .tip-card-premium h4 { font-size: 18px; }
          .tip-card-premium p { font-size: 13px; }
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
                  <div className="user-avatar">
                    {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
                  </div>
                  <span>{user.prenom}</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className="user-dropdown">
                  <Link to={getDashboardLink()}><i className="fas fa-tachometer-alt"></i> Tableau de bord</Link>
                  <Link to="/profile"><i className="fas fa-user"></i> Mon profil</Link>
                  {user.role === 'etudiant' && (
                    <>
                      <Link to="/mes-candidatures" className="active"><i className="fas fa-file-alt"></i> Mes candidatures</Link>
                      <Link to="/recommandations"><i className="fas fa-robot"></i> Recommandations IA</Link>
                      <Link to="/formations"><i className="fas fa-graduation-cap"></i> Mes formations</Link>
                      <Link to="/competences"><i className="fas fa-code"></i> Mes compétences</Link>
                      <Link to="/mon-cv"><i className="fas fa-file-pdf"></i> Mon CV</Link>
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

      {/* ========== MOBILE MENU ========== */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <div style={{ padding: '20px', textAlign: 'right' }}>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#4a5568', padding: '12px', borderRadius: '12px' }}>Accueil</Link>
          <Link to="/offres" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#4a5568', padding: '12px', borderRadius: '12px' }}>Offres</Link>
          <Link to="/mes-candidatures" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#8B5A2B', padding: '12px', borderRadius: '12px', background: '#fef3e8' }}>Mes candidatures</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* ========== HERO ========== */}
      <section className="hero-candidatures">
        <div className="hero-candidatures-bg"></div>
        <div className="hero-candidatures-overlay"></div>
        <div className="hero-candidatures-container">
          <div className="hero-candidatures-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Suivi des candidatures
            </div>
            <h1 className="hero-title">
              Mes <span className="hero-name">candidatures</span>
            </h1>
            <p className="hero-desc">
              Suivez l'évolution de vos candidatures et restez informé des réponses des recruteurs
            </p>
            <div className="hero-buttons">
              <Link to="/offres" className="hero-btn-primary">
                <i className="fas fa-search"></i> Découvrir des offres
              </Link>
              <Link to="/profile" className="hero-btn-secondary">
                <i className="fas fa-user-edit"></i> Compléter mon profil
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-hero">
                <span className="stat-number-hero">{stats.total}</span>
                <span className="stat-label-hero">Total</span>
              </div>
              <div className="stat-hero">
                <span className="stat-number-hero">{stats.enAttente}</span>
                <span className="stat-label-hero">En attente</span>
              </div>
              <div className="stat-hero">
                <span className="stat-number-hero">{stats.acceptees}</span>
                <span className="stat-label-hero">Acceptées</span>
              </div>
              <div className="stat-hero">
                <span className="stat-number-hero">{stats.refusees}</span>
                <span className="stat-label-hero">Refusées</span>
              </div>
            </div>
          </div>
          <div className="hero-avatar">
            <div className="avatar-wrapper">
              <div className="avatar-ring"></div>
              <div className="avatar-circle">
                {randomAvatar ? (
                  <img src={randomAvatar} alt="Avatar candidatures" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-initials">
                    <i className="fas fa-file-alt"></i>
                  </div>
                )}
                <div className="avatar-badge">
                  <i className="fas fa-chart-line"></i>
                </div>
              </div>
            </div>
            <div className="hero-quote">
              <i className="fas fa-quote-left"></i> “Chaque candidature est une opportunité”
            </div>
          </div>
        </div>
      </section>

      {/* ========== SEARCH BAR ========== */}
      <div className="search-wrapper">
        <div className="search-card">
          <div className="search-field">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Rechercher par offre, entreprise ou ville..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="filter-chips">
            <div 
              className={`filter-chip ${selectedStatus === 'tous' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('tous')}
            >
              <i className="fas fa-list"></i> Toutes
            </div>
            <div 
              className={`filter-chip ${selectedStatus === 'en_attente' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('en_attente')}
            >
              <i className="fas fa-clock"></i> En attente
            </div>
            <div 
              className={`filter-chip ${selectedStatus === 'acceptée' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('acceptée')}
            >
              <i className="fas fa-check-circle"></i> Acceptées
            </div>
            <div 
              className={`filter-chip ${selectedStatus === 'refusée' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('refusée')}
            >
              <i className="fas fa-times-circle"></i> Refusées
            </div>
          </div>
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-file-alt"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total candidatures</div>
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
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-times-circle"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.refusees}</div>
            <div className="stat-label">Refusées</div>
          </div>
        </div>
      </div>

      {/* ========== CANDIDATURES GRID ========== */}
      {filteredCandidatures.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-inbox"></i>
          </div>
          <h3 className="empty-title">Aucune candidature trouvée</h3>
          <p className="empty-desc">
            {searchTerm || selectedStatus !== 'tous' 
              ? "Essayez d'autres critères de recherche" 
              : "Vous n'avez pas encore postulé à une offre"}
          </p>
          {!searchTerm && selectedStatus === 'tous' && (
            <Link to="/offres" className="btn-decouvrir">
              <i className="fas fa-search"></i> Découvrir les offres
            </Link>
          )}
        </div>
      ) : (
        <div className="candidatures-grid">
          {filteredCandidatures.map((candidature, idx) => (
            <div 
              key={candidature.idCandidature} 
              className="candidature-card" 
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={() => handleViewDetails(candidature)}
            >
              <div className="card-bg" style={{ backgroundImage: `url(${getImageForCandidature(candidature.idCandidature)})` }}>
                <div className="card-overlay"></div>
                <div className="card-content">
                  <div className="card-header">
                    <div className="company-logo">
                      {candidature.offre?.entreprise?.nom?.charAt(0) || 'E'}
                    </div>
                    <div className="status-badge" style={{ backgroundColor: getStatusColor(candidature.statut) + '30', borderColor: getStatusColor(candidature.statut) + '50' }}>
                      <i className={getStatusIcon(candidature.statut)} style={{ color: getStatusColor(candidature.statut) }}></i>
                      <span style={{ color: getStatusColor(candidature.statut) }}>{getStatusLabel(candidature.statut)}</span>
                    </div>
                  </div>
                  <h3 className="card-title">{candidature.offre?.titre || 'Offre'}</h3>
                  <div className="company-name">
                    <i className="fas fa-building"></i>
                    <span>{candidature.offre?.entreprise?.nom || 'Entreprise'}</span>
                  </div>
                  <div className="card-meta">
                    <div className="card-meta-item">
                      <i className="fas fa-calendar-alt"></i>
                      <span>{new Date(candidature.dateCandidature).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="card-meta-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{candidature.offre?.ville || 'Non spécifiée'}</span>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="view-link">
                      Voir détails <i className="fas fa-arrow-right"></i>
                    </span>
                    {candidature.statut === 'en_attente' && (
                      <button 
                        className="btn-annuler" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleAnnuler(candidature.idCandidature); 
                        }}
                      >
                        <i className="fas fa-times"></i> Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== RECOMMANDATIONS ========== */}
      <section className="section-recommended-premium">
        <div className="container-recommended-premium">
          <div className="section-header-recommended-premium">
            <span className="section-badge">🎯 Recommandé pour vous</span>
            <h2>Offres qui pourraient vous intéresser</h2>
            <p>Basé sur votre profil, vos compétences et vos centres d'intérêt</p>
          </div>

          {loadingRecommendations ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Analyse de votre profil...</p>
              </div>
            </div>
          ) : recommendedOffres.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-700">Aucune recommandation pour l'instant</h3>
              <p className="text-gray-500 mt-2">Complétez votre profil pour recevoir des suggestions personnalisées.</p>
              <Link to="/profile" className="inline-block mt-4 text-[#8B5A2B] font-medium hover:underline">
                Compléter mon profil →
              </Link>
            </div>
          ) : (
            <>
              <div className="offres-recommended-grid-premium">
                {recommendedOffres.slice(0, 4).map((rec, index) => (
                  <Link to={`/offres/${rec.offre?.idOffre}`} key={index} className="offre-recommended-card-premium">
                    <div className="recommended-card-bg-premium" style={{ backgroundImage: `url(${getImageForOffre(rec.offre?.idOffre || index)})` }}>
                      <div className="recommended-card-overlay-premium"></div>
                      <div className="recommended-card-content-premium">
                        <div className="recommended-card-header-premium">
                          <div className="recommended-company-logo-premium">
                            <span>{rec.offre?.entreprise?.nom?.charAt(0) || 'E'}</span>
                          </div>
                          <div className="recommended-score-badge-premium" style={{ background: getScoreColor(rec.score) + '33', borderColor: getScoreColor(rec.score) + '50' }}>
                            <i className="fas fa-star" style={{ color: getScoreColor(rec.score) }}></i> {Math.round(rec.score)}%
                          </div>
                        </div>
                        <h3 className="recommended-title-premium">{rec.offre?.titre || 'Offre'}</h3>
                        <p className="recommended-company-name-premium">
                          <i className="fas fa-building"></i> {rec.offre?.entreprise?.nom || 'Entreprise'}
                        </p>
                        <div className="recommended-tags-premium">
                          {rec.matching_competences && rec.matching_competences.slice(0, 3).map((comp, i) => (
                            <span key={i}>{comp.nom}</span>
                          ))}
                          {rec.matching_competences && rec.matching_competences.length > 3 && (
                            <span>+{rec.matching_competences.length - 3}</span>
                          )}
                        </div>
                        <div className="recommended-meta-premium">
                          <span><i className="fas fa-map-marker-alt"></i> {rec.offre?.ville || 'Non spécifiée'}</span>
                          <span><i className="fas fa-clock"></i> {rec.offre?.duree || '?'} mois</span>
                        </div>
                        <div className="recommended-card-footer-premium">
                          <span className="recommended-view-link-premium">
                            Voir l’offre <i className="fas fa-arrow-right"></i>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="recommended-action-premium">
                <Link to="/recommandations" className="btn-recommended-all-premium">
                  Voir toutes mes recommandations <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ========== ASTUCES ========== */}
      <section className="section-tips-premium">
        <div className="container-tips-premium">
          <div className="section-header-tips-premium">
            <span className="section-badge">💡 Astuces</span>
            <h2>Boostez vos chances de réussite</h2>
            <p>Des conseils pratiques pour vous démarquer</p>
          </div>
          <div className="tips-grid-premium">
            <div className="tip-card-premium">
              <div className="tip-number">01</div>
              <div className="tip-icon-premium"><i className="fas fa-file-alt"></i></div>
              <h4>CV sur mesure</h4>
              <p>Adaptez votre CV à chaque offre en mettant en avant les compétences demandées par le recruteur.</p>
              <div className="tip-tag">💼 Conseil</div>
            </div>
            <div className="tip-card-premium">
              <div className="tip-number">02</div>
              <div className="tip-icon-premium"><i className="fas fa-comment-dots"></i></div>
              <h4>Lettre percutante</h4>
              <p>Personnalisez votre lettre de motivation, montrez votre connaissance de l'entreprise et votre valeur ajoutée.</p>
              <div className="tip-tag">✍️ Rédaction</div>
            </div>
            <div className="tip-card-premium">
              <div className="tip-number">03</div>
              <div className="tip-icon-premium"><i className="fas fa-users"></i></div>
              <h4>Réseautage actif</h4>
              <p>Connectez-vous avec des recruteurs sur LinkedIn et participez à des événements professionnels.</p>
              <div className="tip-tag">🌐 Networking</div>
            </div>
            <div className="tip-card-premium">
              <div className="tip-number">04</div>
              <div className="tip-icon-premium"><i className="fas fa-chart-line"></i></div>
              <h4>Suivi stratégique</h4>
              <p>Relancez poliment après une semaine d'attente. Un suivi montre votre motivation et votre professionnalisme.</p>
              <div className="tip-tag">📈 Stratégie</div>
            </div>
          </div>
          <div className="tips-cta-premium">
            <Link to="/blog" className="btn-tips-premium">
              Lire plus de conseils <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== DETAIL MODAL ========== */}
      {showDetailModal && selectedCandidature && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div 
              className="modal-image" 
              style={{ 
                backgroundImage: `url(${getImageForCandidature(selectedCandidature.idCandidature)})` 
              }}
            >
              <div 
                className="modal-badge" 
                style={{ 
                  backgroundColor: getStatusColor(selectedCandidature.statut) + '30', 
                  border: '1px solid ' + getStatusColor(selectedCandidature.statut) + '50' 
                }}
              >
                <i className={getStatusIcon(selectedCandidature.statut)} style={{ color: getStatusColor(selectedCandidature.statut) }}></i>
                <span style={{ color: getStatusColor(selectedCandidature.statut) }}>
                  {getStatusLabel(selectedCandidature.statut)}
                </span>
              </div>
            </div>
            <div className="modal-content">
              <h2 className="modal-title">{selectedCandidature.offre?.titre || 'Offre'}</h2>
              <div className="modal-subtitle">
                <i className="fas fa-building"></i>
                <span>{selectedCandidature.offre?.entreprise?.nom || 'Entreprise'}</span>
              </div>
              
              <div className="modal-grid">
                <div className="modal-grid-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <div className="modal-grid-label">Ville</div>
                  <div className="modal-grid-value">{selectedCandidature.offre?.ville || 'Non spécifiée'}</div>
                </div>
                <div className="modal-grid-item">
                  <i className="fas fa-calendar-alt"></i>
                  <div className="modal-grid-label">Date de candidature</div>
                  <div className="modal-grid-value">{new Date(selectedCandidature.dateCandidature).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="modal-grid-item">
                  <i className="fas fa-clock"></i>
                  <div className="modal-grid-label">Durée du stage</div>
                  <div className="modal-grid-value">{selectedCandidature.offre?.duree || 'Non spécifiée'} mois</div>
                </div>
                <div className="modal-grid-item">
                  <i className="fas fa-tag"></i>
                  <div className="modal-grid-label">Type</div>
                  <div className="modal-grid-value">{selectedCandidature.offre?.typeStage || 'Stage'}</div>
                </div>
              </div>

              <div className="lettre-motivation">
                <strong><i className="fas fa-envelope"></i> Lettre de motivation</strong>
                <p>{selectedCandidature.lettreMotivation || 'Aucune lettre de motivation fournie.'}</p>
              </div>

              <div className="modal-actions">
                <button className="btn-close-modal" onClick={() => setShowDetailModal(false)}>
                  <i className="fas fa-times"></i> Fermer
                </button>
              </div>
            </div>
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
              <Link to="/mes-candidatures">Mes candidatures</Link>
              <Link to="/formations">Mes formations</Link>
              <Link to="/competences">Mes compétences</Link>
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