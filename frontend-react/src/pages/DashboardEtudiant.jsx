import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecommendations } from '../api/recommandation';
import { getMesCandidatures } from '../api/candidature';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function DashboardEtudiant() {
  const [recs, setRecs] = useState([]);
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studentPhoto, setStudentPhoto] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ========== NOTIFICATIONS ==========
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const [stats, setStats] = useState({
    totalCandidatures: 0,
    acceptees: 0,
    enAttente: 0,
    recommandationsCount: 0,
    refusees: 0,
    tauxSuccess: 0
  });

  // Base d'images
  const baseImages = [
    '/images/do.png', '/images/do1.png', '/images/do2.png', '/images/do3.png',
    '/images/do4.png', '/images/do5.png', '/images/do6.png', '/images/do7.png',
    '/images/do8.png', '/images/do9.png', '/images/doo.png', '/images/doo1.png',
    '/images/doo2.png', '/images/doo3.png', '/images/doo4.png', '/images/doo5.png',
  ];

  // ========== FETCH NOTIFICATIONS ==========
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

  // Récupération de la photo de profil
  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const res = await api.get('/etudiant/profile');
        if (res.data && res.data.photo) {
          setStudentPhoto(res.data.photo);
        }
      } catch (error) {
        console.error('Erreur chargement photo profil:', error);
      }
    };
    if (user && user.role === 'etudiant') {
      fetchStudentProfile();
    }
  }, [user]);

  // Chargement des données principales
  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        await fetchNotifications();
        
        let recsData = [];
        try {
          const recRes = await getRecommendations();
          recsData = recRes?.data || [];
          if (!Array.isArray(recsData)) recsData = [];
        } catch (error) {
          console.error('Erreur chargement recommandations:', error);
          recsData = [];
        }
        
        let candidaturesData = [];
