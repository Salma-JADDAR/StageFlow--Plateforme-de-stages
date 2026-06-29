import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function OffreDetail() {
  const { id } = useParams();
  const [offre, setOffre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lettre, setLettre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeThumbnail, setActiveThumbnail] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Base d'images pour tous les stages
  const baseImages = [
    '/images/do.png', '/images/do1.png', '/images/do2.png', '/images/do3.png',
    '/images/do4.png', '/images/do5.png', '/images/do6.png', '/images/do7.png',
    '/images/do8.png', '/images/do9.png', '/images/doo.png', '/images/doo1.png',
    '/images/doo2.png', '/images/doo3.png', '/images/doo4.png', '/images/doo5.png',
  ];

  const getImagesForOffre = (offreId) => {
    const idNumber = parseInt(offreId) || 1;
    const startIndex = (idNumber * 3) % baseImages.length;
    return [
      baseImages[startIndex % baseImages.length],
      baseImages[(startIndex + 1) % baseImages.length],
      baseImages[(startIndex + 2) % baseImages.length],
    ];
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const fetchOffre = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/offres/${id}`);
        const offreData = response.data.data || response.data;
        setOffre(offreData);
      } catch (error) {
        console.error('Erreur:', error);
        setError(error.response?.data?.message || 'Erreur lors du chargement');
        toast.error('Impossible de charger les détails');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchOffre();
      fetchNotifications();
    }

    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [id]);

  const handlePostuler = async (e) => {
    e.preventDefault();
    if (!user) { 
      toast.error('Connectez-vous pour postuler'); 
      navigate('/login'); 
      return; 
    }
    if (user.role !== 'etudiant') { 
      toast.error('Seuls les étudiants peuvent postuler'); 
      return; 
    }
    if (!lettre.trim()) {
      toast.error('Veuillez écrire une lettre de motivation');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`/etudiant/offres/${id}/postuler`, { lettreMotivation: lettre });
      toast.success('Candidature envoyée avec succès !');
      navigate('/mes-candidatures');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Connectez-vous pour envoyer un message');
      navigate('/login');
      return;
    }
    if (!contactMessage.trim()) {
      toast.error('Veuillez écrire un message');
      return;
    }
    
    setSendingMessage(true);
    try {
      await api.post(`/offres/${id}/contact`, { 
        message: contactMessage,
        destinataire_id: offre?.user_id 
      });
      toast.success('Message envoyé avec succès !');
      setShowContactModal(false);
      setContactMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSendingMessage(false);
    }
  };

  const isDeadlinePassed = offre && new Date(offre.dateLimite) < new Date();
  const images = offre ? getImagesForOffre(offre.idOffre) : baseImages.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-[#8B5A2B] rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (error || !offre) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-8xl mb-6">🔍</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Offre non trouvée</h2>
          <p className="text-gray-500 mb-8">{error || "L'offre que vous recherchez n'existe pas ou a été supprimée."}</p>
          <Link to="/offres" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5D3A1A] to-[#8B5A2B] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all">
            ← Retour aux offres
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="offre-detail-page">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .offre-detail-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
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

        /* Container */
        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 100px 32px 60px;
        }

        /* Breadcrumb */
        .breadcrumb {
          text-align: center;
          margin-bottom: 32px;
          font-size: 14px;
          color: #64748b;
        }
        .breadcrumb a {
          color: #8B5A2B;
          text-decoration: none;
          font-weight: 500;
        }
        .breadcrumb a:hover {
          text-decoration: underline;
        }
        .breadcrumb span {
          margin: 0 8px;
          color: #cbd5e1;
        }

        /* Detail Layout */
        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 48px;
        }

        /* Left Column */
        .detail-left {
          background: white;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 20px 35px -10px rgba(0,0,0,0.05);
          border: 1px solid #f0f2f5;
        }

        .image-container {
          position: relative;
        }
        .main-image {
          width: 100%;
          height: 480px;
          background-size: cover;
          background-position: center;
          transition: transform 0.5s ease;
        }
        .image-badge {
          position: absolute;
          top: 20px;
          left: 20px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 30px;
          z-index: 2;
        }
        .thumbnail-gallery {
          display: flex;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #eef2f0;
          overflow-x: auto;
          justify-content: center;
        }
        .thumbnail {
          width: 85px;
          height: 85px;
          border-radius: 16px;
          background-size: cover;
          background-position: center;
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid transparent;
        }
        .thumbnail:hover, .thumbnail.active {
          border-color: #8B5A2B;
          transform: translateY(-3px);
        }

        /* Annonce Info */
        .annonce-info {
          padding: 32px;
        }
        .annonce-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 20px;
          text-align: center;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .annonce-meta {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 1px solid #eef2f0;
          justify-content: center;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #64748b;
          background: #faf7f2;
          padding: 8px 16px;
          border-radius: 40px;
        }
        .meta-item i {
          color: #8B5A2B;
        }

        /* Details Grid */
        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin: 28px 0;
          padding: 28px 0;
          border-top: 1px solid #eef2f0;
          border-bottom: 1px solid #eef2f0;
        }
        .detail-card {
          background: #faf7f2;
          padding: 16px 20px;
          border-radius: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }
        .detail-card:hover {
          background: #efe6d8;
          transform: translateX(5px);
        }
        .detail-label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .detail-label i {
          color: #8B5A2B;
        }
        .detail-value {
          font-weight: 700;
          color: #0f172a;
        }

        /* Description */
        .description-text {
          color: #475569;
          line-height: 1.8;
          margin: 28px 0;
          font-size: 15px;
          text-align: center;
          background: #faf7f2;
          padding: 24px;
          border-radius: 20px;
          border-left: 4px solid #8B5A2B;
        }

        /* Right Column - Seller Card */
        .seller-card {
          background: white;
          border-radius: 32px;
          padding: 28px;
          box-shadow: 0 20px 35px -10px rgba(0,0,0,0.05);
          position: sticky;
          top: 100px;
          border: 1px solid #f0f2f5;
        }
        .seller-profile {
          display: flex;
          gap: 18px;
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 1px solid #eef2f0;
        }
        .seller-avatar {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 26px;
          font-weight: 700;
        }
        .seller-info h4 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #0f172a;
        }
        .seller-badge {
          background: #fef3e8;
          color: #8B5A2B;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: #faf7f2;
          border-radius: 20px;
          padding: 16px 8px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          background: #efe6d8;
          transform: translateY(-3px);
        }
        .stat-number {
          font-size: 20px;
          font-weight: 800;
          color: #8B5A2B;
        }
        .stat-label {
          font-size: 11px;
          color: #64748b;
        }

        /* Info List */
        .info-list {
          margin-bottom: 28px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #eef2f0;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-size: 13px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .info-label i {
          color: #8B5A2B;
          width: 18px;
        }
        .info-value {
          font-weight: 600;
          color: #0f172a;
          font-size: 13px;
        }

        /* Buttons */
        .btn-contact {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .btn-contact:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139,90,43,0.3);
        }
        .btn-outline {
          width: 100%;
          padding: 14px;
          background: transparent;
          border: 2px solid #8B5A2B;
          color: #8B5A2B;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .btn-outline:hover {
          background: #8B5A2B;
          color: white;
          transform: translateY(-2px);
        }
        .motivation-input {
          width: 100%;
          padding: 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-family: inherit;
          resize: vertical;
          background: #faf7f2;
        }
        .motivation-input:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139,90,43,0.1);
        }

        /* Trust Section */
        .trust-section {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .trust-badge {
          flex: 1;
          background: #faf7f2;
          padding: 10px;
          border-radius: 16px;
          font-size: 11px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #64748b;
        }
        .trust-badge i {
          color: #8B5A2B;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        .modal-content {
          background: white;
          border-radius: 24px;
          max-width: 500px;
          width: 90%;
          padding: 28px;
          animation: modalFadeIn 0.3s ease;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #64748b;
        }
        .modal-close:hover {
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

        @media (max-width: 900px) {
          .nav-links, .auth-buttons { display: none; }
          .mobile-menu-btn { display: block; }
          .detail-layout { grid-template-columns: 1fr; }
          .container { padding: 80px 20px 40px; }
          .main-image { height: 350px; }
          .annonce-title { font-size: 28px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .details-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 600px) {
          .container { padding: 70px 16px 40px; }
          .annonce-info { padding: 20px; }
          .annonce-title { font-size: 24px; }
          .main-image { height: 250px; }
          .thumbnail { width: 60px; height: 60px; }
          .seller-card { padding: 20px; }
          .detail-card { padding: 12px 16px; flex-direction: column; gap: 8px; text-align: center; }
        }
      `}</style>

      {/* ========== NAVBAR AVEC NOTIFICATIONS ========== */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="logo">
            <span>Stage<span>Flow</span></span>
          </Link>
          <div className="nav-links">
            <Link to="/">Accueil</Link>
            <Link to="/offres" className="active">Offres</Link>
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
                      <Link to="/mes-candidatures"><i className="fas fa-file-alt"></i> Mes candidatures</Link>
                      <Link to="/recommandations"><i className="fas fa-robot"></i> Recommandations IA</Link>
                      <Link to="/formations"><i className="fas fa-graduation-cap"></i> Mes formations</Link>
                      <Link to="/competences"><i className="fas fa-code"></i> Mes compétences</Link>
                      <Link to="/mon-cv"><i className="fas fa-file-pdf"></i> Mon CV</Link>
                    </>
                  )}
                  {user.role === 'recruteur' && (
                    <>
                      <Link to="/gestion-offres"><i className="fas fa-briefcase"></i> Mes offres</Link>
                      <Link to="/candidatures-reçues"><i className="fas fa-users"></i> Candidatures reçues</Link>
                      <Link to="/entreprise-profile"><i className="fas fa-building"></i> Mon entreprise</Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <Link to="/admin/utilisateurs"><i className="fas fa-users-cog"></i> Gérer utilisateurs</Link>
                      <Link to="/admin/offres"><i className="fas fa-clipboard-list"></i> Gérer offres</Link>
                      <Link to="/admin/statistiques"><i className="fas fa-chart-line"></i> Statistiques</Link>
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
          <Link to="/offres" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#8B5A2B', padding: '12px', borderRadius: '12px', background: '#fef3e8' }}>Offres</Link>
          {user && <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#4a5568', padding: '12px', borderRadius: '12px' }}>Tableau de bord</Link>}
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#4a5568', padding: '12px', borderRadius: '12px' }}>À propos</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* ========== MAIN CONTENT (inchangé) ========== */}
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">Accueil</Link>
          <span>/</span>
          <Link to="/offres">Offres</Link>
          <span>/</span>
          <span>{offre.titre}</span>
        </div>

        <div className="detail-layout">
          {/* Left Column */}
          <div className="detail-left">
            <div className="image-container">
              <div className="main-image" style={{ backgroundImage: `url(${images[activeThumbnail]})` }}>
                <div className="image-badge">✓ Stage vérifié</div>
              </div>
              <div className="thumbnail-gallery">
                {images.map((img, idx) => (
                  <div key={idx} className={`thumbnail ${activeThumbnail === idx ? 'active' : ''}`} 
                       style={{ backgroundImage: `url(${img})` }}
                       onClick={() => setActiveThumbnail(idx)}></div>
                ))}
              </div>
            </div>

            <div className="annonce-info">
              <h1 className="annonce-title">{offre.titre}</h1>
              <div className="annonce-meta">
                <div className="meta-item"><i className="fas fa-building"></i> {offre.entreprise?.nom || 'Entreprise'}</div>
                <div className="meta-item"><i className="fas fa-calendar-alt"></i> Publiée le {new Date(offre.datePublication).toLocaleDateString('fr-FR')}</div>
                <div className="meta-item"><i className="fas fa-map-marker-alt"></i> {offre.ville}</div>
                <div className="meta-item"><i className="fas fa-eye"></i> 245 vues</div>
              </div>
              <div className="details-grid">
                <div className="detail-card">
                  <span className="detail-label"><i className="fas fa-tag"></i> Type de stage</span>
                  <span className="detail-value">{offre.typeStage}</span>
                </div>
                <div className="detail-card">
                  <span className="detail-label"><i className="fas fa-clock"></i> Durée</span>
                  <span className="detail-value">{offre.duree} mois</span>
                </div>
                <div className="detail-card">
                  <span className="detail-label"><i className="fas fa-chart-line"></i> Niveau requis</span>
                  <span className="detail-value">Débutant / Intermédiaire</span>
                </div>
                <div className="detail-card">
                  <span className="detail-label"><i className="fas fa-calendar-check"></i> Date limite</span>
                  <span className="detail-value">{new Date(offre.dateLimite).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <div className="description-text">
                <p>{offre.description}</p>
              </div>
              {offre.competences?.length > 0 && (
                <div className="details-grid" style={{ borderTop: 'none', paddingTop: 0 }}>
                  {offre.competences.map(comp => (
                    <div key={comp.idCompetence} className="detail-card">
                      <span className="detail-label"><i className="fas fa-code"></i> Compétence</span>
                      <span className="detail-value">{comp.nom}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="seller-card">
            <div className="seller-profile">
              <div className="seller-avatar">{offre.entreprise?.nom?.charAt(0) || 'E'}</div>
              <div className="seller-info">
                <h4>{offre.entreprise?.nom || 'Entreprise'}</h4>
                <span className="seller-badge"><i className="fas fa-check-circle"></i> Entreprise vérifiée</span>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-number">{offre.entreprise?.offres?.length || 0}</div><div className="stat-label">Offres publiées</div></div>
              <div className="stat-card"><div className="stat-number">98%</div><div className="stat-label">Taux de réponse</div></div>
              <div className="stat-card"><div className="stat-number">4.9</div><div className="stat-label">Note moyenne</div></div>
            </div>
            <div className="info-list">
              <div className="info-row"><span className="info-label"><i className="fas fa-map-marker-alt"></i> Localisation</span><span className="info-value">{offre.ville || 'Non spécifiée'}</span></div>
              <div className="info-row"><span className="info-label"><i className="fas fa-calendar-alt"></i> Date de publication</span><span className="info-value">{new Date(offre.datePublication).toLocaleDateString('fr-FR')}</span></div>
              <div className="info-row"><span className="info-label"><i className="fas fa-hourglass-end"></i> Date limite</span><span className="info-value" style={{ color: isDeadlinePassed ? '#dc2626' : '#10b981' }}>{new Date(offre.dateLimite).toLocaleDateString('fr-FR')}{isDeadlinePassed && ' (Expirée)'}</span></div>
              <div className="info-row"><span className="info-label"><i className="fas fa-users"></i> Postes disponibles</span><span className="info-value">1</span></div>
              <div className="info-row"><span className="info-label"><i className="fas fa-graduation-cap"></i> Niveau d'étude</span><span className="info-value">Bac+3 / Bac+5</span></div>
              <div className="info-row"><span className="info-label"><i className="fas fa-language"></i> Langues requises</span><span className="info-value">Français, Anglais</span></div>
            </div>
            <div className="info-list">
              <div className="info-row"><span className="info-label"><i className="fas fa-envelope"></i> Email contact</span><span className="info-value">{offre.entreprise?.emailContact || 'contact@entreprise.com'}</span></div>
              <div className="info-row"><span className="info-label"><i className="fas fa-phone"></i> Téléphone</span><span className="info-value">{offre.entreprise?.telephone || '+212 5XX XXX XXX'}</span></div>
              {offre.entreprise?.siteWeb && (
                <div className="info-row"><span className="info-label"><i className="fas fa-globe"></i> Site web</span><span className="info-value"><a href={offre.entreprise.siteWeb} target="_blank" rel="noopener noreferrer" style={{ color: '#8B5A2B', textDecoration: 'none' }}>Visiter le site</a></span></div>
              )}
            </div>
            {user?.role === 'etudiant' && !isDeadlinePassed ? (
              !showForm ? (
                <>
                  <button className="btn-contact" onClick={() => setShowForm(true)}><i className="fas fa-paper-plane"></i> Postuler maintenant</button>
                  <button className="btn-outline" onClick={() => setShowContactModal(true)}><i className="fas fa-question-circle"></i> Contacter l'entreprise</button>
                </>
              ) : (
                <form onSubmit={handlePostuler}>
                  <textarea value={lettre} onChange={(e) => setLettre(e.target.value)} rows="5" className="motivation-input" placeholder="Exprimez votre motivation..." required />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button type="submit" disabled={submitting} className="btn-contact" style={{ marginBottom: 0 }}>{submitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}</button>
                    <button type="button" onClick={() => setShowForm(false)} className="btn-outline" style={{ marginBottom: 0, width: 'auto', padding: '14px 24px' }}>Annuler</button>
                  </div>
                </form>
              )
            ) : (
              <button className="btn-contact" onClick={() => navigate('/login')}><i className="fas fa-sign-in-alt"></i> Connectez-vous pour postuler</button>
            )}
            <div className="trust-section">
              <div className="trust-badge"><i className="fas fa-shield-alt"></i> Paiement sécurisé</div>
              <div className="trust-badge"><i className="fas fa-handshake"></i> Rencontre recommandée</div>
              <div className="trust-badge"><i className="fas fa-file-alt"></i> Contrat de stage</div>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>Partager cette offre</p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <a href="#" style={{ color: '#3b5998', fontSize: '18px' }}><i className="fab fa-facebook"></i></a>
                <a href="#" style={{ color: '#1da1f2', fontSize: '18px' }}><i className="fab fa-twitter"></i></a>
                <a href="#" style={{ color: '#0e76a8', fontSize: '18px' }}><i className="fab fa-linkedin"></i></a>
                <a href="#" style={{ color: '#25d366', fontSize: '18px' }}><i className="fab fa-whatsapp"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Contacter l'entreprise */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contacter {offre.entreprise?.nom || 'l\'entreprise'}</h3>
              <button className="modal-close" onClick={() => setShowContactModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSendMessage}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Votre message</label>
                <textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} rows="6" className="motivation-input" placeholder={`Bonjour,\n\nJe suis intéressé(e) par votre offre de stage "${offre.titre}" et je souhaiterais avoir plus d'informations...`} required />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" disabled={sendingMessage} className="btn-contact" style={{ marginBottom: 0 }}>{sendingMessage ? 'Envoi...' : 'Envoyer le message'}</button>
                <button type="button" onClick={() => setShowContactModal(false)} className="btn-outline" style={{ marginBottom: 0, width: 'auto', padding: '14px 24px' }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <p>La plateforme intelligente qui connecte les talents aux entreprises.</p>
              <div className="social-links">
                <a href="#"><i className="fab fa-linkedin-in"></i></a>
                <a href="#"><i className="fab fa-twitter"></i></a>
                <a href="#"><i className="fab fa-facebook-f"></i></a>
                <a href="#"><i className="fab fa-instagram"></i></a>
              </div>
            </div>
            <div className="footer-links">
              <h4>Plateforme</h4>
              <Link to="/offres">Offres de stage</Link>
              <Link to="/register">S'inscrire</Link>
              <Link to="/login">Se connecter</Link>
              <a href="#">Tarifs</a>
            </div>
            <div className="footer-links">
              <h4>Ressources</h4>
              <a href="#">Conseils CV et entretien</a>
              <a href="#">Guide du stage</a>
              <a href="#">Blog</a>
              <a href="#">FAQ</a>
            </div>
            <div className="footer-links">
              <h4>À propos</h4>
              <a href="#">Qui sommes-nous ?</a>
              <a href="#">Contact</a>
              <a href="#">Mentions légales</a>
              <a href="#">CGU</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 StageFlow - Tous droits réservés. Université Cadi Ayyad, Marrakech.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}