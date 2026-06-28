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

// Images pour la section "Actualités & Tendances du recrutement"
const trendsImages = [
  '/images/formation11.png',
  '/images/formation12.png',
  '/images/formation13.png',
  '/images/formation14.png',
];

// Images pour la section "Processus de sélection" (Timeline)
const processImages = [
   '/images/formation11.png',
  '/images/formation12.png',
  '/images/formation13.png',
  '/images/formation14.png',
  '/images/formation5.png',
  '/images/formation3.png',
];

export default function CandidaturesRecues() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [candidatures, setCandidatures] = useState([]);
  const [filteredCandidatures, setFilteredCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [randomAvatar, setRandomAvatar] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('tous');
  const [selectedOffre, setSelectedOffre] = useState('');
  const [offres, setOffres] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCandidature, setSelectedCandidature] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    acceptees: 0,
    refusees: 0
  });

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // ========== ÉTATS POUR LES NOTIFICATIONS ==========
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchData();
    fetchNotifications();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const randomIndex = Math.floor(Math.random() * avatarImages.length);
    setRandomAvatar(avatarImages[randomIndex]);

    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    filterCandidatures();
  }, [searchTerm, selectedStatus, selectedOffre, candidatures]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedOffre]);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les offres du recruteur
      const offresRes = await api.get('/recruteur/offres');
      const offresData = offresRes.data.data || offresRes.data || [];
      setOffres(offresData);
      
      // Récupérer les candidatures avec toutes les relations
      const candidaturesRes = await api.get('/recruteur/candidatures');
      const data = candidaturesRes.data.data || candidaturesRes.data || [];
      setCandidatures(data);
      
      // Calculer les statistiques
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
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filterCandidatures = () => {
    let filtered = [...candidatures];
    
    if (selectedStatus !== 'tous') {
      filtered = filtered.filter(c => c.statut === selectedStatus);
    }
    
    if (selectedOffre) {
      filtered = filtered.filter(c => c.offre?.idOffre === parseInt(selectedOffre));
    }
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.offre?.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.etudiant?.user?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.etudiant?.user?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.offre?.ville?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCandidatures(filtered);
  };

  const handleAccepter = async (candidature) => {
    if (!confirm(`Accepter la candidature de ${candidature.etudiant?.user?.prenom} ${candidature.etudiant?.user?.nom} ?`)) return;
    
    setActionLoading(true);
    try {
      await api.put(`/recruteur/candidatures/${candidature.idCandidature}/accepter`);
      toast.success('Candidature acceptée avec succès');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuser = async (candidature) => {
    if (!confirm(`Refuser la candidature de ${candidature.etudiant?.user?.prenom} ${candidature.etudiant?.user?.nom} ?`)) return;
    
    setActionLoading(true);
    try {
      await api.put(`/recruteur/candidatures/${candidature.idCandidature}/refuser`);
      toast.success('Candidature refusée');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors du refus');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (candidature) => {
    setSelectedCandidature(candidature);
    setShowDetailModal(true);
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidatures = filteredCandidatures.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCandidatures.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
          <p className="mt-6 text-gray-600 font-medium">Chargement des candidatures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candidatures-recues-page">
      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .candidatures-recues-page {
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

        /* ========== HERO PREMIUM ========== */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-candidatures-recues {
          position: relative;
          min-height: 850px;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding-top: 50px;
        }
        .hero-candidatures-recues-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/do4.png');
          background-size: cover;
          background-position: center;
          z-index: 0;
        }
        .hero-candidatures-recues-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%);
          z-index: 1;
        }
        .hero-candidatures-recues-container {
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
        .hero-candidatures-recues-content {
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
          .hero-candidatures-recues-container { flex-direction: column; text-align: center; gap: 50px; }
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

        /* ========== STATS GRID ========== */
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
        .stat-card:nth-child(1) { background-image: url('images/.png'); }
        .stat-card:nth-child(2) { background-image: url('images/png'); }
        .stat-card:nth-child(3) { background-image: url('images/png'); }
        .stat-card:nth-child(4) { background-image: url('images/.png'); }
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

        /* ========== SEARCH BAR ========== */
        .search-wrapper-candidatures {
          max-width: 1280px;
          margin: -28px auto 0;
          padding: 0 90px;
          position: relative;
          z-index: 10;
        }
        .search-card-candidatures {
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
        .search-field-candidatures {
          flex: 2;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          background: #f8fafc;
          border-radius: 50px;
          transition: all 0.2s;
        }
        .search-field-candidatures:focus-within {
          background: white;
          box-shadow: 0 0 0 2px #8B5A2B;
        }
        .search-field-candidatures i { color: #94a3b8; font-size: 18px; }
        .search-field-candidatures input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          background: transparent;
          font-weight: 500;
        }
        .search-field-candidatures input::placeholder {
          color: #94a3b8;
        }
        .filter-chips-candidatures {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 4px;
        }
        .filter-chip-candidatures {
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
        .filter-chip-candidatures:hover { background: #e2e8f0; transform: translateY(-1px); }
        .filter-chip-candidatures.active {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          box-shadow: 0 4px 12px rgba(93, 58, 26, 0.2);
        }
        .filter-chip-candidatures i { font-size: 12px; }
        .clear-search-candidatures {
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
        .clear-search-candidatures:hover {
          background: #fee2e2;
          color: #dc2626;
          transform: scale(1.05);
        }
        select.filter-chip-candidatures {
          appearance: none;
          background: #f1f5f9;
          border: none;
          padding: 10px 20px;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          outline: none;
        }
        select.filter-chip-candidatures:hover {
          background: #e2e8f0;
        }
        select.filter-chip-candidatures:focus {
          background: #e2e8f0;
        }

        /* ========== CANDIDATURES GRID ========== */
        .candidatures-grid {
          max-width: 1280px;
          margin: 40px auto 0;
          padding: 0 90px 60px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        .candidature-card-premium {
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
        .candidature-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.15);
          border-color: transparent;
        }
        .card-image-premium {
          position: relative;
          height: 200px;
          background-size: cover;
          background-position: center;
          transition: transform 0.4s;
        }
        .candidature-card-premium:hover .card-image-premium { transform: scale(1.05); }
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
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .candidature-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #0f172a;
        }
        .etudiant-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 13px;
          margin-bottom: 12px;
        }
        .etudiant-info i { color: #8B5A2B; }
        .offre-info {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-top: 1px solid #eef2f0;
          border-bottom: 1px solid #eef2f0;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
        }
        .info-item i { color: #8B5A2B; }
        .card-actions {
          display: flex;
          gap: 10px;
          margin-top: auto;
        }
        .btn-accepter {
          flex: 1;
          background: #f0fdf4;
          color: #10b981;
          border: none;
          padding: 10px;
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
        .btn-accepter:hover { background: #10b981; color: white; gap: 8px; }
        .btn-refuser {
          flex: 1;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          padding: 10px;
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
        .btn-refuser:hover { background: #dc2626; color: white; gap: 8px; }
        .btn-details {
          flex: 1;
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 10px;
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
        .btn-details:hover { background: #8B5A2B; color: white; gap: 8px; }

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

        /* ========== MODAL DÉTAILS REDESIGN ========== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(12px);
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeInModal 0.3s ease;
        }

        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content-premium {
          background: white;
          border-radius: 32px;
          max-width: 750px;
          width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          padding: 0;
          animation: slideUpModal 0.3s ease;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
        }

        @keyframes slideUpModal {
          from { transform: translateY(30px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .modal-content-premium::-webkit-scrollbar {
          width: 6px;
        }

        .modal-content-premium::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .modal-content-premium::-webkit-scrollbar-thumb {
          background: #8B5A2B;
          border-radius: 10px;
        }

        /* ========== MODAL HEADER ========== */
        .modal-header-premium {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 28px 32px 20px;
          border-bottom: 1px solid #eef2f0;
          background: linear-gradient(135deg, #faf7f2, #f5ede4);
          border-radius: 32px 32px 0 0;
        }

        .modal-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .modal-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(93, 58, 26, 0.3);
        }

        .modal-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .modal-header-left h2 {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .modal-subtitle {
          font-size: 14px;
          color: #6c757d;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .modal-subtitle i {
          color: #8B5A2B;
        }

        .dot-separator {
          color: #d1d5db;
          margin: 0 4px;
        }

        .modal-close {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.04);
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #6c757d;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-close:hover {
          background: #fee2e2;
          color: #dc2626;
          transform: rotate(90deg);
        }

        /* ========== MODAL STATUS BANNER ========== */
        .modal-status-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          background: #f8fafc;
          border-bottom: 1px solid #eef2f0;
          flex-wrap: wrap;
          gap: 12px;
        }

        .status-badge-large {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 20px;
          border-radius: 40px;
          color: white;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .status-badge-large i {
          font-size: 16px;
        }

        .candidature-date {
          font-size: 13px;
          color: #6c757d;
        }

        .candidature-date i {
          color: #8B5A2B;
          margin-right: 6px;
        }

        /* ========== MODAL SECTIONS ========== */
        .modal-section {
          padding: 20px 32px;
          border-bottom: 1px solid #eef2f0;
        }

        .modal-section:last-of-type {
          border-bottom: none;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .section-title i {
          font-size: 18px;
          color: #8B5A2B;
          width: 28px;
          height: 28px;
          background: #fef3e8;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .section-title h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }

        /* ========== INFO GRID - ÉTUDIANT ========== */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .info-item-modal {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 12px;
          transition: background 0.2s;
        }

        .info-item-modal:hover {
          background: #fef3e8;
        }

        .info-label {
          font-size: 11px;
          font-weight: 600;
          color: #8B5A2B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .info-label i {
          font-size: 12px;
        }

        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
        }

        /* ========== ENTREPRISE INFO ========== */
        .entreprise-card-modal {
          background: linear-gradient(135deg, #fef3e8, #faf7f2);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #f0e6da;
        }

        .entreprise-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }

        .entreprise-icon {
          width: 48px;
          height: 48px;
          background: #8B5A2B;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .entreprise-icon i {
          font-size: 22px;
          color: white;
        }

        .entreprise-card-header h4 {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .entreprise-card-header p {
          font-size: 13px;
          color: #6c757d;
        }

        .entreprise-card-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding-top: 12px;
          border-top: 1px solid rgba(139, 90, 43, 0.15);
        }

        .entreprise-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #4a5568;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 8px;
        }

        .entreprise-detail i {
          color: #8B5A2B;
          font-size: 14px;
        }

        /* ========== FORMATION LIST ========== */
        .formation-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .formation-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 16px;
          background: #f8fafc;
          border-radius: 14px;
          transition: all 0.2s;
          border-left: 3px solid #8B5A2B;
        }

        .formation-item:hover {
          background: #fef3e8;
        }

        .formation-icon {
          width: 40px;
          height: 40px;
          background: #fef3e8;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .formation-icon i {
          font-size: 18px;
          color: #8B5A2B;
        }

        .formation-info h4 {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 2px;
        }

        .formation-info p {
          font-size: 13px;
          color: #6c757d;
          margin-bottom: 4px;
        }

        .formation-info p i {
          color: #8B5A2B;
          margin-right: 4px;
        }

        .formation-date {
          font-size: 12px;
          color: #94a3b8;
        }

        .formation-date i {
          margin-right: 4px;
        }

        /* ========== COMPÉTENCES ========== */
        .competences-list-modal {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .competence-tag-modal {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f8fafc;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 500;
          color: #1a1a1a;
          border: 1px solid #eef2f0;
          transition: all 0.2s;
        }

        .competence-tag-modal:hover {
          background: #fef3e8;
          border-color: #8B5A2B;
          transform: translateY(-2px);
        }

        .competence-level {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 30px;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ========== OFFRE CARD ========== */
        .offre-card-modal {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #eef2f0;
        }

        .offre-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }

        .offre-icon {
          width: 48px;
          height: 48px;
          background: #fef3e8;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .offre-icon i {
          font-size: 22px;
          color: #8B5A2B;
        }

        .offre-card-header h4 {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .offre-card-header p {
          font-size: 13px;
          color: #6c757d;
        }

        .offre-card-header p i {
          color: #8B5A2B;
          margin-right: 4px;
        }

        .offre-card-details {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          padding-top: 12px;
          border-top: 1px solid #eef2f0;
        }

        .offre-detail {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6c757d;
        }

        .offre-detail i {
          color: #8B5A2B;
        }

        /* ========== LETTRE DE MOTIVATION ========== */
        .motivation-section {
          background: #fafbfc;
        }

        .motivation-content {
          background: white;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid #eef2f0;
          position: relative;
        }

        .motivation-content::before {
          content: '"';
          position: absolute;
          top: 8px;
          left: 16px;
          font-size: 48px;
          color: rgba(139, 90, 43, 0.1);
          font-family: 'Georgia', serif;
        }

        .motivation-content p {
          font-size: 14px;
          line-height: 1.8;
          color: #4a5568;
          padding-left: 20px;
          position: relative;
          z-index: 1;
        }

        /* ========== MODAL ACTIONS ========== */
        .modal-actions-premium {
          display: flex;
          gap: 12px;
          padding: 20px 32px 28px;
          border-top: 1px solid #eef2f0;
          background: #f8fafc;
          border-radius: 0 0 32px 32px;
        }

        .modal-actions-premium.single-action {
          justify-content: center;
        }

        .btn-accepter-modal {
          flex: 1;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 16px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn-accepter-modal:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
          gap: 14px;
        }

        .btn-refuser-modal {
          flex: 1;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 16px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn-refuser-modal:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
          gap: 14px;
        }

        .btn-close-modal {
          flex: 1;
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 14px 24px;
          border-radius: 16px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-close-modal:hover {
          background: #e2e8f0;
          gap: 12px;
        }

        /* ========== RESPONSIVE MODAL ========== */
        @media (max-width: 768px) {
          .modal-content-premium {
            max-width: 100%;
            border-radius: 24px;
            max-height: 95vh;
          }

          .modal-header-premium {
            padding: 20px;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .modal-header-left {
            width: 100%;
          }

          .modal-close {
            align-self: flex-end;
          }

          .modal-status-banner {
            padding: 12px 20px;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .modal-section {
            padding: 16px 20px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .entreprise-card-details {
            grid-template-columns: 1fr;
          }

          .modal-actions-premium {
            padding: 16px 20px 20px;
            flex-direction: column;
          }

          .btn-accepter-modal,
          .btn-refuser-modal,
          .btn-close-modal {
            padding: 12px;
            font-size: 13px;
          }

          .modal-avatar {
            width: 50px;
            height: 50px;
            font-size: 18px;
          }

          .modal-header-left h2 {
            font-size: 18px;
          }

          .offre-card-details {
            gap: 12px;
          }

          .formation-item {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 480px) {
          .modal-content-premium {
            border-radius: 16px;
          }

          .modal-header-premium {
            padding: 16px;
          }

          .modal-section {
            padding: 12px 16px;
          }

          .modal-status-banner {
            padding: 10px 16px;
          }

          .modal-actions-premium {
            padding: 12px 16px 16px;
          }

          .competences-list-modal {
            gap: 6px;
          }

          .competence-tag-modal {
            font-size: 11px;
            padding: 6px 12px;
          }
        }

        /* ========== SECTION: ACTUALITÉS & TENDANCES DU RECRUTEMENT ========== */
        .trends-section {
          padding: 80px 90px;
          margin-top: 60px;
          background: #5e554dff;
          position: relative;
          overflow: hidden;
        }

        .trends-section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(ellipse at 30% 50%, rgba(139, 90, 43, 0.08) 0%, transparent 60%);
          animation: rotateGlow 20s linear infinite;
          z-index: 0;
        }

        @keyframes rotateGlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .trends-container {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .trends-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .trends-badge {
          display: inline-block;
          background: rgba(255, 217, 102, 0.12);
          backdrop-filter: blur(4px);
          padding: 8px 24px;
          border-radius: 40px;
          font-size: 12px;
          font-weight: 600;
          color: #ffd966;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          border: 1px solid rgba(255, 217, 102, 0.15);
          margin-bottom: 16px;
        }

        .trends-header h2 {
          font-size: 42px;
          font-weight: 800;
          color: white;
          margin-bottom: 16px;
        }

        .trends-header h2 .highlight {
          background: linear-gradient(135deg, #ffd966, #ffb347);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .trends-header .subtitle {
          font-size: 17px;
          color: rgba(255, 255, 255, 0.7);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .trends-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .trends-card {
          background:rgba(104, 91, 91, 0.7);;
          backdrop-filter: blur(12px);
          border-radius: 24px;
          padding: 32px 28px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          position: relative;
          overflow: hidden;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .trends-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(139, 90, 43, 0.1), rgba(255, 217, 102, 0.02));
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .trends-card:hover {
          transform: translateY(-8px);
          border-color: rgba(255, 217, 102, 0.2);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .trends-card:hover::before {
          opacity: 1;
        }

        .trends-card .card-icon {
          width: 72px;
          height: 72px;
          background: rgba(255, 217, 102, 0.08);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 32px;
          color: #ffd966;
          border: 1px solid rgba(255, 217, 102, 0.1);
          transition: all 0.4s ease;
        }

        .trends-card:hover .card-icon {
          background: rgba(255, 217, 102, 0.15);
          transform: scale(1.05) rotate(-5deg);
        }

        .trends-card .stat-number {
          font-size: 44px;
          font-weight: 800;
          color: #ffd966;
          line-height: 1;
          margin-bottom: 8px;
        }

        .trends-card .stat-suffix {
          font-size: 24px;
          font-weight: 700;
          color: #ffb347;
        }

        .trends-card .stat-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          margin-bottom: 4px;
        }

        .trends-card .stat-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.4;
        }

        .trends-card .trend-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .trends-card .trend-indicator.positive {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }

        .trends-card .trend-indicator.negative {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .trends-card .trend-indicator.stable {
          background: rgba(255, 217, 102, 0.1);
          color: #ffd966;
        }

        .trends-card .card-number {
          position: absolute;
          bottom: 12px;
          right: 20px;
          font-size: 72px;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.02);
          z-index: 0;
          pointer-events: none;
        }

        /* Ligne de progression au hover */
        .trends-card .progress-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #ffd966, #ffb347);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.6s ease;
        }

        .trends-card:hover .progress-line {
          transform: scaleX(1);
        }

        /* Badge "Nouveau" sur la première carte */
        .trends-card .new-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background: linear-gradient(135deg, #ffd966, #ffb347);
          color: #1a1a2e;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 12px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          z-index: 2;
        }

        @media (max-width: 1200px) {
          .trends-section { padding: 60px 40px; }
          .trends-grid { grid-template-columns: repeat(2, 1fr); }
          .trends-header h2 { font-size: 34px; }
        }

        @media (max-width: 768px) {
          .trends-section { padding: 40px 20px; }
          .trends-grid { grid-template-columns: 1fr; }
          .trends-header h2 { font-size: 28px; }
          .trends-header .subtitle { font-size: 15px; }
          .trends-card { min-height: 220px; padding: 24px 20px; }
          .trends-card .stat-number { font-size: 36px; }
        }

        @media (max-width: 480px) {
          .trends-section { padding: 30px 16px; }
          .trends-card .stat-number { font-size: 32px; }
          .trends-card .card-icon { width: 60px; height: 60px; font-size: 26px; }
        }

        /* ========== SECTION 2: PROCESSUS DE SÉLECTION - VERSION TIMELINE ========== */
        .process-section {
          padding: 80px 90px;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
          position: relative;
          overflow: hidden;
        }

        .process-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        .process-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .process-header .badge {
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

        .process-header h2 {
          font-size: 40px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 12px;
        }

        .process-header h2 .highlight {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .process-header p {
          font-size: 16px;
          color: #6c757d;
        }

        /* ========== TIMELINE ========== */
        .process-timeline {
          position: relative;
          padding: 20px 0;
          max-width: 1000px;
          margin: 0 auto;
        }

        .timeline-line {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(180deg, #8B5A2B, #ffd966, #8B5A2B);
          transform: translateX(-50%);
          border-radius: 4px;
          box-shadow: 0 0 20px rgba(139, 90, 43, 0.2);
          z-index: 0;
        }

        .timeline-item {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 50px;
          z-index: 1;
        }

        .timeline-item:last-child {
          margin-bottom: 0;
        }

        .timeline-item.left {
          flex-direction: row;
          padding-right: calc(50% + 30px);
        }

        .timeline-item.right {
          flex-direction: row-reverse;
          padding-left: calc(50% + 30px);
        }

        .timeline-dot {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          box-shadow: 0 0 0 4px rgba(139, 90, 43, 0.2), 0 8px 24px rgba(0, 0, 0, 0.15);
          transition: all 0.4s ease;
        }

        .timeline-item:hover .timeline-dot {
          transform: translate(-50%, -50%) scale(1.15);
          box-shadow: 0 0 0 8px rgba(139, 90, 43, 0.15), 0 12px 32px rgba(0, 0, 0, 0.2);
        }

        .timeline-dot span {
          color: white;
          font-size: 16px;
          font-weight: 800;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .timeline-arrow {
          position: absolute;
          width: 30px;
          height: 30px;
          background: white;
          transform: rotate(45deg);
          top: 50%;
          border: 1px solid #f0f2f5;
          z-index: 1;
        }

        .timeline-item.left .timeline-arrow {
          right: calc(50% - 15px);
          border-top: none;
          border-right: none;
          border-radius: 0 0 0 8px;
        }

        .timeline-item.right .timeline-arrow {
          left: calc(50% - 15px);
          border-bottom: none;
          border-left: none;
          border-radius: 0 8px 0 0;
        }

        .timeline-card {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          min-height: 200px;
          width: 100%;
          background-size: cover;
          background-position: center;
          transition: all 0.4s ease;
          border: 2px solid transparent;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
        }

        .timeline-item.left .timeline-card {
          border-radius: 24px 24px 24px 4px;
        }

        .timeline-item.right .timeline-card {
          border-radius: 24px 24px 4px 24px;
        }

        .timeline-card:hover {
          transform: translateY(-5px);
          border-color: rgba(139, 90, 43, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }

        .timeline-card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.3) 0%,
            rgba(0, 0, 0, 0.7) 60%,
            rgba(0, 0, 0, 0.85) 100%
          );
          z-index: 0;
          transition: background 0.4s ease;
        }

        .timeline-card:hover .timeline-card-overlay {
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(93, 58, 26, 0.6) 60%,
            rgba(93, 58, 26, 0.85) 100%
          );
        }

        .timeline-card-content {
          position: relative;
          z-index: 1;
          padding: 28px 32px;
          color: white;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .step-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 217, 102, 0.15);
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: #ffd966;
          border: 1px solid rgba(255, 217, 102, 0.2);
          margin-bottom: 12px;
          width: fit-content;
          backdrop-filter: blur(4px);
        }

        .timeline-card-content h4 {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 8px;
          color: white;
        }

        .timeline-card-content p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.6;
          max-width: 90%;
        }

        .timeline-item {
          opacity: 0;
          transform: translateY(30px);
          animation: timelineFadeIn 0.8s ease forwards;
        }

        .timeline-item:nth-child(1) { animation-delay: 0.1s; }
        .timeline-item:nth-child(2) { animation-delay: 0.2s; }
        .timeline-item:nth-child(3) { animation-delay: 0.3s; }
        .timeline-item:nth-child(4) { animation-delay: 0.4s; }
        .timeline-item:nth-child(5) { animation-delay: 0.5s; }
        .timeline-item:nth-child(6) { animation-delay: 0.6s; }

        @keyframes timelineFadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .timeline-end {
          position: relative;
          display: flex;
          justify-content: center;
          padding-top: 20px;
          z-index: 1;
        }

        .timeline-end-dot {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #ffd966, #ffb347);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 4px rgba(255, 217, 102, 0.2), 0 8px 24px rgba(0, 0, 0, 0.1);
          animation: pulseEnd 2s infinite;
        }

        @keyframes pulseEnd {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 4px rgba(255, 217, 102, 0.2), 0 8px 24px rgba(0, 0, 0, 0.1);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 0 0 8px rgba(255, 217, 102, 0.1), 0 12px 32px rgba(0, 0, 0, 0.15);
          }
        }

        .timeline-end-dot i {
          font-size: 22px;
          color: #5D3A1A;
        }

        /* ========== RESPONSIVE TIMELINE ========== */
        @media (max-width: 1024px) {
          .process-section {
            padding: 60px 40px;
          }
          
          .process-header h2 {
            font-size: 32px;
          }

          .timeline-item.left,
          .timeline-item.right {
            padding: 0 0 0 80px;
            flex-direction: row;
          }

          .timeline-item.left .timeline-card,
          .timeline-item.right .timeline-card {
            border-radius: 24px;
          }

          .timeline-item.left .timeline-arrow,
          .timeline-item.right .timeline-arrow {
            display: none;
          }

          .timeline-line {
            left: 30px;
          }

          .timeline-dot {
            left: 30px;
            width: 48px;
            height: 48px;
            transform: translate(-50%, -50%);
          }

          .timeline-item:hover .timeline-dot {
            transform: translate(-50%, -50%) scale(1.1);
          }

          .timeline-dot span {
            font-size: 13px;
          }

          .timeline-card-content p {
            max-width: 100%;
          }

          .timeline-card-content h4 {
            font-size: 18px;
          }

          .timeline-end {
            padding-left: 30px;
            justify-content: flex-start;
          }
        }

        @media (max-width: 768px) {
          .process-section {
            padding: 40px 20px;
          }

          .process-header h2 {
            font-size: 28px;
          }

          .process-header p {
            font-size: 14px;
          }

          .timeline-item {
            margin-bottom: 30px;
          }

          .timeline-item.left,
          .timeline-item.right {
            padding-left: 60px;
          }

          .timeline-line {
            left: 20px;
          }

          .timeline-dot {
            left: 20px;
            width: 40px;
            height: 40px;
          }

          .timeline-dot span {
            font-size: 11px;
          }

          .timeline-card {
            min-height: 160px;
          }

          .timeline-card-content {
            padding: 20px 24px;
            min-height: 160px;
          }

          .timeline-card-content h4 {
            font-size: 16px;
          }

          .timeline-card-content p {
            font-size: 13px;
          }

          .step-tag {
            font-size: 10px;
            padding: 3px 12px;
          }

          .timeline-end {
            padding-left: 20px;
          }

          .timeline-end-dot {
            width: 40px;
            height: 40px;
          }

          .timeline-end-dot i {
            font-size: 18px;
          }
        }

        @media (max-width: 480px) {
          .timeline-item.left,
          .timeline-item.right {
            padding-left: 50px;
          }

          .timeline-line {
            left: 16px;
          }

          .timeline-dot {
            left: 16px;
            width: 34px;
            height: 34px;
          }

          .timeline-dot span {
            font-size: 10px;
          }

          .timeline-card-content {
            padding: 16px 18px;
          }

          .timeline-card-content h4 {
            font-size: 15px;
          }

          .timeline-card-content p {
            font-size: 12px;
          }

          .timeline-end {
            padding-left: 16px;
          }

          .timeline-end-dot {
            width: 34px;
            height: 34px;
          }

          .timeline-end-dot i {
            font-size: 16px;
          }
        }

        /* ========== EMPTY STATE ========== */
        .empty-state-premium {
          text-align: center;
          padding: 60px 30px;
          background: white;
          border-radius: 32px;
          border: 1px solid #eef2f0;
          max-width: 1280px;
          margin: 40px auto 60px;
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
          .search-wrapper-candidatures { padding: 0 40px; }
          .candidatures-grid { padding: 0 40px 60px; grid-template-columns: repeat(2, 1fr); }
          .process-section { padding: 60px 40px; }
        }
        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 40px; }
          .search-card-candidatures { flex-direction: column; border-radius: 32px; padding: 16px; }
          .search-field-candidatures { width: 100%; }
          .filter-chips-candidatures { width: 100%; justify-content: center; }
          .clear-search-candidatures { position: absolute; right: 55px; top: 25px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
        }
        @media (max-width: 768px) {
          .candidatures-grid { grid-template-columns: 1fr; }
          .process-section { padding: 40px 20px; }
          .process-header h2 { font-size: 28px; }
          .stats-grid { padding: 20px; }
          .notification-dropdown { width: 320px; right: -50px; }
          .candidatures-grid { padding: 0 16px 40px; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr; }
          .hero-title { font-size: 36px; }
          .search-wrapper-candidatures { padding: 0 20px; margin-top: -20px; }
          .filter-chip-candidatures { padding: 6px 14px; font-size: 11px; }
          .search-field-candidatures { padding: 12px 20px; }
          .detail-row { flex-direction: column; gap: 6px; }
          .detail-label { width: 100%; }
          .modal-content-premium { padding: 24px; }
          .modal-actions { flex-direction: column; }
          .process-section { padding: 30px 16px; }
          .pagination-premium .page-btn { width: 36px; height: 36px; font-size: 12px; }
          .notification-dropdown { width: 300px; right: -60px; }
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
                      <Link to="/gestion-offres"><i className="fas fa-briefcase"></i> Mes offres</Link>
                      <Link to="/candidatures-reçues" className="active"><i className="fas fa-users"></i> Candidatures reçues</Link>
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
          <Link to="/candidatures-reçues" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#8B5A2B', padding: '12px', borderRadius: '12px', background: '#fef3e8' }}>Candidatures reçues</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* ========== HERO ========== */}
      <section className="hero-candidatures-recues">
        <div className="hero-candidatures-recues-bg"></div>
        <div className="hero-candidatures-recues-overlay"></div>
        <div className="hero-candidatures-recues-container">
          <div className="hero-candidatures-recues-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Gestion des candidatures
            </div>
            <h1 className="hero-title">
              Candidatures <span className="hero-name">reçues</span>
            </h1>
            <p className="hero-desc">
              Consultez et gérez toutes les candidatures reçues pour vos offres de stage
            </p>
            <div className="hero-buttons">
              <Link to="/gestion-offres" className="hero-btn hero-btn-primary">
                <i className="fas fa-briefcase"></i> Mes offres
              </Link>
              <Link to="/offres" className="hero-btn hero-btn-secondary">
                <i className="fas fa-search"></i> Explorer les talents
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-card-glass">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Total</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.enAttente}</div>
                <div className="stat-label">En attente</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.acceptees}</div>
                <div className="stat-label">Acceptées</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.refusees}</div>
                <div className="stat-label">Refusées</div>
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
                    <i className="fas fa-users"></i>
                  </div>
                )}
                <div className="avatar-badge">
                  <i className="fas fa-chart-line"></i>
                </div>
              </div>
            </div>
            <div className="hero-quote">
              <i className="fas fa-quote-left"></i> "Les talents sont là, il suffit de les trouver"
            </div>
          </div>
        </div>
      </section>

      {/* ========== SEARCH BAR ========== */}
      <div className="search-wrapper-candidatures">
        <div className="search-card-candidatures">
          <div className="search-field-candidatures">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Rechercher par étudiant, offre ou ville..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="filter-chips-candidatures">
            <div 
              className={`filter-chip-candidatures ${selectedStatus === 'tous' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('tous')}
            >
              <i className="fas fa-list"></i> Toutes
            </div>
            <div 
              className={`filter-chip-candidatures ${selectedStatus === 'en_attente' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('en_attente')}
            >
              <i className="fas fa-clock"></i> En attente
            </div>
            <div 
              className={`filter-chip-candidatures ${selectedStatus === 'acceptée' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('acceptée')}
            >
              <i className="fas fa-check-circle"></i> Acceptées
            </div>
            <div 
              className={`filter-chip-candidatures ${selectedStatus === 'refusée' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('refusée')}
            >
              <i className="fas fa-times-circle"></i> Refusées
            </div>
          </div>
          <select 
            className="filter-chip-candidatures" 
            value={selectedOffre} 
            onChange={(e) => setSelectedOffre(e.target.value)}
            style={{ background: '#f1f5f9', border: 'none' }}
          >
            <option value="">Toutes les offres</option>
            {offres.map(offre => (
              <option key={offre.idOffre} value={offre.idOffre}>{offre.titre}</option>
            ))}
          </select>
          {searchTerm && (
            <button className="clear-search-candidatures" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* ========== STATS GRID ========== */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-users"></i></div>
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
        <div className="empty-state-premium">
          <div className="empty-icon-premium">
            <i className="fas fa-inbox"></i>
          </div>
          <h3 className="empty-title-premium">Aucune candidature trouvée</h3>
          <p className="empty-desc-premium">
            {searchTerm || selectedStatus !== 'tous' || selectedOffre 
              ? "Essayez d'autres critères de recherche" 
              : "Vous n'avez pas encore reçu de candidatures"}
          </p>
        </div>
      ) : (
        <>
          <div className="candidatures-grid">
            {currentCandidatures.map((candidature, idx) => (
              <div 
                key={candidature.idCandidature} 
                className="candidature-card-premium" 
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => handleViewDetails(candidature)}
              >
                <div className="card-image-premium" style={{ backgroundImage: `url(${getImageForCandidature(candidature.idCandidature)})` }}>
                  <div className="status-badge-premium" style={{ background: getStatusColor(candidature.statut) }}>
                    <i className={getStatusIcon(candidature.statut)}></i>
                    {getStatusLabel(candidature.statut)}
                  </div>
                </div>
                <div className="card-content-premium">
                  <h3 className="candidature-title">{candidature.etudiant?.user?.prenom} {candidature.etudiant?.user?.nom}</h3>
                  <div className="etudiant-info">
                    <i className="fas fa-graduation-cap"></i>
                    <span>{candidature.etudiant?.formations?.[0]?.diplome || 'Étudiant'}</span>
                  </div>
                  <div className="offre-info">
                    <div className="info-item">
                      <i className="fas fa-briefcase"></i>
                      {candidature.offre?.titre}
                    </div>
                    <div className="info-item">
                      <i className="fas fa-building"></i>
                      {candidature.offre?.entreprise?.nom}
                    </div>
                    <div className="info-item">
                      <i className="fas fa-calendar-alt"></i>
                      {new Date(candidature.dateCandidature).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    {candidature.statut === 'en_attente' && (
                      <>
                        <button 
                          className="btn-accepter" 
                          onClick={() => handleAccepter(candidature)} 
                          disabled={actionLoading}
                        >
                          <i className="fas fa-check"></i> Accepter
                        </button>
                        <button 
                          className="btn-refuser" 
                          onClick={() => handleRefuser(candidature)} 
                          disabled={actionLoading}
                        >
                          <i className="fas fa-times"></i> Refuser
                        </button>
                      </>
                    )}
                    <button className="btn-details" onClick={() => handleViewDetails(candidature)}>
                      <i className="fas fa-eye"></i> Détails
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

      {/* ========== SECTION: ACTUALITÉS & TENDANCES DU RECRUTEMENT ========== */}
      <div className="trends-section">
        <div className="trends-container">
          <div className="trends-header">
            <span className="trends-badge">📈 Actualités & Tendances</span>
            <h2>
              Le marché du <span className="highlight">recrutement</span> en chiffres
            </h2>
            <p className="subtitle">
              Découvrez les statistiques clés qui façonnent le recrutement des stagiaires au Maroc
            </p>
          </div>
          <div className="trends-grid">
            {/* Carte 1 */}
            <div className="trends-card">
              <span className="new-badge">📊 Tendance</span>
              <div className="card-number">01</div>
              <div className="card-icon"><i className="fas fa-chart-line"></i></div>
              <div className="stat-number">70<span className="stat-suffix">%</span></div>
              <div className="stat-label">Des stagiaires embauchés</div>
              <div className="stat-desc">Après leur stage dans l'entreprise</div>
              <div className="trend-indicator positive">
                <i className="fas fa-arrow-up"></i> +8% vs 2024
              </div>
              <div className="progress-line"></div>
            </div>

            {/* Carte 2 */}
            <div className="trends-card">
              <div className="card-number">02</div>
              <div className="card-icon"><i className="fas fa-clock"></i></div>
              <div className="stat-number">40<span className="stat-suffix">%</span></div>
              <div className="stat-label">Réduction des délais</div>
              <div className="stat-desc">Grâce aux outils de matching IA</div>
              <div className="trend-indicator positive">
                <i className="fas fa-arrow-up"></i> +15% vs 2024
              </div>
              <div className="progress-line"></div>
            </div>

            {/* Carte 3 */}
            <div className="trends-card">
              <div className="card-number">03</div>
              <div className="card-icon"><i className="fas fa-star"></i></div>
              <div className="stat-number">4.9<span className="stat-suffix">/5</span></div>
              <div className="stat-label">Note moyenne des recruteurs</div>
              <div className="stat-desc">Satisfaction globale sur StageFlow</div>
              <div className="trend-indicator positive">
                <i className="fas fa-arrow-up"></i> +0.3 vs 2024
              </div>
              <div className="progress-line"></div>
            </div>

            {/* Carte 4 */}
            <div className="trends-card">
              <div className="card-number">04</div>
              <div className="card-icon"><i className="fas fa-globe-africa"></i></div>
              <div className="stat-number">12<span className="stat-suffix"> villes</span></div>
              <div className="stat-label">Présence au Maroc</div>
              <div className="stat-desc">Casablanca, Rabat, Marrakech, Tanger...</div>
              <div className="trend-indicator stable">
                <i className="fas fa-minus"></i> Couverture nationale
              </div>
              <div className="progress-line"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== SECTION 2: PROCESSUS DE SÉLECTION EFFICACE - VERSION TIMELINE ========== */}
      <div className="process-section">
        <div className="process-container">
          <div className="process-header">
            <span className="badge">🎯 Processus de sélection</span>
            <h2>Recrutez <span className="highlight">efficacement</span></h2>
            <p>Un processus structuré en 6 étapes pour trouver les meilleurs talents</p>
          </div>
          <div className="process-timeline">
            <div className="timeline-line"></div>
            
            {/* Étape 1 - Gauche */}
            <div className="timeline-item left">
              <div className="timeline-dot">
                <span>01</span>
              </div>
              <div className="timeline-card" style={{ backgroundImage: `url('${processImages[0]}')` }}>
                <div className="timeline-card-overlay"></div>
                <div className="timeline-card-content">
                  <div className="step-tag"><i className="fas fa-search"></i> Étape 1</div>
                  <h4>Analyse des profils</h4>
                  <p>Consultez les CV et lettres de motivation pour évaluer la pertinence des candidats</p>
                </div>
              </div>
              <div className="timeline-arrow"></div>
            </div>

            {/* Étape 2 - Droite */}
            <div className="timeline-item right">
              <div className="timeline-dot">
                <span>02</span>
              </div>
              <div className="timeline-card" style={{ backgroundImage: `url('${processImages[1]}')` }}>
                <div className="timeline-card-overlay"></div>
                <div className="timeline-card-content">
                  <div className="step-tag"><i className="fas fa-robot"></i> Étape 2</div>
                  <h4>Matching IA</h4>
                  <p>Notre intelligence artificielle vous propose les profils les plus adaptés à vos besoins</p>
                </div>
              </div>
              <div className="timeline-arrow"></div>
            </div>

            {/* Étape 3 - Gauche */}
            <div className="timeline-item left">
              <div className="timeline-dot">
                <span>03</span>
              </div>
              <div className="timeline-card" style={{ backgroundImage: `url('${processImages[2]}')` }}>
                <div className="timeline-card-overlay"></div>
                <div className="timeline-card-content">
                  <div className="step-tag"><i className="fas fa-handshake"></i> Étape 3</div>
                  <h4>Sélection et contact</h4>
                  <p>Acceptez ou refusez les candidatures et contactez directement les talents sélectionnés</p>
                </div>
              </div>
              <div className="timeline-arrow"></div>
            </div>

            {/* Étape 4 - Droite */}
            <div className="timeline-item right">
              <div className="timeline-dot">
                <span>04</span>
              </div>
              <div className="timeline-card" style={{ backgroundImage: `url('${processImages[3]}')` }}>
                <div className="timeline-card-overlay"></div>
                <div className="timeline-card-content">
                  <div className="step-tag"><i className="fas fa-calendar-check"></i> Étape 4</div>
                  <h4>Entretien</h4>
                  <p>Planifiez des entretiens avec les candidats retenus pour évaluer leurs compétences</p>
                </div>
              </div>
              <div className="timeline-arrow"></div>
            </div>

            {/* Étape 5 - Gauche */}
            <div className="timeline-item left">
              <div className="timeline-dot">
                <span>05</span>
              </div>
              <div className="timeline-card" style={{ backgroundImage: `url('${processImages[4]}')` }}>
                <div className="timeline-card-overlay"></div>
                <div className="timeline-card-content">
                  <div className="step-tag"><i className="fas fa-check-double"></i> Étape 5</div>
                  <h4>Validation finale</h4>
                  <p>Confirmez la sélection du stagiaire et préparez son intégration dans l'équipe</p>
                </div>
              </div>
              <div className="timeline-arrow"></div>
            </div>

            {/* Étape 6 - Droite */}
            <div className="timeline-item right">
              <div className="timeline-dot">
                <span>06</span>
              </div>
              <div className="timeline-card" style={{ backgroundImage: `url('${processImages[5]}')` }}>
                <div className="timeline-card-overlay"></div>
                <div className="timeline-card-content">
                  <div className="step-tag"><i className="fas fa-star"></i> Étape 6</div>
                  <h4>Intégration réussie</h4>
                  <p>Accueillez votre nouveau stagiaire et assurez son intégration dans l'équipe</p>
                </div>
              </div>
              <div className="timeline-arrow"></div>
            </div>

            {/* Fin de la timeline */}
            <div className="timeline-end">
              <div className="timeline-end-dot">
                <i className="fas fa-flag-checkered"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== DETAIL MODAL REDESIGN AVEC INFOS COMPLÈTES ========== */}
      {showDetailModal && selectedCandidature && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="modal-header-left">
                <div className="modal-avatar">
                  {selectedCandidature.etudiant?.user?.photo ? (
                    <img src={selectedCandidature.etudiant.user.photo} alt="Avatar" />
                  ) : (
                    <span>{selectedCandidature.etudiant?.user?.prenom?.charAt(0)}{selectedCandidature.etudiant?.user?.nom?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h2>{selectedCandidature.etudiant?.user?.prenom} {selectedCandidature.etudiant?.user?.nom}</h2>
                  <p className="modal-subtitle">
                    <i className="fas fa-graduation-cap"></i> {selectedCandidature.etudiant?.formations?.[0]?.diplome || 'Étudiant'}
                    <span className="dot-separator">•</span>
                    <i className="fas fa-map-marker-alt"></i> {selectedCandidature.etudiant?.ville || 'Non renseignée'}
                    <span className="dot-separator">•</span>
                    <i className="fas fa-phone"></i> {selectedCandidature.etudiant?.telephone || 'Non renseigné'}
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Status Banner */}
            <div className="modal-status-banner">
              <div className="status-badge-large" style={{ background: getStatusColor(selectedCandidature.statut) }}>
                <i className={getStatusIcon(selectedCandidature.statut)}></i>
                {getStatusLabel(selectedCandidature.statut)}
              </div>
              <span className="candidature-date">
                <i className="fas fa-calendar-alt"></i> Candidature le {new Date(selectedCandidature.dateCandidature).toLocaleDateString('fr-FR')}
              </span>
            </div>

            {/* Section: Informations Personnelles - ÉTUDIANT */}
            <div className="modal-section">
              <div className="section-title">
                <i className="fas fa-user-circle"></i>
                <h3>Informations personnelles</h3>
              </div>
              <div className="info-grid">
                <div className="info-item-modal">
                  <span className="info-label"><i className="fas fa-envelope"></i> Email</span>
                  <span className="info-value">{selectedCandidature.etudiant?.user?.email}</span>
                </div>
                <div className="info-item-modal">
                  <span className="info-label"><i className="fas fa-phone"></i> Téléphone</span>
                  <span className="info-value">{selectedCandidature.etudiant?.telephone || 'Non renseigné'}</span>
                </div>
                <div className="info-item-modal">
                  <span className="info-label"><i className="fas fa-map-marker-alt"></i> Ville</span>
                  <span className="info-value">{selectedCandidature.etudiant?.ville || 'Non renseignée'}</span>
                </div>
                <div className="info-item-modal">
                  <span className="info-label"><i className="fas fa-calendar"></i> Membre depuis</span>
                  <span className="info-value">{new Date(selectedCandidature.etudiant?.user?.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Section: Entreprise */}
            {selectedCandidature.offre?.entreprise && (
              <div className="modal-section">
                <div className="section-title">
                  <i className="fas fa-building"></i>
                  <h3>Entreprise</h3>
                </div>
                <div className="entreprise-card-modal">
                  <div className="entreprise-card-header">
                    <div className="entreprise-icon">
                      <i className="fas fa-building"></i>
                    </div>
                    <div>
                      <h4>{selectedCandidature.offre.entreprise.nom}</h4>
                      <p><i className="fas fa-envelope"></i> {selectedCandidature.offre.entreprise.emailContact || 'Non renseigné'}</p>
                    </div>
                  </div>
                  <div className="entreprise-card-details">
                    <div className="entreprise-detail">
                      <i className="fas fa-phone"></i>
                      <span>{selectedCandidature.offre.entreprise.telephone || 'Non renseigné'}</span>
                    </div>
                    <div className="entreprise-detail">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{selectedCandidature.offre.entreprise.ville || 'Non renseignée'}</span>
                    </div>
                    <div className="entreprise-detail">
                      <i className="fas fa-globe"></i>
                      <span>{selectedCandidature.offre.entreprise.siteWeb || 'Non renseigné'}</span>
                    </div>
                    <div className="entreprise-detail">
                      <i className="fas fa-calendar"></i>
                      <span>Membre depuis {new Date(selectedCandidature.offre.entreprise.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Formation */}
            {selectedCandidature.etudiant?.formations?.length > 0 && (
              <div className="modal-section">
                <div className="section-title">
                  <i className="fas fa-graduation-cap"></i>
                  <h3>Formation</h3>
                </div>
                <div className="formation-list">
                  {selectedCandidature.etudiant.formations.map((formation, idx) => (
                    <div key={idx} className="formation-item">
                      <div className="formation-icon">
                        <i className="fas fa-book"></i>
                      </div>
                      <div className="formation-info">
                        <h4>{formation.diplome}</h4>
                        <p><i className="fas fa-building"></i> {formation.etablissement}</p>
                        <span className="formation-date">
                          <i className="fas fa-calendar-alt"></i> {formation.anneeDebut} - {formation.anneeFin || 'Présent'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Compétences */}
            {selectedCandidature.etudiant?.competences?.length > 0 && (
              <div className="modal-section">
                <div className="section-title">
                  <i className="fas fa-code"></i>
                  <h3>Compétences</h3>
                </div>
                <div className="competences-list-modal">
                  {selectedCandidature.etudiant.competences.map((comp, idx) => (
                    <span key={idx} className="competence-tag-modal">
                      {comp.nom}
                      <span className="competence-level" style={{ 
                        background: comp.pivot?.niveau === 'expert' ? '#10b981' : 
                                    comp.pivot?.niveau === 'avancé' ? '#3b82f6' : 
                                    comp.pivot?.niveau === 'intermédiaire' ? '#f59e0b' : '#6b7280'
                      }}>
                        {comp.pivot?.niveau || 'Débutant'}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Offre */}
            <div className="modal-section">
              <div className="section-title">
                <i className="fas fa-briefcase"></i>
                <h3>Offre postulée</h3>
              </div>
              <div className="offre-card-modal">
                <div className="offre-card-header">
                  <div className="offre-icon">
                    <i className="fas fa-file-alt"></i>
                  </div>
                  <div>
                    <h4>{selectedCandidature.offre?.titre}</h4>
                    <p><i className="fas fa-building"></i> {selectedCandidature.offre?.entreprise?.nom}</p>
                  </div>
                </div>
                <div className="offre-card-details">
                  <div className="offre-detail">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{selectedCandidature.offre?.ville}</span>
                  </div>
                  <div className="offre-detail">
                    <i className="fas fa-clock"></i>
                    <span>{selectedCandidature.offre?.duree} mois</span>
                  </div>
                  <div className="offre-detail">
                    <i className="fas fa-tag"></i>
                    <span>{selectedCandidature.offre?.typeStage}</span>
                  </div>
                  <div className="offre-detail">
                    <i className="fas fa-calendar-alt"></i>
                    <span>Limite: {new Date(selectedCandidature.offre?.dateLimite).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Lettre de motivation */}
            <div className="modal-section motivation-section">
              <div className="section-title">
                <i className="fas fa-envelope-open-text"></i>
                <h3>Lettre de motivation</h3>
              </div>
              <div className="motivation-content">
                <p>{selectedCandidature.lettreMotivation || 'Aucune lettre de motivation fournie.'}</p>
              </div>
            </div>

            {/* Actions */}
            {selectedCandidature.statut === 'en_attente' && (
              <div className="modal-actions-premium">
                <button 
                  className="btn-accepter-modal" 
                  onClick={() => { handleAccepter(selectedCandidature); setShowDetailModal(false); }}
                >
                  <i className="fas fa-check-circle"></i> Accepter la candidature
                </button>
                <button 
                  className="btn-refuser-modal" 
                  onClick={() => { handleRefuser(selectedCandidature); setShowDetailModal(false); }}
                >
                  <i className="fas fa-times-circle"></i> Refuser
                </button>
                <button className="btn-close-modal" onClick={() => setShowDetailModal(false)}>
                  <i className="fas fa-arrow-left"></i> Retour
                </button>
              </div>
            )}
            {selectedCandidature.statut !== 'en_attente' && (
              <div className="modal-actions-premium single-action">
                <button className="btn-close-modal" onClick={() => setShowDetailModal(false)} style={{ width: '100%' }}>
                  <i className="fas fa-arrow-left"></i> Retour
                </button>
              </div>
            )}
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