try {
  // Utiliser la fonction getMesCandidatures (corrigée)
  const candRes = await getMesCandidatures();
  // candRes est déjà un tableau traité
  candidaturesData = Array.isArray(candRes) ? candRes : [];
} catch (error) {
  console.error('Erreur chargement candidatures:', error);
  candidaturesData = [];
}
        
        setRecs(recsData.slice(0, 4));
        setCandidatures(candidaturesData.slice(0, 5));
        
        const acceptees = candidaturesData.filter(c => c.statut === 'acceptée' || c.statut === 'accepte').length;
        const enAttente = candidaturesData.filter(c => c.statut === 'en_attente' || c.statut === 'pending').length;
        const refusees = candidaturesData.filter(c => c.statut === 'refusée' || c.statut === 'refuse').length;
        const total = candidaturesData.length;
        
        setStats({
          totalCandidatures: total,
          acceptees: acceptees,
          enAttente: enAttente,
          refusees: refusees,
          recommandationsCount: recsData.length,
          tauxSuccess: total > 0 ? Math.round((acceptees / total) * 100) : 0
        });
      } catch (error) {
        console.error('Erreur générale:', error);
        toast.error('Erreur lors du chargement du tableau de bord');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();

    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

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

  const getSuccessMessage = () => {
    const taux = stats.tauxSuccess;
    if (taux >= 70) return { text: 'Excellent ! Continuez ainsi 🚀', color: '#10b981' };
    if (taux >= 40) return { text: 'Bon début ! Persévérez 💪', color: '#f59e0b' };
    return { text: 'Continuez à postuler, vous allez y arriver ! 🌟', color: '#ef4444' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f2]">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-[#8B5A2B] rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .dashboard-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
          color: #1a1a1a;
          overflow-x: hidden;
          width: 100%;
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
        .auth-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
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
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-icon i {
          font-size: 16px;
          color: white;
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
          background-image: url('/images/doo5.png');
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

        /* ========== STATS GRID PREMIUM ========== */
        .container {
          width: 100%;
        }
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
        .stat-card:nth-child(1) { background-image: url('images/s1.png'); }
        .stat-card:nth-child(2) { background-image: url('images/s2.png'); }
        .stat-card:nth-child(3) { background-image: url('images/s3.png'); }
        .stat-card:nth-child(4) { background-image: url('images/s4.png'); }
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

        /* ============================================================
           SECTION PROGRESSION - DESIGN PREMIUM
           ============================================================ */
        .progress-section {
          padding: 0 90px;
          margin-bottom: 48px;
        }

        .progress-card {
          position: relative;
          overflow: hidden;
          background: white;
          border-radius: 32px;
          padding: 36px 40px 40px;
          border: 1px solid #f0f2f5;
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
          transition: all 0.3s ease;
        }

        .progress-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 30px 50px -12px rgba(0,0,0,0.15);
        }

        .progress-bg-gradient {
          position: absolute;
          top: 0;
          right: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(135deg, 
            rgba(139, 90, 43, 0.02) 0%,
            rgba(139, 90, 43, 0.04) 25%,
            rgba(255, 217, 102, 0.05) 50%,
            rgba(139, 90, 43, 0.03) 75%,
            rgba(93, 58, 26, 0.01) 100%
          );
          border-radius: 0 32px 32px 0;
          z-index: 0;
        }

        .progress-overlay {
          position: absolute;
          top: 0;
          right: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(139, 90, 43, 0.03) 100%);
          z-index: 0;
        }

        .progress-card > * {
          position: relative;
          z-index: 1;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .progress-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .progress-header-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(93, 58, 26, 0.25);
        }

        .progress-header-icon i {
          font-size: 28px;
          color: #ffd966;
        }

        .progress-header-left h3 {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
        }

        .progress-subtitle {
          font-size: 14px;
          color: #94a3b8;
          margin: 4px 0 0;
        }

        .progress-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .progress-badge {
          padding: 8px 20px;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .progress-badge.excellent {
          background: linear-gradient(135deg, #dcfce7, #a7f3d0);
          color: #065f46;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .progress-badge.bon {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }

        .progress-badge.moyen {
          background: linear-gradient(135deg, #fee2e2, #fca5a5);
          color: #991b1b;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .progress-update {
          font-size: 12px;
          color: #94a3b8;
          background: #f8fafc;
          padding: 6px 16px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .progress-update i {
          font-size: 11px;
          color: #8B5A2B;
        }

        .progress-grid {
          display: grid;
          grid-template-columns: 1fr 1.8fr;
          gap: 48px;
          align-items: start;
        }

        .progress-circle-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 100px;
        }

        .progress-circle-main {
          position: relative;
          width: 300px;
          height: 300px;
        }

        .progress-circle-ring {
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd966, #8B5A2B, #5D3A1A, #8B5A2B, #ffd966);
          background-size: 400% 400%;
          animation: gradientRing 4s ease infinite;
          opacity: 0.3;
          z-index: 0;
        }

        @keyframes gradientRing {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .progress-circle-container {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .progress-circle-container svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .progress-circle-container .circle-bg {
          fill: none;
          stroke: #f1f5f9;
          stroke-width: 10;
        }

        .progress-circle-container .circle-fill {
          fill: none;
          stroke-width: 10;
          stroke-linecap: round;
          transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1));
        }

        .circle-text-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .circle-number {
          display: block;
          font-size: 44px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
          letter-spacing: -1px;
        }

        .circle-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .circle-status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin: 10px auto 0;
          animation: pulseDot 2s infinite;
        }

        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        .circle-info-badge {
          position: absolute;
          background: white;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          color: #1a1a1a;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border: 1px solid #f0f2f5;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
          white-space: nowrap;
          z-index: 2;
        }

        .circle-info-badge:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .circle-info-badge i {
          font-size: 14px;
        }

        .circle-info-badge.top-right {
          top: -10px;
          right: -10px;
        }

        .circle-info-badge.bottom-left {
          bottom: -10px;
          left: -10px;
        }

        .circle-info-badge.bottom-right {
          bottom: -10px;
          right: -10px;
        }

        .progress-details {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .progress-details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .progress-details-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        .progress-details-total {
          font-size: 13px;
          font-weight: 600;
          color: #8B5A2B;
          background: #fef3e8;
          padding: 4px 14px;
          border-radius: 30px;
        }

        .progress-global-bar {
          display: flex;
          height: 8px;
          border-radius: 8px;
          overflow: hidden;
          background: #f1f5f9;
        }

        .progress-global-segment {
          height: 100%;
          transition: width 1.5s ease;
        }

        .progress-global-labels {
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: #64748b;
        }

        .progress-global-labels .dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 4px;
        }

        .progress-detail-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          background: #f8fafc;
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .progress-detail-item:hover {
          background: #fef3e8;
          transform: translateX(4px);
        }

        .progress-detail-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }

        .progress-detail-icon i {
          font-size: 20px;
          color: white;
        }

        .progress-detail-info {
          flex: 1;
          min-width: 60px;
        }

        .progress-detail-info .label {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .progress-detail-info .value {
          display: block;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        .progress-detail-bar {
          width: 120px;
          height: 6px;
          background: #eef2f0;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .progress-detail-bar .fill {
          height: 100%;
          border-radius: 6px;
          transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-detail-percent {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          min-width: 44px;
          text-align: right;
        }

        .progress-advice-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #fef3e8, #fff5ed);
          border-radius: 16px;
          border: 1px solid rgba(139, 90, 43, 0.15);
          margin-top: 4px;
          transition: all 0.3s ease;
        }

        .progress-advice-card:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 16px rgba(139, 90, 43, 0.1);
        }

        .progress-advice-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #8B5A2B, #5D3A1A);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .progress-advice-icon i {
          font-size: 22px;
          color: #ffd966;
        }

        .progress-advice-content {
          flex: 1;
        }

        .progress-advice-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #8B5A2B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .progress-advice-text {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin: 2px 0 0;
        }

        .progress-advice-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #8B5A2B;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          padding: 6px 16px;
          border-radius: 30px;
          background: rgba(139, 90, 43, 0.08);
          transition: all 0.3s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .progress-advice-action:hover {
          background: rgba(139, 90, 43, 0.15);
          gap: 12px;
        }

        .progress-next-goal {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 20px;
          background: white;
          border-radius: 16px;
          border: 1px solid #eef2f0;
          transition: all 0.3s ease;
        }

        .progress-next-goal:hover {
          border-color: #8B5A2B;
          transform: translateX(4px);
        }

        .progress-goal-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #ffd966, #f59e0b);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .progress-goal-icon i {
          font-size: 18px;
          color: #5D3A1A;
        }

        .progress-goal-content {
          flex: 1;
        }

        .progress-goal-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .progress-goal-text {
          font-size: 13px;
          color: #1a1a1a;
          margin: 2px 0 0;
        }

        .progress-goal-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .progress-goal-bar {
          width: 80px;
          height: 6px;
          background: #eef2f0;
          border-radius: 6px;
          overflow: hidden;
        }

        .progress-goal-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 1.5s ease;
        }

        .progress-goal-number {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          min-width: 30px;
        }

        /* ============================================================
           CARDS GRID - RECOMMANDATIONS & CANDIDATURES
           ============================================================ */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          margin-bottom: 48px;
          padding: 0 90px;
        }

        .card {
          background: white;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
          border: 1px solid #f0f2f5;
          transition: all 0.3s ease;
        }

        .card:hover {
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

        /* ===== CARTE RECOMMANDATIONS ===== */
        .card-body-rec { 
          padding: 0; 
          max-height: 520px; 
          overflow-y: auto; 
          background: #fafbfc;
        }

        .card-body-rec::-webkit-scrollbar {
          width: 6px;
        }

        .card-body-rec::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .card-body-rec::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .card-body-rec::-webkit-scrollbar-thumb:hover {
          background: #8B5A2B;
        }

        .rec-item-premium {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          text-decoration: none;
          transition: all 0.3s ease;
          background: white;
        }

        .rec-item-premium:hover { 
          background: #fefaf5; 
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .rec-image {
          position: relative;
          width: 70px;
          height: 70px;
          flex-shrink: 0;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .rec-image img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          transition: transform 0.3s; 
        }

        .rec-item-premium:hover .rec-image img { transform: scale(1.05); }

        .rec-score-badge {
          position: absolute;
          bottom: -1px;
          right: -6px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 30px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          border: 1px solid white;
        }

        .rec-details { flex: 1; }

        .rec-title-premium { 
          font-size: 16px; 
          font-weight: 700; 
          color: #0f172a; 
          margin-bottom: 6px; 
        }

        .rec-company-premium { 
          font-size: 13px; 
          color: #64748b; 
          display: flex; 
          align-items: center; 
          gap: 6px; 
          margin-bottom: 8px; 
        }

        .rec-tags { display: flex; gap: 8px; }

        .rec-tag {
          background: #f1f5f9;
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 30px;
          color: #475569;
          font-weight: 500;
        }

        .rec-action {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #fef3e8, #fff5ed);
          padding: 8px 16px;
          border-radius: 40px;
          color: #8B5A2B;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .rec-item-premium:hover .rec-action {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          gap: 12px;
          box-shadow: 0 4px 12px rgba(93,58,26,0.2);
        }

        .empty-state-rec { 
          text-align: center; 
          padding: 60px 30px; 
        }

        .empty-state-rec i { 
          font-size: 56px; 
          color: #cbd5e1; 
          margin-bottom: 16px; 
          display: block; 
        }

        .empty-state-rec p { 
          color: #64748b; 
          margin-bottom: 20px; 
        }

        /* ============================================================
           CARTE DERNIÈRES CANDIDATURES - DESIGN PREMIUM
           ============================================================ */
        .card-body-cand-premium {
          padding: 0;
          max-height: 520px;
          overflow-y: auto;
          background: #fafbfc;
        }

        .card-body-cand-premium::-webkit-scrollbar {
          width: 6px;
        }

        .card-body-cand-premium::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .card-body-cand-premium::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .card-body-cand-premium::-webkit-scrollbar-thumb:hover {
          background: #8B5A2B;
        }

        .cand-list-premium {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cand-item-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          background: white;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          border-bottom: 1px solid #f1f5f9;
          position: relative;
          gap: 16px;
        }

        .cand-item-premium:hover {
          background: #fefaf5;
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .cand-item-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 10%;
          height: 80%;
          width: 3px;
          background: transparent;
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .cand-item-premium:hover::before {
          background: linear-gradient(180deg, #8B5A2B, #ffd966);
        }

        .cand-item-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }

        .cand-image-wrapper {
          flex-shrink: 0;
        }

        .cand-image {
          position: relative;
          width: 72px;
          height: 72px;
          border-radius: 16px;
          background-size: cover;
          background-position: center;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          transition: transform 0.3s ease;
        }

        .cand-item-premium:hover .cand-image {
          transform: scale(1.05);
        }

        .cand-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.15));
          border-radius: 16px;
        }

        .cand-status-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          font-size: 12px;
        }

        .cand-info {
          flex: 1;
          min-width: 0;
        }

        .cand-title {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
          line-height: 1.3;
          transition: color 0.3s ease;
        }

        .cand-item-premium:hover .cand-title {
          color: #8B5A2B;
        }

        .cand-company {
          font-size: 14px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }

        .cand-company i {
          font-size: 13px;
          color: #94a3b8;
        }

        .cand-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .cand-meta span {
          font-size: 12px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .cand-meta i {
          font-size: 12px;
          color: #8B5A2B;
        }

        .cand-item-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }

        .cand-status {
          font-size: 12px;
          font-weight: 700;
          padding: 4px 14px;
          border-radius: 30px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .cand-status i {
          font-size: 11px;
        }

        .cand-action {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #8B5A2B;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s ease;
          opacity: 0.6;
        }

        .cand-item-premium:hover .cand-action {
          opacity: 1;
          gap: 10px;
        }

        .cand-action i {
          font-size: 12px;
          transition: transform 0.3s ease;
        }

        .cand-item-premium:hover .cand-action i {
          transform: translateX(4px);
        }

        /* ===== EMPTY STATE CANDIDATURES ===== */
        .empty-state-cand-premium {
          text-align: center;
          padding: 60px 30px;
        }

        .empty-icon {
          width: 90px;
          height: 90px;
          background: linear-gradient(135deg, #fef3e8, #fff5ed);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          border: 2px dashed rgba(139, 90, 43, 0.2);
        }

        .empty-icon i {
          font-size: 40px;
          color: #8B5A2B;
        }

        .empty-state-cand-premium h4 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .empty-state-cand-premium p {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 24px;
        }

        .btn-primary-cand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          padding: 12px 28px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          box-shadow: 0 4px 12px rgba(93, 58, 26, 0.2);
        }

        .btn-primary-cand:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(93, 58, 26, 0.3);
          gap: 14px;
        }

        /* ===== FOOTER ===== */
        .card-footer {
          padding: 18px 24px;
          border-top: 1px solid #eef2f0;
          background: #faf7f2;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-footer .btn-link {
          color: #8B5A2B;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
        }

        .card-footer .btn-link:hover {
          gap: 10px;
          color: #5D3A1A;
        }

        /* ============================================================
           SECTION ACTIVITÉ RÉCENTE - DESIGN WA3ER AVEC IMAGES ET COLONNES
           ============================================================ */
        .activity-section {
          padding: 0 90px;
          margin-bottom: 60px;
          margin-top: 40px;
        }

        .activity-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .activity-card {
          position: relative;
          overflow: hidden;
          background: white;
          border-radius: 28px;
          padding: 28px 32px;
          border: 1px solid #f0f2f5;
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
          transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          display: flex;
          flex-direction: column;
          min-height: 450px;
          justify-content: flex-start;
          align-items: stretch;
        }

        .activity-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 30px 50px -12px rgba(0,0,0,0.15);
        }

        .activity-card-shine {
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at 70% 20%, rgba(255, 217, 102, 0.06) 0%, transparent 70%);
          z-index: 0;
          pointer-events: none;
          animation: shineFloat 8s ease-in-out infinite;
        }

        @keyframes shineFloat {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-10%, -10%); }
        }

        .activity-card > * {
          position: relative;
          z-index: 1;
        }

        .activity-header-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-shrink: 0;
          width: 100%;
        }

        .activity-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .activity-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }

        .activity-icon-box i {
          font-size: 20px;
          color: white;
        }

        .activity-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
        }

        .activity-subtitle {
          font-size: 12px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          animation: livePulse 1.5s ease-in-out infinite;
        }

        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }

        .activity-view-all {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #8B5A2B;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          padding: 8px 18px;
          border-radius: 30px;
          background: rgba(139, 90, 43, 0.08);
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .activity-view-all:hover {
          background: rgba(139, 90, 43, 0.15);
          gap: 12px;
        }

        .activity-header-right {
          display: flex;
          align-items: center;
        }

        .total-badge {
          padding: 6px 16px;
          background: #f8fafc;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          border: 1px solid #eef2f0;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          padding: 4px 0;
          min-height: 200px;
          overflow-y: auto;
          width: 100%;
        }

        .activity-list::-webkit-scrollbar {
          width: 4px;
        }

        .activity-list::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .activity-list::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .activity-item-premium {
          display: flex;
          align-items: center;
          gap: 16px;
          border-radius: 14px;
          padding: 12px 16px;
          transition: all 0.3s ease;
          border: 1px solid transparent;
          min-height: 80px;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          width: 100%;
        }

        .activity-item-premium:hover {
          transform: translateX(4px);
          border-color: rgba(139, 90, 43, 0.15);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }

        .activity-item-image {
          width: 64px;
          height: 64px;
          border-radius: 14px;
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }

        .activity-item-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.3));
          border-radius: 14px;
        }

        .activity-item-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .activity-item-badge i {
          font-size: 11px;
          color: white;
        }

        .activity-item-content {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .activity-item-left {
          flex: 1;
          min-width: 0;
        }

        .activity-item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .activity-item-title {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
        }

        .activity-item-title strong {
          font-weight: 700;
        }

        .activity-item-company {
          font-size: 13px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .activity-item-company i {
          font-size: 12px;
        }

        .activity-item-date {
          font-size: 12px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .activity-item-date i {
          font-size: 12px;
        }

        .activity-item-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex-shrink: 0;
        }

        .activity-item-status {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 14px;
          border-radius: 30px;
          white-space: nowrap;
        }

        .activity-item-action {
          width: 32px;
          height: 32px;
          background: rgba(139, 90, 43, 0.08);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8B5A2B;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .activity-item-action:hover {
          background: #8B5A2B;
          color: white;
          transform: scale(1.1);
        }

        .activity-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 80px;
          padding-top: 16px;
          border-top: 1px solid #eef2f0;
          flex-shrink: 0;
          width: 100%;
        }

        .footer-stats-mini {
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: #64748b;
        }

        .footer-stats-mini i {
          color: #8B5A2B;
          margin-right: 4px;
        }

        .footer-link {
          font-size: 12px;
          font-weight: 600;
          color: #8B5A2B;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
        }

        .footer-link:hover {
          gap: 10px;
        }

        .activity-empty-premium {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-illustration {
          width: 80px;
          height: 80px;
          background: #fef3e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .empty-illustration i {
          font-size: 36px;
          color: #8B5A2B;
        }

        .activity-empty-premium h4 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .activity-empty-premium p {
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 20px;
        }

        .empty-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border-radius: 40px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .empty-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(93, 58, 26, 0.3);
          gap: 12px;
        }

        /* ===== COLONNES ===== */
        .stats-columns {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          gap: 16px;
          height: 220px;
          padding: 20px 10px 10px;
          background: #f8fafc;
          border-radius: 16px;
          margin-bottom: 20px;
        }

        .stats-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
          height: 100%;
        }

        .stats-column-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stats-column-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .stats-column-value {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .stats-column-bar {
          width: 32px;
          height: 120px;
          background: #eef2f0;
          border-radius: 16px 16px 4px 4px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          position: relative;
        }

        .stats-column-fill {
          width: 100%;
          border-radius: 4px 4px 0 0;
          transition: height 1.5s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 4px;
        }

        .stats-column-percent {
          font-size: 13px;
          font-weight: 700;
        }

        .stats-column.total-column .stats-column-bar {
          background: linear-gradient(180deg, #fef3e8, #fff5ed);
          border: 2px solid rgba(139, 90, 43, 0.15);
        }

        .stats-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .stats-detail-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 12px;
          border-left: 4px solid transparent;
          transition: all 0.3s ease;
        }

        .stats-detail-item:hover {
          transform: translateX(4px);
          background: #fef3e8;
        }

        .stats-detail-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stats-detail-icon i {
          font-size: 16px;
          color: white;
        }

        .stats-detail-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stats-detail-label {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }

        .stats-detail-value {
          font-size: 18px;
          font-weight: 700;
        }

        .motivation-box {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 18px;
          background: linear-gradient(135deg, #fef3e8, #fff5ed);
          border-radius: 14px;
          border: 1px solid rgba(139, 90, 43, 0.1);
        }

        .motivation-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #8B5A2B, #5D3A1A);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .motivation-icon i {
          font-size: 18px;
          color: #ffd966;
        }

        .motivation-text {
          flex: 1;
        }

        .motivation-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          color: #8B5A2B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .motivation-text p {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          margin: 2px 0 0;
          line-height: 1.4;
        }

        /* ========== QUICK ACTIONS ========== */
        .quick-actions-premium {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 28px;
          margin-bottom: 60px;
          padding: 0 90px;
        }
        .action-card-premium {
          background: white;
          border-radius: 28px;
          padding: 28px 24px;
          display: flex;
          align-items: center;
          gap: 18px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          border: 1px solid #f0f2f5;
          position: relative;
          overflow: hidden;
        }
        .action-card-premium::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 0;
        }
        .action-card-premium:nth-child(1)::before { background-image: url('images/g1.png'); }
        .action-card-premium:nth-child(2)::before { background-image: url('images/g2.png'); }
        .action-card-premium:nth-child(3)::before { background-image: url('images/g3.png'); }
        .action-card-premium:nth-child(4)::before { background-image: url('images/g4.png'); }
        .action-card-premium:hover::before { opacity: 0.4; }
        .action-card-premium:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 35px -12px rgba(0,0,0,0.12);
          border-color: transparent;
        }
        .action-icon-premium {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #fef3e8, #fff5ed);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          flex-shrink: 0;
          z-index: 1;
        }
        .action-card-premium:hover .action-icon-premium {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          transform: scale(1.05);
        }
        .action-icon-premium i {
          font-size: 30px;
          color: #8B5A2B;
          transition: color 0.2s;
        }
        .action-card-premium:hover .action-icon-premium i { color: white; }
        .action-content { flex: 1; z-index: 1; }
        .action-content h3 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
          transition: color 0.2s;
        }
        .action-card-premium:hover .action-content h3 { color: #8B5A2B; }
        .action-content p { font-size: 13px; color: #64748b; margin: 0; line-height: 1.4; }
        .action-arrow {
          width: 36px;
          height: 36px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          flex-shrink: 0;
          z-index: 1;
        }
        .action-card-premium:hover .action-arrow {
          background: #8B5A2B;
          transform: translateX(4px);
        }
        .action-arrow i {
          font-size: 14px;
          color: #8B5A2B;
          transition: color 0.2s;
        }
        .action-card-premium:hover .action-arrow i { color: white; }

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
          .stats-grid, .cards-grid, .quick-actions-premium, .progress-section, .activity-section {
            padding: 0 40px;
          }
          .progress-grid { grid-template-columns: 1fr; gap: 32px; }
          .progress-circle-main { width: 220px; height: 220px; margin: 0 auto; }
          .progress-detail-bar { width: 100%; }
        }
        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 40px 20px; }
          .cards-grid { grid-template-columns: 1fr; gap: 24px; padding: 0 20px; }
          .quick-actions-premium { grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 0 20px; }
          .progress-section, .activity-section { padding: 0 20px; }
          .activity-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .progress-header { flex-direction: column; align-items: flex-start; }
          .progress-header-right { width: 100%; flex-wrap: wrap; }
          .progress-bg-gradient { width: 100%; border-radius: 32px; }
          .stats-columns { height: 180px; padding: 16px 8px 8px; }
          .stats-column-bar { height: 100px; }
          .stats-details { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .progress-section, .activity-section { padding: 0 16px; }
          .progress-card, .activity-card { padding: 20px; }
          .progress-circle-main { width: 180px; height: 180px; }
          .circle-number { font-size: 34px; }
          .circle-info-badge { font-size: 10px; padding: 4px 12px; }
          .circle-info-badge.top-right { top: -5px; right: -5px; }
          .circle-info-badge.bottom-left { bottom: -5px; left: -5px; }
          .circle-info-badge.bottom-right { bottom: -5px; right: -5px; }
          .progress-detail-item { flex-wrap: wrap; }
          .progress-detail-bar { width: 100%; }
          .progress-advice-card { flex-wrap: wrap; }
          .progress-advice-action { width: 100%; justify-content: center; }
          .progress-next-goal { flex-wrap: wrap; }
          .progress-goal-progress { width: 100%; }
          .progress-goal-bar { flex: 1; }
          .progress-details-header { flex-wrap: wrap; gap: 8px; }
          .stats-grid { grid-template-columns: 1fr; }
          .quick-actions-premium { grid-template-columns: 1fr; gap: 16px; padding: 0 16px; }
          .cards-grid { padding: 0 16px; }
          .activity-card { padding: 20px; }
          .activity-header-premium { flex-direction: column; align-items: flex-start; gap: 12px; }
          .activity-view-all { align-self: flex-start; }
          .activity-item-premium { flex-direction: column; align-items: flex-start; gap: 10px; padding: 14px; }
          .activity-item-image { width: 100%; height: 120px; }
          .activity-item-content { flex-direction: column; align-items: flex-start; width: 100%; }
          .activity-item-right { flex-direction: row; align-items: center; width: 100%; justify-content: space-between; }
          .activity-card-footer { flex-direction: column; gap: 8px; align-items: flex-start; }
          .footer-stats-mini { flex-wrap: wrap; gap: 10px; }
          .stats-columns { height: 150px; gap: 10px; padding: 12px 6px 6px; }
          .stats-column-bar { width: 24px; height: 80px; }
          .stats-column-value { font-size: 14px; }
          .stats-details { grid-template-columns: 1fr; }
          .motivation-box { flex-direction: column; text-align: center; }
          .notification-dropdown { width: 320px; right: -60px; }
          .hero-title { font-size: 32px; }
          .cand-item-premium {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 16px 18px;
          }
          .cand-item-left { width: 100%; }
          .cand-item-right {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          .cand-image { width: 60px; height: 60px; }
          .cand-title { font-size: 15px; }
          .cand-meta { gap: 12px; }
          .cand-status { font-size: 11px; padding: 3px 12px; }
        }
        @media (max-width: 480px) {
          .progress-circle-main { width: 150px; height: 150px; }
          .circle-number { font-size: 28px; }
          .circle-label { font-size: 10px; }
          .circle-info-badge { display: none; }
          .progress-header-icon { width: 44px; height: 44px; }
          .progress-header-icon i { font-size: 20px; }
          .progress-header-left h3 { font-size: 20px; }
          .activity-item-image { height: 80px; }
          .activity-item-title { font-size: 13px; }
          .activity-item-status { font-size: 10px; padding: 2px 10px; }
          .activity-icon-box { width: 40px; height: 40px; }
          .activity-icon-box i { font-size: 16px; }
          .activity-title { font-size: 17px; }
          .stats-columns { height: 120px; padding: 10px 4px 4px; }
          .stats-column-bar { width: 20px; height: 60px; }
          .stats-column-label { font-size: 9px; }
          .stats-column-value { font-size: 12px; }
          .stats-column-percent { font-size: 10px; }
          .stats-detail-item { padding: 10px 12px; }
          .stats-detail-value { font-size: 16px; }
          .motivation-box { flex-direction: column; text-align: center; }
          .notification-dropdown { width: 290px; right: -80px; }
          .cand-item-premium { padding: 14px 14px; }
          .cand-image { width: 50px; height: 50px; border-radius: 12px; }
          .cand-status-badge { width: 22px; height: 22px; font-size: 10px; }
          .cand-title { font-size: 14px; }
          .cand-company { font-size: 12px; }
          .cand-meta span { font-size: 11px; }
          .cand-action { font-size: 12px; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="logo">
            <span>Stage<span>Flow</span></span>
          </Link>
          <div className="nav-links">
            <Link to="/">Accueil</Link>
            <Link to="/offres">Offres</Link>
            <Link to="/dashboard-etudiant" className="active">Dashboard</Link>
            <Link to="/about">À propos</Link>
          </div>
          <div className="auth-buttons">
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
                          <div className="notif-icon" style={{ background: 
                            notif.type === 'candidature_acceptée' ? '#10b981' :
                            notif.type === 'candidature_refusée' ? '#ef4444' :
                            notif.type === 'nouvelle_offre' ? '#3b82f6' :
                            notif.type === 'recommandation' ? '#8B5A2B' : '#f59e0b'
                          }}>
                            <i className={notif.icone || 'fas fa-bell'}></i>
                          </div>
                          <div className="notif-content">
                            <p className="notif-title">{notif.titre}</p>
                            <p className="notif-message">{notif.message}</p>
                            <span className="notif-time">
                              {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
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
                      <Link to="/notifications">Voir toutes les notifications</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="user-menu">
              <button className="user-btn">
                <div className="user-avatar">
                  {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                </div>
                <span>{user?.prenom}</span>
                <i className="fas fa-chevron-down"></i>
              </button>
              <div className="user-dropdown">
                <Link to={getDashboardLink()}><i className="fas fa-tachometer-alt"></i> Tableau de bord</Link>
                <Link to="/profile"><i className="fas fa-user"></i> Mon profil</Link>
                <Link to="/mes-candidatures"><i className="fas fa-file-alt"></i> Mes candidatures</Link>
                <Link to="/recommandations"><i className="fas fa-robot"></i> Recommandations IA</Link>
                <Link to="/formations"><i className="fas fa-graduation-cap"></i> Mes formations</Link>
                <Link to="/competences"><i className="fas fa-code"></i> Mes compétences</Link>
                <Link to="/mon-cv"><i className="fas fa-file-pdf"></i> Mon CV</Link>
                <hr />
                <button onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Déconnexion</button>
              </div>
            </div>
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
          <Link to="/dashboard-etudiant" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#8B5A2B', padding: '12px', borderRadius: '12px', background: '#fef3e8' }}>Dashboard</Link>
          <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#4a5568', padding: '12px', borderRadius: '12px' }}>Mon profil</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* HERO PREMIUM */}
      <section className="hero-dashboard-premium">
        <div className="hero-dashboard-bg"></div>
        <div className="hero-dashboard-overlay"></div>
        <div className="hero-dashboard-container">
          <div className="hero-dashboard-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Tableau de bord personnel
            </div>
            <h1 className="hero-title">
              Bonjour, <span className="hero-name">{user?.prenom || user?.nom || 'Étudiant'}</span> 
            </h1>
            <p className="hero-desc">
              Gérez vos candidatures, recevez des recommandations personnalisées et avancez vers votre futur stage.
            </p>
            <div className="hero-buttons">
              <Link to="/mes-candidatures" className="hero-btn hero-btn-primary">
                <i className="fas fa-file-alt"></i> Mes candidatures
              </Link>
              <Link to="/recommandations" className="hero-btn hero-btn-secondary">
                <i className="fas fa-robot"></i> Recommandations IA
              </Link>
              <Link to="/cv" className="hero-btn hero-btn-outline">
                <i className="fas fa-file-pdf"></i> Mon CV
              </Link>
              <Link to="/profile" className="hero-btn hero-btn-light">
                <i className="fas fa-user-edit"></i> Modifier profil
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-card-glass">
                <div className="stat-number">{stats.totalCandidatures}</div>
                <div className="stat-label">Candidatures</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.acceptees}</div>
                <div className="stat-label">Acceptées</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.enAttente}</div>
                <div className="stat-label">En attente</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.recommandationsCount}</div>
                <div className="stat-label">Recommandations</div>
              </div>
            </div>
          </div>
          <div className="hero-avatar">
            <div className="avatar-wrapper">
              <div className="avatar-ring"></div>
              <div className="avatar-circle">
                {studentPhoto ? (
                  <img src={studentPhoto} alt="Avatar" />
                ) : (
                  <div className="avatar-initials">
                    {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                  </div>
                )}
                <div className="avatar-badge">
                  <i className="fas fa-check-circle"></i>
                </div>
              </div>
            </div>
            <div className="hero-quote">
              <i className="fas fa-quote-left"></i> “Chaque stage est une étape vers votre réussite.”
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="container">
        {/* STATS GRID */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><i className="fas fa-file-alt"></i></div>
            <div className="stat-info">
              <div className="stat-number">{stats.totalCandidatures}</div>
              <div className="stat-label">Total candidatures</div>
              <div className="stat-trend"><i className="fas fa-arrow-up"></i> +12% ce mois</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
            <div className="stat-info">
              <div className="stat-number">{stats.acceptees}</div>
              <div className="stat-label">Acceptées</div>
              <div className="stat-trend"><i className="fas fa-arrow-up"></i> +5% ce mois</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><i className="fas fa-hourglass-half"></i></div>
            <div className="stat-info">
              <div className="stat-number">{stats.enAttente}</div>
              <div className="stat-label">En attente</div>
              <div className="stat-trend negative"><i className="fas fa-arrow-down"></i> -3% ce mois</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><i className="fas fa-star"></i></div>
            <div className="stat-info">
              <div className="stat-number">{stats.recommandationsCount}</div>
              <div className="stat-label">Recommandations</div>
              <div className="stat-trend"><i className="fas fa-arrow-up"></i> +18% ce mois</div>
            </div>
          </div>
        </div>

        {/* SECTION PROGRESSION */}
        <div className="progress-section">
          <div className="progress-card">
            <div className="progress-bg-gradient"></div>
            <div className="progress-overlay"></div>
            
            <div className="progress-header">
              <div className="progress-header-left">
                <div className="progress-header-icon">
                  <i className="fas fa-rocket"></i>
                </div>
                <div>
                  <h3>Votre progression</h3>
                  <p className="progress-subtitle">Suivez votre évolution vers le stage idéal</p>
                </div>
              </div>
              <div className="progress-header-right">
                <span className={`progress-badge ${stats.tauxSuccess >= 70 ? 'excellent' : stats.tauxSuccess >= 40 ? 'bon' : 'moyen'}`}>
                  {stats.tauxSuccess >= 70 ? '🌟 Excellent' : stats.tauxSuccess >= 40 ? '📈 En bonne voie' : '💪 À améliorer'}
                </span>
                <span className="progress-update">
                  <i className="fas fa-sync-alt"></i> Mis à jour aujourd'hui
                </span>
              </div>
            </div>

            <div className="progress-grid">
              <div className="progress-circle-wrapper">
                <div className="progress-circle-main">
                  <div className="progress-circle-ring"></div>
               <div className="progress-circle-container">
  <svg viewBox="0 0 220 220">
    <circle className="circle-bg" cx="110" cy="110" r="90" />
    <circle 
      className="circle-fill" 
      cx="110" 
      cy="110" 
      r="90"
      key={stats.tauxSuccess}
      style={{
        strokeDasharray: `${2 * Math.PI * 90}`,
        strokeDashoffset: `${2 * Math.PI * 90 - (stats.tauxSuccess / 100) * 2 * Math.PI * 90}`,
        stroke: stats.tauxSuccess >= 70 ? '#10b981' : stats.tauxSuccess >= 40 ? '#f59e0b' : '#ef4444',
        transition: 'stroke-dashoffset 1.5s ease'
      }}
    />
  </svg>
  <div className="circle-text-center">
    <span className="circle-number">{stats.tauxSuccess}%</span>
    <span className="circle-label">Taux de succès</span>
    <div className="circle-status-dot" style={{ 
      background: stats.tauxSuccess >= 70 ? '#10b981' : stats.tauxSuccess >= 40 ? '#f59e0b' : '#ef4444'
    }}></div>
  </div>
</div>
                  
                  <div className="circle-info-badge top-right">
                    <i className="fas fa-trophy" style={{ color: '#ffd966' }}></i>
                    <span>{stats.acceptees} acceptées</span>
                  </div>
                  <div className="circle-info-badge bottom-left">
                    <i className="fas fa-clock" style={{ color: '#f59e0b' }}></i>
                    <span>{stats.enAttente} en attente</span>
                  </div>
                  <div className="circle-info-badge bottom-right">
                    <i className="fas fa-times" style={{ color: '#ef4444' }}></i>
                    <span>{stats.refusees || 0} refusées</span>
                  </div>
                </div>
              </div>

              <div className="progress-details">
                <div className="progress-details-header">
                  <span className="progress-details-title">Détail des candidatures</span>
                  <span className="progress-details-total">Total: {stats.totalCandidatures}</span>
                </div>

                <div className="progress-global-bar">
                  <div className="progress-global-segment" style={{ 
                    width: `${stats.totalCandidatures > 0 ? (stats.acceptees / stats.totalCandidatures) * 100 : 0}%`,
                    background: '#10b981'
                  }}></div>
                  <div className="progress-global-segment" style={{ 
                    width: `${stats.totalCandidatures > 0 ? (stats.enAttente / stats.totalCandidatures) * 100 : 0}%`,
                    background: '#f59e0b'
                  }}></div>
                  <div className="progress-global-segment" style={{ 
                    width: `${stats.totalCandidatures > 0 ? ((stats.refusees || 0) / stats.totalCandidatures) * 100 : 0}%`,
                    background: '#ef4444'
                  }}></div>
                </div>
                <div className="progress-global-labels">
                  <span><span className="dot" style={{ background: '#10b981' }}></span> Acceptées</span>
                  <span><span className="dot" style={{ background: '#f59e0b' }}></span> En attente</span>
                  <span><span className="dot" style={{ background: '#ef4444' }}></span> Refusées</span>
                </div>

                <div className="progress-detail-item">
                  <div className="progress-detail-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div className="progress-detail-info">
                    <span className="label">Acceptées</span>
                    <span className="value">{stats.acceptees}</span>
                  </div>
                  <div className="progress-detail-bar">
                    <div className="fill" style={{ 
                      width: `${stats.totalCandidatures > 0 ? (stats.acceptees / stats.totalCandidatures) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #10b981, #34d399)'
                    }}></div>
                  </div>
                  <span className="progress-detail-percent">
                    {stats.totalCandidatures > 0 ? Math.round((stats.acceptees / stats.totalCandidatures) * 100) : 0}%
                  </span>
                </div>

                <div className="progress-detail-item">
                  <div className="progress-detail-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    <i className="fas fa-hourglass-half"></i>
                  </div>
                  <div className="progress-detail-info">
                    <span className="label">En attente</span>
                    <span className="value">{stats.enAttente}</span>
                  </div>
                  <div className="progress-detail-bar">
                    <div className="fill" style={{ 
                      width: `${stats.totalCandidatures > 0 ? (stats.enAttente / stats.totalCandidatures) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    }}></div>
                  </div>
                  <span className="progress-detail-percent">
                    {stats.totalCandidatures > 0 ? Math.round((stats.enAttente / stats.totalCandidatures) * 100) : 0}%
                  </span>
                </div>

                <div className="progress-detail-item">
                  <div className="progress-detail-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                    <i className="fas fa-times-circle"></i>
                  </div>
                  <div className="progress-detail-info">
                    <span className="label">Refusées</span>
                    <span className="value">{stats.refusees || 0}</span>
                  </div>
                  <div className="progress-detail-bar">
                    <div className="fill" style={{ 
                      width: `${stats.totalCandidatures > 0 ? ((stats.refusees || 0) / stats.totalCandidatures) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #ef4444, #f87171)'
                    }}></div>
                  </div>
                  <span className="progress-detail-percent">
                    {stats.totalCandidatures > 0 ? Math.round(((stats.refusees || 0) / stats.totalCandidatures) * 100) : 0}%
                  </span>
                </div>

                <div className="progress-advice-card">
                  <div className="progress-advice-icon">
                    <i className="fas fa-lightbulb"></i>
                  </div>
                  <div className="progress-advice-content">
                    <span className="progress-advice-label">💡 Conseil personnalisé</span>
                    <p className="progress-advice-text">{getSuccessMessage().text}</p>
                  </div>
                  <Link to="/recommandations" className="progress-advice-action">
                    Voir les recommandations <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>

                <div className="progress-next-goal">
                  <div className="progress-goal-icon">
                    <i className="fas fa-bullseye"></i>
                  </div>
                  <div className="progress-goal-content">
                    <span className="progress-goal-label">🎯 Objectif suivant</span>
                    <p className="progress-goal-text">
                      {stats.acceptees >= 3 
                        ? 'Vous avez déjà 3 acceptations ! Visez maintenant 5 candidatures pour maximiser vos chances.' 
                        : stats.totalCandidatures === 0 
                          ? 'Commencez par postuler à 3 offres pour lancer votre recherche.' 
                          : `Postulez à ${3 - stats.totalCandidatures} offre${3 - stats.totalCandidatures > 1 ? 's' : ''} supplémentaire${3 - stats.totalCandidatures > 1 ? 's' : ''} pour atteindre votre objectif.`}
                    </p>
                  </div>
                  <div className="progress-goal-progress">
                    <div className="progress-goal-bar">
                      <div className="progress-goal-fill" style={{ 
                        width: `${Math.min((stats.totalCandidatures / 3) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, #8B5A2B, #ffd966)'
                      }}></div>
                    </div>
                    <span className="progress-goal-number">{Math.min(stats.totalCandidatures, 3)}/3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION ACTIVITÉ RÉCENTE */}
        <div className="activity-section">
          <div className="activity-grid">
            {/* Activité récente avec images */}
            <div className="activity-card">
              <div className="activity-card-shine"></div>
              
              <div className="activity-header-premium">
                <div className="activity-header-left">
                  <div className="activity-icon-box">
                    <i className="fas fa-bolt"></i>
                  </div>
                  <div>
                    <h3 className="activity-title">Activité récente</h3>
                    <span className="activity-subtitle">
                      <span className="live-dot"></span> En direct
                    </span>
                  </div>
                </div>
                <Link to="/mes-candidatures" className="activity-view-all">
                  Voir tout <i className="fas fa-arrow-right"></i>
                </Link>
              </div>

              <div className="activity-list">
                {candidatures.length > 0 ? (
                  candidatures.slice(0, 4).map((c, idx) => {
                    const statut = c.statut || 'en_attente';
                    const statusConfig = {
                      'acceptée': { color: '#10b981', bg: 'linear-gradient(135deg, #dcfce7, #a7f3d0)', icon: 'fa-check-circle', label: 'Acceptée', emoji: '✅' },
                      'accepte': { color: '#10b981', bg: 'linear-gradient(135deg, #dcfce7, #a7f3d0)', icon: 'fa-check-circle', label: 'Acceptée', emoji: '✅' },
                      'refusée': { color: '#ef4444', bg: 'linear-gradient(135deg, #fee2e2, #fca5a5)', icon: 'fa-times-circle', label: 'Refusée', emoji: '❌' },
                      'refuse': { color: '#ef4444', bg: 'linear-gradient(135deg, #fee2e2, #fca5a5)', icon: 'fa-times-circle', label: 'Refusée', emoji: '❌' },
                      'en_attente': { color: '#f59e0b', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', icon: 'fa-clock', label: 'En attente', emoji: '⏳' },
                      'pending': { color: '#f59e0b', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', icon: 'fa-clock', label: 'En attente', emoji: '⏳' }
                    };
                    const config = statusConfig[statut] || statusConfig['en_attente'];
                    
                    const activityImages = [
                      '/images/do.png', '/images/do1.png', '/images/do2.png', '/images/do3.png',
                      '/images/do4.png', '/images/do5.png', '/images/doo.png', '/images/doo1.png'
                    ];
                    const imgIndex = (c.id || idx) % activityImages.length;
                    
                    return (
                      <div key={idx} className="activity-item-premium">
                        <div className="activity-item-image" style={{ backgroundImage: `url('${activityImages[imgIndex]}')` }}>
                          <div className="activity-item-overlay"></div>
                          <div className="activity-item-badge" style={{ background: config.color }}>
                            <i className={`fas ${config.icon}`}></i>
                          </div>
                        </div>
                        <div className="activity-item-content">
                          <div className="activity-item-left">
                            <div className="activity-item-info">
                              <span className="activity-item-title">
                                <strong>{c.offre?.titre || 'Offre'}</strong>
                              </span>
                              <span className="activity-item-company">
                                <i className="fas fa-building"></i>
                                {c.offre?.entreprise?.nom || 'Entreprise'}
                              </span>
                              <span className="activity-item-date">
                                <i className="far fa-calendar-alt"></i>
                                {new Date(c.created_at || c.dateCandidature).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="activity-item-right">
                            <div className="activity-item-status" style={{ background: config.bg, color: config.color }}>
                              {config.emoji} {config.label}
                            </div>
                            <Link to={`/offres/${c.offre?.idOffre}`} className="activity-item-action">
                              <i className="fas fa-eye"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="activity-empty-premium">
                    <div className="empty-illustration">
                      <i className="fas fa-inbox"></i>
                    </div>
                    <h4>Pas encore d'activité</h4>
                    <p>Commencez à postuler pour voir vos actions ici</p>
                    <Link to="/offres" className="empty-action-btn">
                      <i className="fas fa-search"></i> Explorer les offres
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="activity-card-footer">
                <div className="footer-stats-mini">
                  <span><i className="fas fa-file-alt"></i> {stats.totalCandidatures} candidatures</span>
                  <span><i className="fas fa-clock"></i> {stats.enAttente} en attente</span>
                  <span><i className="fas fa-check-circle"></i> {stats.acceptees} acceptées</span>
                </div>
                <Link to="/mes-candidatures" className="footer-link">
                  Gérer mes candidatures <i className="fas fa-chevron-right"></i>
                </Link>
              </div>
            </div>

            {/* Répartition avec colonnes */}
            <div className="activity-card stats-card">
              <div className="activity-card-shine"></div>
              
              <div className="activity-header-premium">
                <div className="activity-header-left">
                  <div className="activity-icon-box" style={{ background: 'linear-gradient(135deg, #8B5A2B, #5D3A1A)' }}>
                    <i className="fas fa-chart-bar"></i>
                  </div>
                  <div>
                    <h3 className="activity-title">Répartition</h3>
                    <span className="activity-subtitle">Vue d'ensemble des candidatures</span>
                  </div>
                </div>
                <div className="activity-header-right">
                  <span className="total-badge">Total: {stats.totalCandidatures}</span>
                </div>
              </div>

              <div className="stats-columns">
                <div className="stats-column">
                  <div className="stats-column-header">
                    <span className="stats-column-label">Acceptées</span>
                    <span className="stats-column-value">{stats.acceptees}</span>
                  </div>
                  <div className="stats-column-bar">
                    <div className="stats-column-fill" style={{ 
                      height: `${stats.totalCandidatures > 0 ? (stats.acceptees / stats.totalCandidatures) * 100 : 0}%`,
                      background: 'linear-gradient(180deg, #34d399, #10b981)'
                    }}></div>
                  </div>
                  <span className="stats-column-percent" style={{ color: '#10b981' }}>
                    {stats.totalCandidatures > 0 ? Math.round((stats.acceptees / stats.totalCandidatures) * 100) : 0}%
                  </span>
                </div>

                <div className="stats-column">
                  <div className="stats-column-header">
                    <span className="stats-column-label">En attente</span>
                    <span className="stats-column-value">{stats.enAttente}</span>
                  </div>
                  <div className="stats-column-bar">
                    <div className="stats-column-fill" style={{ 
                      height: `${stats.totalCandidatures > 0 ? (stats.enAttente / stats.totalCandidatures) * 100 : 0}%`,
                      background: 'linear-gradient(180deg, #fbbf24, #f59e0b)'
                    }}></div>
                  </div>
                  <span className="stats-column-percent" style={{ color: '#f59e0b' }}>
                    {stats.totalCandidatures > 0 ? Math.round((stats.enAttente / stats.totalCandidatures) * 100) : 0}%
                  </span>
                </div>

                <div className="stats-column">
                  <div className="stats-column-header">
                    <span className="stats-column-label">Refusées</span>
                    <span className="stats-column-value">{stats.refusees || 0}</span>
                  </div>
                  <div className="stats-column-bar">
                    <div className="stats-column-fill" style={{ 
                      height: `${stats.totalCandidatures > 0 ? ((stats.refusees || 0) / stats.totalCandidatures) * 100 : 0}%`,
                      background: 'linear-gradient(180deg, #f87171, #ef4444)'
                    }}></div>
                  </div>
                  <span className="stats-column-percent" style={{ color: '#ef4444' }}>
                    {stats.totalCandidatures > 0 ? Math.round(((stats.refusees || 0) / stats.totalCandidatures) * 100) : 0}%
                  </span>
                </div>

                <div className="stats-column total-column">
                  <div className="stats-column-header">
                    <span className="stats-column-label">Total</span>
                    <span className="stats-column-value" style={{ color: '#8B5A2B' }}>{stats.totalCandidatures}</span>
                  </div>
                  <div className="stats-column-bar">
                    <div className="stats-column-fill" style={{ 
                      height: '100%',
                      background: 'linear-gradient(180deg, #ffd966, #8B5A2B)'
                    }}></div>
                  </div>
                  <span className="stats-column-percent" style={{ color: '#8B5A2B' }}>
                    100%
                  </span>
                </div>
              </div>

              <div className="stats-details">
                <div className="stats-detail-item" style={{ borderLeft: '4px solid #10b981' }}>
                  <div className="stats-detail-icon" style={{ background: '#10b981' }}>
                    <i className="fas fa-check"></i>
                  </div>
                  <div className="stats-detail-info">
                    <span className="stats-detail-label">Taux d'acceptation</span>
                    <span className="stats-detail-value" style={{ color: '#10b981' }}>
                      {stats.totalCandidatures > 0 ? Math.round((stats.acceptees / stats.totalCandidatures) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="stats-detail-item" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="stats-detail-icon" style={{ background: '#f59e0b' }}>
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="stats-detail-info">
                    <span className="stats-detail-label">En attente</span>
                    <span className="stats-detail-value" style={{ color: '#f59e0b' }}>
                      {stats.enAttente}
                    </span>
                  </div>
                </div>
                <div className="stats-detail-item" style={{ borderLeft: '4px solid #ef4444' }}>
                  <div className="stats-detail-icon" style={{ background: '#ef4444' }}>
                    <i className="fas fa-times"></i>
                  </div>
                  <div className="stats-detail-info">
                    <span className="stats-detail-label">Refusées</span>
                    <span className="stats-detail-value" style={{ color: '#ef4444' }}>
                      {stats.refusees || 0}
                    </span>
                  </div>
                </div>
                <div className="stats-detail-item" style={{ borderLeft: '4px solid #8B5A2B', background: 'linear-gradient(135deg, #fef3e8, #fff5ed)' }}>
                  <div className="stats-detail-icon" style={{ background: '#8B5A2B' }}>
                    <i className="fas fa-file-alt"></i>
                  </div>
                  <div className="stats-detail-info">
                    <span className="stats-detail-label">Total candidatures</span>
                    <span className="stats-detail-value" style={{ color: '#8B5A2B' }}>
                      {stats.totalCandidatures}
                    </span>
                  </div>
                </div>
              </div>

              <div className="motivation-box">
                <div className="motivation-icon">
                  <i className="fas fa-rocket"></i>
                </div>
                <div className="motivation-text">
                  <span className="motivation-label">💡 Conseil du jour</span>
                  <p>
                    {stats.totalCandidatures === 0 
                      ? 'Commencez à postuler pour booster votre carrière ! 🚀'
                      : stats.acceptees >= 3 
                        ? 'Bravo ! Vous êtes sur la bonne voie pour décrocher le stage idéal ! 🌟'
                        : stats.enAttente > 0 
                          ? `${stats.enAttente} candidature${stats.enAttente > 1 ? 's' : ''} en attente de réponse. Restez patient ! ⏳`
                          : 'Continuez à postuler, votre persévérance paiera ! 💪'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARDS GRID - RECOMMANDATIONS & CANDIDATURES */}
        <div className="cards-grid">
          {/* Carte Recommandations */}
          <div className="card">
            <div className="card-header">
              <h3><i className="fas fa-star"></i> Top recommandations</h3>
              <Link to="/recommandations" className="btn-link">Voir tout →</Link>
            </div>
            <div className="card-body-rec">
              {recs.length === 0 ? (
                <div className="empty-state-rec">
                  <i className="fas fa-inbox"></i>
                  <p>Aucune recommandation pour le moment</p>
                  <Link to="/offres" className="btn-link">Explorer les offres →</Link>
                </div>
              ) : (
                recs.map((item, idx) => {
                  const offreId = item.offre?.idOffre || item.id || idx;
                  const startIndex = (parseInt(offreId) * 3) % baseImages.length;
                  const imageUrl = baseImages[startIndex % baseImages.length];
                  return (
                    <Link to={`/offres/${offreId}`} key={idx} className="rec-item-premium">
                      <div className="rec-image">
                        <img src={imageUrl} alt={item.offre?.titre || item.titre} />
                        <div className="rec-score-badge">{Math.round(item.score || 85)}%</div>
                      </div>
                      <div className="rec-details">
                        <h4 className="rec-title-premium">{item.offre?.titre || item.titre}</h4>
                        <div className="rec-company-premium">
                          <i className="fas fa-building"></i> {item.offre?.entreprise?.nom || 'Entreprise'}
                        </div>
                        <div className="rec-tags">
                          <span className="rec-tag">{item.offre?.typeStage || 'Stage'}</span>
                          <span className="rec-tag">{item.offre?.ville || 'Distanciel'}</span>
                        </div>
                      </div>
                      <div className="rec-action">
                        <span>Postuler</span>
                        <i className="fas fa-arrow-right"></i>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            <div className="card-footer">
              <Link to="/offres" className="btn-link">Explorer toutes les offres →</Link>
            </div>
          </div>

          {/* Carte Dernières candidatures - DESIGN PREMIUM */}
          <div className="card">
            <div className="card-header">
              <h3><i className="fas fa-clock"></i> Dernières candidatures</h3>
              <Link to="/mes-candidatures" className="btn-link">Voir tout →</Link>
            </div>
            
            <div className="card-body-cand-premium">
              {candidatures.length === 0 ? (
                <div className="empty-state-cand-premium">
                  <div className="empty-icon">
                    <i className="fas fa-folder-open"></i>
                  </div>
                  <h4>Aucune candidature</h4>
                  <p>Vous n'avez pas encore postulé à une offre.</p>
                  <Link to="/offres" className="btn-primary-cand">
                    <i className="fas fa-search"></i> Explorer les offres
                  </Link>
                </div>
              ) : (
                <div className="cand-list-premium">
                  {candidatures.map((c, idx) => {
                    const statut = c.statut || 'en_attente';
                    const statusConfig = {
                      'acceptée': { 
                        color: '#10b981', 
                        bg: 'linear-gradient(135deg, #dcfce7, #a7f3d0)', 
                        icon: 'fa-check-circle', 
                        label: 'Acceptée',
                        emoji: '✅',
                        borderColor: '#10b981'
                      },
                      'accepte': { 
                        color: '#10b981', 
                        bg: 'linear-gradient(135deg, #dcfce7, #a7f3d0)', 
                        icon: 'fa-check-circle', 
                        label: 'Acceptée',
                        emoji: '✅',
                        borderColor: '#10b981'
                      },
                      'refusée': { 
                        color: '#ef4444', 
                        bg: 'linear-gradient(135deg, #fee2e2, #fca5a5)', 
                        icon: 'fa-times-circle', 
                        label: 'Refusée',
                        emoji: '❌',
                        borderColor: '#ef4444'
                      },
                      'refuse': { 
                        color: '#ef4444', 
                        bg: 'linear-gradient(135deg, #fee2e2, #fca5a5)', 
                        icon: 'fa-times-circle', 
                        label: 'Refusée',
                        emoji: '❌',
                        borderColor: '#ef4444'
                      },
                      'en_attente': { 
                        color: '#f59e0b', 
                        bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', 
                        icon: 'fa-clock', 
                        label: 'En attente',
                        emoji: '⏳',
                        borderColor: '#f59e0b'
                      },
                      'pending': { 
                        color: '#f59e0b', 
                        bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', 
                        icon: 'fa-clock', 
                        label: 'En attente',
                        emoji: '⏳',
                        borderColor: '#f59e0b'
                      }
                    };
                    const config = statusConfig[statut] || statusConfig['en_attente'];
                    
                    const offreId = c.offre?.idOffre || idx;
                    const imageIndex = (offreId * 2) % baseImages.length;
                    const imageUrl = baseImages[imageIndex];
                    
                    return (
                      <Link to={`/offres/${c.offre?.idOffre}`} key={idx} className="cand-item-premium">
                        <div className="cand-item-left">
                          <div className="cand-image-wrapper">
                            <div className="cand-image" style={{ backgroundImage: `url('${imageUrl}')` }}>
                              <div className="cand-image-overlay"></div>
                              <div className="cand-status-badge" style={{ background: config.color }}>
                                {config.emoji}
                              </div>
                            </div>
                          </div>
                          <div className="cand-info">
                            <h4 className="cand-title">{c.offre?.titre || 'Offre'}</h4>
                            <div className="cand-company">
                              <i className="fas fa-building"></i>
                              {c.offre?.entreprise?.nom || 'Entreprise'}
                            </div>
                            <div className="cand-meta">
                              <span className="cand-location">
                                <i className="fas fa-map-marker-alt"></i>
                                {c.offre?.ville || 'Non spécifiée'}
                              </span>
                              <span className="cand-date">
                                <i className="fas fa-calendar-alt"></i>
                                {new Date(c.created_at || c.dateCandidature).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="cand-type">
                                <i className="fas fa-tag"></i>
                                {c.offre?.typeStage || 'Stage'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="cand-item-right">
                          <div className="cand-status" style={{ 
                            background: config.bg, 
                            color: config.color,
                            borderColor: config.borderColor
                          }}>
                            <i className={`fas ${config.icon}`}></i>
                            {config.label}
                          </div>
                          <div className="cand-action">
                            <span>Voir l'offre</span>
                            <i className="fas fa-chevron-right"></i>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="card-footer">
              <Link to="/mes-candidatures" className="btn-link">
                <i className="fas fa-file-alt"></i> Gérer mes candidatures →
              </Link>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS PREMIUM */}
        <div className="quick-actions-premium">
          <Link to="/formations" className="action-card-premium">
            <div className="action-icon-premium">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <div className="action-content">
              <h3>Formations</h3>
              <p>Ajoutez vos diplômes et cursus</p>
            </div>
            <div className="action-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
          </Link>

          <Link to="/competences" className="action-card-premium">
            <div className="action-icon-premium">
              <i className="fas fa-code"></i>
            </div>
            <div className="action-content">
              <h3>Compétences</h3>
              <p>Mettez à jour vos compétences techniques</p>
            </div>
            <div className="action-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
          </Link>

          <Link to="/profile" className="action-card-premium">
            <div className="action-icon-premium">
              <i className="fas fa-user-edit"></i>
            </div>
            <div className="action-content">
              <h3>Mon profil</h3>
              <p>Complétez vos informations personnelles</p>
            </div>
            <div className="action-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
          </Link>

          <Link to="/cv" className="action-card-premium">
            <div className="action-icon-premium">
              <i className="fas fa-file-pdf"></i>
            </div>
            <div className="action-content">
              <h3>Mon CV</h3>
              <p>Téléchargez votre CV</p>
            </div>
            <div className="action-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
          </Link>
        </div>
      </div>

      {/* FOOTER */}
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
              <Link to="/recommandations">Recommandations</Link>
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