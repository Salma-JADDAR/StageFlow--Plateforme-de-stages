import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

// Images pour les cartes de recommandations
const baseImages = [
  '/images/do.png', '/images/do1.png', '/images/do2.png', '/images/do3.png',
  '/images/do4.png', '/images/do5.png', '/images/do6.png', '/images/do7.png',
  '/images/do8.png', '/images/do9.png', '/images/doo.png', '/images/doo1.png',
  '/images/doo2.png', '/images/doo3.png', '/images/doo4.png', '/images/doo5.png',
];

export default function RecommandationsIA() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOffre, setSelectedOffre] = useState(null);
  const [showPostulerModal, setShowPostulerModal] = useState(false);
  const [showExplicationModal, setShowExplicationModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [lettreMotivation, setLettreMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null); // ← Photo réelle de l'étudiant
  const [selectedStatus, setSelectedStatus] = useState('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    topMatch: 0,
    avgScore: 0
  });

  // ========== PAGINATION (9 cartes par page = 3×3) ==========
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // ========== NOTIFICATIONS ==========
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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

  // ========== RÉCUPÉRER LES RECOMMANDATIONS ==========
  const fetchRecommendations = async () => {
    try {
      const response = await api.get('/etudiant/recommendations');
      const data = response.data || [];
      setRecommendations(data);
      
      const topMatchCount = data.filter(r => r.score >= 80).length;
      const avgScore = data.length > 0 
        ? Math.round(data.reduce((sum, r) => sum + r.score, 0) / data.length) 
        : 0;
      
      setStats({
        total: data.length,
        topMatch: topMatchCount,
        avgScore: avgScore
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des recommandations');
    }
  };

  // ========== RÉCUPÉRER LA PHOTO DE L'ÉTUDIANT (comme dans Profile) ==========
  const fetchProfilePhoto = async () => {
    try {
      const response = await api.get('/etudiant/profile');
      const profile = response.data;
      
      // 🔥 Le backend peut renvoyer "photo" ou "photo_url"
      let photoUrl = profile.photo || profile.photo_url || null;
      
      if (photoUrl) {
        // Si l'URL est relative, ajouter le préfixe /storage/
        if (!photoUrl.startsWith('http://') && !photoUrl.startsWith('https://')) {
          photoUrl = `/storage/${photoUrl}`;
        }
        setProfilePhoto(photoUrl);
        console.log('✅ Photo chargée :', photoUrl);
      } else {
        console.log('ℹ️ Aucune photo trouvée pour cet étudiant');
        setProfilePhoto(null);
      }
    } catch (error) {
      console.error('❌ Erreur chargement photo de profil:', error);
      // Pas de photo, on affiche les initiales
      setProfilePhoto(null);
    }
  };

  // ========== USEFFECT PRINCIPAL ==========
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Charger les recommandations
        await fetchRecommendations();
        
        // Charger les notifications
        await fetchNotifications();
        
        // 🔥 CHARGER LA PHOTO DE L'ÉTUDIANT (comme dans Profile)
        await fetchProfilePhoto();
        
      } catch (error) {
        console.error('Erreur globale:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      // Si pas d'utilisateur, rediriger vers login
      navigate('/login');
    }

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user]);

  // ========== FILTRAGE ==========
  useEffect(() => {
    filterRecommendations();
  }, [selectedStatus, searchTerm, recommendations]);

  const filterRecommendations = () => {
    let filtered = [...recommendations];
    
    if (selectedStatus !== 'tous') {
      if (selectedStatus === 'top_match') {
        filtered = filtered.filter(r => r.score >= 80);
      } else if (selectedStatus === 'bon_match') {
        filtered = filtered.filter(r => r.score >= 60 && r.score < 80);
      } else if (selectedStatus === 'match_moyen') {
        filtered = filtered.filter(r => r.score >= 40 && r.score < 60);
      }
    }
    
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.offre?.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.offre?.entreprise?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.offre?.ville?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredRecommendations(filtered);
    setCurrentPage(1);
  };

  // ========== REFRESH ==========
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await api.post('/etudiant/recommendations/refresh');
      toast.success('Recommandations actualisées !');
      await fetchRecommendations();
      await fetchProfilePhoto(); // Rafraîchir aussi la photo
    } catch (error) {
      toast.error('Erreur lors de l\'actualisation');
    } finally {
      setRefreshing(false);
    }
  };

  // ========== POSTULER ==========
  const handlePostuler = async (e) => {
    e.preventDefault();
    if (!lettreMotivation.trim()) {
      toast.error('Veuillez écrire une lettre de motivation');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`/etudiant/offres/${selectedOffre.idOffre}/postuler`, { 
        lettreMotivation: lettreMotivation 
      });
      toast.success('Candidature envoyée avec succès !');
      setShowPostulerModal(false);
      setLettreMotivation('');
      setSelectedOffre(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== EXPLICATION ==========
  const handleShowExplication = (rec) => {
    setSelectedRecommendation(rec);
    setShowExplicationModal(true);
  };

  // ========== FEEDBACK ==========
  const handleFeedback = async (recommendationId, isRelevant) => {
    try {
      await api.post(`/etudiant/recommendations/${recommendationId}/feedback`, { 
        pertinent: isRelevant 
      });
      toast.success(isRelevant ? 'Merci pour votre feedback !' : 'Nous améliorerons nos recommandations');
      if (!isRelevant) {
        setRecommendations(prev => prev.filter(r => r.id !== recommendationId));
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du feedback');
    }
  };

  // ========== UTILITAIRES ==========
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent match !';
    if (score >= 60) return 'Très bonne correspondance';
    if (score >= 40) return 'Bonne correspondance';
    return 'Correspondance moyenne';
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return '🎯';
    if (score >= 60) return '👍';
    if (score >= 40) return '👌';
    return '📌';
  };

  const getImageForOffre = (id) => {
    const index = (id * 2) % baseImages.length;
    return baseImages[index];
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

  // Pagination
  const totalPages = Math.ceil(filteredRecommendations.length / itemsPerPage);
  const paginatedData = filteredRecommendations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ========== RENDU ==========
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
          <p className="mt-6 text-gray-600 font-medium">Analyse de votre profil...</p>
          <p className="text-sm text-gray-500 mt-2">Nos algorithmes cherchent les meilleures offres pour vous</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommandations-page">
      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .recommandations-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f8fafc;
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

        /* ========== LAYOUT PRINCIPAL AVEC SIDEBAR À DROITE ========== */
        .main-layout {
          display: flex;
          max-width: 1800px;
          margin: 0 auto;
          padding: 0 40px;
          gap: 48px;
          padding-top: 90px;
          flex-direction: row;
        }

        /* ========== SIDEBAR DROITE ========== */
        .sidebar-right {
          width: 420px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 28px;
          position: sticky;
          top: 100px;
          height: fit-content;
          max-height: calc(200vh - 120px);
          overflow-y: auto;
          order: 2;
        }
        .sidebar-right::-webkit-scrollbar { width: 4px; }
        .sidebar-right::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

        /* Carte Profil */
        .profile-card {
          background: white;
          border-radius: 24px;
          padding: 28px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          border: 1px solid #f0f2f5;
          transition: all 0.3s ease;
        }
        .profile-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
        }
        .profile-avatar {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          margin: 0 auto 16px;
          position: relative;
          overflow: hidden;
          border: 4px solid #ffd966;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-avatar .initials {
          font-size: 42px;
          font-weight: 800;
          color: white;
        }
        .profile-avatar .online-dot {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          background: #10b981;
          border-radius: 50%;
          border: 3px solid white;
        }
        .profile-name {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .profile-role {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 16px;
        }
        .profile-stats-mini {
          display: flex;
          justify-content: center;
          gap: 32px;
          padding-top: 16px;
          border-top: 1px solid #eef2f0;
        }
        .profile-stats-mini .stat {
          text-align: center;
        }
        .profile-stats-mini .stat .number {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
        }
        .profile-stats-mini .stat .label {
          font-size: 12px;
          color: #94a3b8;
        }

        /* Infos supplémentaires */
        .extra-info {
          background: #fef3e8;
          border-radius: 16px;
          padding: 16px 20px;
          margin-top: 8px;
        }
        .extra-info .info-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
          border-bottom: 1px solid rgba(139, 90, 43, 0.08);
        }
        .extra-info .info-item:last-child {
          border-bottom: none;
        }
        .extra-info .info-item .label {
          color: #64748b;
        }
        .extra-info .info-item .value {
          font-weight: 600;
          color: #8B5A2B;
        }

        /* Carte Conseils */
        .tips-card {
          background: white;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          border: 1px solid #f0f2f5;
        }
        .tips-card .title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #1a1a1a;
        }
        .tips-card .title i { color: #8B5A2B; }
        .tip-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 12px 14px;
          border-radius: 12px;
          transition: all 0.3s;
          cursor: default;
        }
        .tip-item:hover {
          background: #fef3e8;
        }
        .tip-item .icon {
          width: 36px;
          height: 36px;
          background: #fef3e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tip-item .icon i { font-size: 16px; color: #8B5A2B; }
        .tip-item .text h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 2px;
        }
        .tip-item .text p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.4;
        }

        /* ========== CARTES SUPPÉMENTAIRES DANS LA SIDEBAR ========== */
        .sidebar-extra-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sidebar-extra-card {
          background: white;
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid #eef2f0;
          transition: all 0.3s ease;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }
        .sidebar-extra-card:hover {
          transform: translateX(5px);
          border-color: #8B5A2B;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        }
        .sidebar-extra-card .icon {
          width: 44px;
          height: 44px;
          background: #fef3e8;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sidebar-extra-card .icon i {
          font-size: 20px;
          color: #8B5A2B;
        }
        .sidebar-extra-card .info h4 {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 2px;
        }
        .sidebar-extra-card .info p {
          font-size: 12px;
          color: #64748b;
        }
        .sidebar-extra-card .arrow {
          margin-left: auto;
          color: #8B5A2B;
          font-size: 14px;
          transition: transform 0.3s;
        }
        .sidebar-extra-card:hover .arrow {
          transform: translateX(4px);
        }

        /* Carte Filtres */
        .filters-card {
          background: white;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          border: 1px solid #f0f2f5;
        }
        .filters-card .title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #1a1a1a;
        }
        .filters-card .title i { color: #8B5A2B; }
        .filter-group {
          margin-bottom: 16px;
        }
        .filter-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 6px;
        }
        .filter-group input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          background: #fafbfc;
        }
        .filter-group input:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
          background: white;
        }
        .filter-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .filter-tag {
          padding: 6px 16px;
          background: #f1f5f9;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .filter-tag:hover {
          background: #e2e8f0;
        }
        .filter-tag.active {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border-color: #8B5A2B;
        }
        .filter-tag .count {
          background: rgba(255,255,255,0.2);
          padding: 0 6px;
          border-radius: 10px;
          font-size: 10px;
          margin-left: 4px;
        }

        /* ========== CONTENU PRINCIPAL ========== */
        .main-content {
          flex: 1;
          min-width: 0;
          order: 1;
        }

        /* HERO MINI */
        .hero-mini {
          background: linear-gradient(135deg, #1a0f0a, #2d1a0e);
          border-radius: 24px;
          padding: 32px 40px;
          margin-bottom: 32px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          border: 1px solid rgba(255, 217, 102, 0.1);
        }
        .hero-mini .text h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .hero-mini .text h1 span {
          background: linear-gradient(135deg, #ffd966, #ffb347);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-mini .text p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }
        .hero-mini .actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hero-mini .btn-refresh {
          padding: 10px 24px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 40px;
          color: white;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .hero-mini .btn-refresh:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        .hero-mini .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
        .hero-mini .btn-offres {
          padding: 10px 24px;
          background: linear-gradient(135deg, #ffd966, #ffb347);
          border: none;
          border-radius: 40px;
          color: #1a0f0a;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .hero-mini .btn-offres:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 217, 102, 0.3);
          gap: 12px;
        }

        /* ========== STATS MINI ========== */
        .stats-mini {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .stat-mini-card {
          background: white;
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid #eef2f0;
          transition: all 0.3s;
        }
        .stat-mini-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
        }
        .stat-mini-card .icon {
          width: 44px;
          height: 44px;
          background: #fef3e8;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-mini-card .icon i { font-size: 20px; color: #8B5A2B; }
        .stat-mini-card .info .number {
          font-size: 22px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.2;
        }
        .stat-mini-card .info .label {
          font-size: 12px;
          color: #64748b;
        }

        /* ========== RECOMMANDATIONS GRID (3×3 = 9 cartes) ========== */
        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .recommendation-card {
          background: transparent;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #eef2f0;
          cursor: pointer;
          position: relative;
          animation: fadeInCard 0.5s ease forwards;
          opacity: 0;
        }
        @keyframes fadeInCard {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .recommendation-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.12);
          border-color: transparent;
        }
        .card-bg {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 280px;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: flex-end;
          padding: 16px;
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
        .recommendation-card:hover .card-overlay {
          background: linear-gradient(180deg,
            rgba(0, 0, 0, 0.05) 0%,
            rgba(93, 58, 26, 0.3) 40%,
            rgba(0, 0, 0, 0.9) 100%
          );
        }
        .card-content {
          position: relative;
          z-index: 1;
          color: white;
          width: 100%;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .card-logo {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s;
        }
        .recommendation-card:hover .card-logo {
          background: rgba(255, 217, 102, 0.2);
          transform: scale(1.05);
        }
        .score-badge {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(4px);
          padding: 3px 10px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .card-title {
          font-size: 16px;
          font-weight: 700;
          margin: 4px 0 2px;
          line-height: 1.3;
          transition: color 0.2s;
        }
        .recommendation-card:hover .card-title { color: #ffd966; }
        .card-company {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
        }
        .card-company i { font-size: 11px; color: #ffd966; }
        .card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 8px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          margin-bottom: 10px;
        }
        .card-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.8);
        }
        .card-meta-item i { color: #ffd966; width: 12px; font-size: 11px; }
        .card-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .btn-postuler {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          padding: 5px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-postuler:hover {
          gap: 10px;
          box-shadow: 0 4px 12px rgba(93, 58, 26, 0.3);
          transform: scale(1.02);
        }
        .btn-explication {
          background: rgba(255, 217, 102, 0.1);
          border: 1px solid rgba(255, 217, 102, 0.15);
          color: #ffd966;
          padding: 5px 12px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .btn-explication:hover {
          background: rgba(255, 217, 102, 0.2);
          gap: 8px;
        }
        .feedback-buttons {
          display: flex;
          gap: 10px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          margin-top: 8px;
          width: 100%;
        }
        .btn-feedback {
          background: none;
          border: none;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 30px;
          transition: all 0.2s;
          color: rgba(255, 255, 255, 0.7);
        }
        .btn-feedback:hover { background: rgba(255, 255, 255, 0.1); }
        .btn-feedback.relevant { color: #10b981; }
        .btn-feedback.relevant:hover { background: rgba(16, 185, 129, 0.15); }
        .btn-feedback.not-relevant { color: #f87171; }
        .btn-feedback.not-relevant:hover { background: rgba(248, 113, 113, 0.15); }

        /* ========== PAGINATION ========== */
        .pagination {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 32px;
          margin-bottom: 40px;
        }
        .page-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          font-size: 14px;
          color: #475569;
        }
        .page-btn.active {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border-color: #8B5A2B;
        }
        .page-btn:hover:not(.active) {
          border-color: #8B5A2B;
          color: #8B5A2B;
        }
        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ========== SECTION POURQUOI ========== */
        .pourquoi-section {
          margin-top: 48px;
          padding: 32px 0;
        }
        .pourquoi-section .section-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .pourquoi-section .section-header .badge {
          display: inline-block;
          background: rgba(139, 90, 43, 0.1);
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 16px;
          border-radius: 20px;
          margin-bottom: 8px;
        }
        .pourquoi-section .section-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 6px;
        }
        .pourquoi-section .section-header p {
          color: #64748b;
          font-size: 15px;
        }
        .pourquoi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .pourquoi-card {
          background: white;
          border-radius: 20px;
          padding: 24px 20px;
          text-align: center;
          transition: all 0.3s ease;
          border: 1px solid #eef2f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }
        .pourquoi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
          border-color: #8B5A2B;
        }
        .pourquoi-card .icon {
          width: 56px;
          height: 56px;
          background: #fef3e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }
        .pourquoi-card .icon i { font-size: 24px; color: #8B5A2B; }
        .pourquoi-card h4 {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .pourquoi-card p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
        }

        /* ========== EMPTY STATE ========== */
        .empty-state {
          text-align: center;
          padding: 60px 40px;
          background: white;
          border-radius: 24px;
          border: 1px solid #eef2f0;
        }
        .empty-state .icon {
          width: 80px;
          height: 80px;
          background: #fef3e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .empty-state .icon i { font-size: 36px; color: #8B5A2B; }
        .empty-state h3 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
        .empty-state p { color: #64748b; margin-bottom: 20px; }

        /* ========== MODALS ========== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content {
          background: white;
          border-radius: 28px;
          max-width: 520px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 32px;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eef2f0;
        }
        .modal-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
        }
        .modal-header h2 i { color: #8B5A2B; margin-right: 8px; }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #94a3b8;
          transition: color 0.2s;
        }
        .modal-close:hover { color: #8B5A2B; }
        .modal-image {
          width: 100%;
          height: 180px;
          background-size: cover;
          background-position: center;
          border-radius: 16px;
          position: relative;
          margin-bottom: 16px;
        }
        .modal-image .badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 14px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }
        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 16px 0;
        }
        .modal-grid-item {
          background: #f8fafc;
          padding: 12px;
          border-radius: 12px;
          text-align: center;
        }
        .modal-grid-item i {
          font-size: 18px;
          color: #8B5A2B;
          display: block;
          margin-bottom: 4px;
        }
        .modal-grid-item .label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .modal-grid-item .value {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin-top: 2px;
        }
        .modal-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-family: inherit;
          resize: vertical;
          margin-bottom: 16px;
          font-size: 13px;
        }
        .modal-textarea:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
        }
        .modal-btn-submit {
          width: 100%;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .modal-btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(93, 58, 26, 0.3);
        }
        .modal-btn-close {
          width: 100%;
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 10px;
        }
        .modal-btn-close:hover { background: #e2e8f0; }

        /* ========== EXPLICATION SECTION ========== */
        .explication-section {
          background: #fef3e8;
          padding: 14px;
          border-radius: 12px;
          margin: 12px 0;
        }
        .explication-section strong {
          color: #8B5A2B;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .competence-match {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          border-radius: 8px;
          margin-bottom: 4px;
          font-size: 13px;
        }
        .competence-match.success {
          background: #f0fdf4;
          border: 1px solid #d1fae5;
        }
        .competence-match.warning {
          background: #fef3c7;
          border: 1px solid #fde68a;
        }
        .competence-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          margin: 2px;
        }
        .competence-tag.owned {
          background: #f0fdf4;
          color: #10b981;
          border: 1px solid #d1fae5;
        }
        .competence-tag.missing {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }
        .match-progress {
          height: 6px;
          background: #eef2f0;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 8px;
        }
        .match-progress-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.5s ease;
        }

        /* ========== FOOTER ========== */
        .footer {
          background: #1a1a1a;
          padding: 60px 32px 32px;
          margin-top: 60px;
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
        @media (max-width: 1400px) {
          .main-layout { padding: 0 24px; gap: 32px; }
        }
        @media (max-width: 1200px) {
          .sidebar-right { width: 320px; }
          .recommendations-grid { grid-template-columns: repeat(2, 1fr); }
          .pourquoi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 1100px) {
          .sidebar-right { width: 280px; }
        }
        @media (max-width: 1000px) {
          .main-layout { flex-direction: column; padding: 80px 20px 0; }
          .sidebar-right {
            width: 100%;
            position: relative;
            top: 0;
            max-height: none;
            flex-direction: row;
            flex-wrap: wrap;
            order: 0;
          }
          .sidebar-right > * { flex: 1; min-width: 250px; }
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .recommendations-grid { grid-template-columns: 1fr; }
          .pourquoi-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .hero-mini { flex-direction: column; text-align: center; padding: 24px; }
          .hero-mini .text h1 { font-size: 22px; }
          .stats-mini { grid-template-columns: 1fr; }
          .modal-grid { grid-template-columns: 1fr; }
          .modal-image { height: 140px; }
          .notification-dropdown { width: 320px; right: -50px; }
          .sidebar-right { flex-direction: column; }
          .sidebar-right > * { min-width: 100%; }
          .profile-avatar { width: 100px; height: 100px; }
          .sidebar-extra-cards { flex-direction: row; flex-wrap: wrap; }
          .sidebar-extra-card { flex: 1; min-width: 140px; }
        }
        @media (max-width: 480px) {
          .main-layout { padding: 70px 12px 0; }
          .card-bg { min-height: 240px; }
          .card-title { font-size: 15px; }
          .hero-mini .btn-refresh, .hero-mini .btn-offres { font-size: 12px; padding: 8px 16px; }
          .sidebar-extra-cards { flex-direction: column; }
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
            <Link to="/offres">Offres</Link>
            {user && <Link to={getDashboardLink()}>Tableau de bord</Link>}
            <Link to="/about">À propos</Link>
          </div>
          <div className="nav-actions">
            <div className="notification-wrapper">
              <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <span>Notifications</span>
                    {unreadCount > 0 && <button className="mark-all-read" onClick={markAllAsRead}>Tout marquer comme lu</button>}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty"><i className="fas fa-bell-slash"></i><p>Aucune notification</p></div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`notification-item ${notif.est_lu ? 'read' : 'unread'}`} onClick={() => { markAsRead(notif.id); if (notif.lien) { navigate(notif.lien); setShowNotifications(false); } }}>
                          <div className="notif-icon"><i className={notif.icone || 'fas fa-bell'}></i></div>
                          <div className="notif-content">
                            <p className="notif-title">{notif.titre}</p>
                            <p className="notif-message">{notif.message}</p>
                            <span className="notif-time">{new Date(notif.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <button className="notif-delete" onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}><i className="fas fa-times"></i></button>
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
                      <Link to="/recommandations" className="active"><i className="fas fa-robot"></i> Recommandations IA</Link>
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
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}><i className="fas fa-bars"></i></button>
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
          <Link to="/recommandations" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#8B5A2B', padding: '12px', borderRadius: '12px', background: '#fef3e8' }}>Recommandations IA</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* ========== LAYOUT PRINCIPAL AVEC SIDEBAR À DROITE ========== */}
      <div className="main-layout">
        {/* ========== CONTENU PRINCIPAL ========== */}
        <main className="main-content">
        

          {/* STATS MINI */}
          <div className="stats-mini">
            <div className="stat-mini-card">
              <div className="icon"><i className="fas fa-list"></i></div>
              <div className="info">
                <div className="number">{stats.total}</div>
                <div className="label">Recommandations</div>
              </div>
            </div>
            <div className="stat-mini-card">
              <div className="icon"><i className="fas fa-fire"></i></div>
              <div className="info">
                <div className="number">{stats.topMatch}</div>
                <div className="label">Super matchs (80%+)</div>
              </div>
            </div>
            <div className="stat-mini-card">
              <div className="icon"><i className="fas fa-chart-line"></i></div>
              <div className="info">
                <div className="number">{stats.avgScore}%</div>
                <div className="label">Score moyen de matching</div>
              </div>
            </div>
          </div>

          {/* RECOMMANDATIONS GRID (3×3 = 9 cartes) */}
          {filteredRecommendations.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><i className="fas fa-robot"></i></div>
              <h3>Aucune recommandation trouvée</h3>
              <p>
                {searchTerm || selectedStatus !== 'tous' 
                  ? "Essayez d'autres critères de recherche" 
                  : "Complétez votre profil pour recevoir des recommandations personnalisées"}
              </p>
              {!searchTerm && selectedStatus === 'tous' && (
                <Link to="/profile" className="btn-offres" style={{ display: 'inline-flex', margin: '0 auto', background: 'linear-gradient(135deg, #5D3A1A, #8B5A2B)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '40px', fontWeight: '600', textDecoration: 'none', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-user-edit"></i> Compléter mon profil
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="recommendations-grid">
                {paginatedData.map((rec, idx) => (
                  <div 
                    key={rec.id || rec.offre?.idOffre} 
                    className="recommendation-card" 
                    style={{ animationDelay: `${idx * 0.05}s` }}
                    onClick={() => handleShowExplication(rec)}
                  >
                    <div className="card-bg" style={{ backgroundImage: `url(${getImageForOffre(rec.offre?.idOffre || idx)})` }}>
                      <div className="card-overlay"></div>
                      <div className="card-content">
                        <div className="card-header">
                          <div className="card-logo">
                            {rec.offre?.entreprise?.nom?.charAt(0) || 'E'}
                          </div>
                          <div className="score-badge" style={{ backgroundColor: getScoreColor(rec.score) + '30', borderColor: getScoreColor(rec.score) + '50' }}>
                            <i className="fas fa-percent" style={{ color: getScoreColor(rec.score) }}></i>
                            <span style={{ color: getScoreColor(rec.score) }}>{rec.score}%</span>
                          </div>
                        </div>
                        <h3 className="card-title">{rec.offre?.titre || 'Offre'}</h3>
                        <div className="card-company">
                          <i className="fas fa-building"></i>
                          <span>{rec.offre?.entreprise?.nom || 'Entreprise'}</span>
                        </div>
                        <div className="card-meta">
                          <div className="card-meta-item">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{rec.offre?.ville || 'Non spécifiée'}</span>
                          </div>
                          <div className="card-meta-item">
                            <i className="fas fa-clock"></i>
                            <span>{rec.offre?.duree || '?'} mois</span>
                          </div>
                          <div className="card-meta-item">
                            <i className="fas fa-tag"></i>
                            <span>{rec.offre?.typeStage || 'Stage'}</span>
                          </div>
                        </div>
                        <div className="card-actions">
                          <button 
                            className="btn-postuler" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedOffre(rec.offre); 
                              setShowPostulerModal(true); 
                            }}
                          >
                            Postuler <i className="fas fa-arrow-right"></i>
                          </button>
                          <button 
                            className="btn-explication" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleShowExplication(rec); 
                            }}
                          >
                            <i className="fas fa-info-circle"></i> Pourquoi ?
                          </button>
                        </div>
                        <div className="feedback-buttons">
                          <button 
                            className="btn-feedback relevant" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleFeedback(rec.id, true); 
                            }}
                          >
                            <i className="fas fa-thumbs-up"></i> Pertinent
                          </button>
                          <button 
                            className="btn-feedback not-relevant" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleFeedback(rec.id, false); 
                            }}
                          >
                            <i className="fas fa-thumbs-down"></i> Non pertinent
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="page-btn" 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    ←
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    className="page-btn" 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Section Pourquoi nos recommandations */}
          <div className="pourquoi-section">
            <div className="section-header">
              <span className="badge">🎯 Pourquoi nos recommandations</span>
              <h2>Des offres sur mesure, grâce à l'IA</h2>
              <p>Notre algorithme analyse chaque détail de votre profil pour vous proposer les meilleures opportunités</p>
            </div>
            <div className="pourquoi-grid">
              <div className="pourquoi-card">
                <div className="icon"><i className="fas fa-brain"></i></div>
                <h4>Analyse intelligente</h4>
                <p>Notre IA scanne vos compétences, formations et expériences pour un matching parfait.</p>
              </div>
              <div className="pourquoi-card">
                <div className="icon"><i className="fas fa-bullseye"></i></div>
                <h4>Précision maximale</h4>
                <p>Chaque recommandation est calculée avec un score de pertinence pour vous guider.</p>
              </div>
              <div className="pourquoi-card">
                <div className="icon"><i className="fas fa-sync-alt"></i></div>
                <h4>Mises à jour en temps réel</h4>
                <p>Les recommandations s'actualisent automatiquement lorsque vous enrichissez votre profil.</p>
              </div>
              <div className="pourquoi-card">
                <div className="icon"><i className="fas fa-heart"></i></div>
                <h4>Apprentissage continu</h4>
                <p>Vos retours (pertinent / non pertinent) améliorent la qualité des futures recommandations.</p>
              </div>
            </div>
          </div>
        </main>

        {/* ========== SIDEBAR DROITE ========== */}
        <aside className="sidebar-right">
          {/* Profil - AVEC LA VRAIE PHOTO DE L'ÉTUDIANT */}
          <div className="profile-card">
            <div className="profile-avatar">
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="Photo de profil" 
                  onError={(e) => { 
                    e.target.src = '/images/default-avatar.png';
                    console.error('❌ Erreur chargement image:', profilePhoto);
                  }} 
                />
              ) : (
                <span className="initials">{user?.prenom?.[0]}{user?.nom?.[0]}</span>
              )}
              <div className="online-dot"></div>
            </div>
            <div className="profile-name">{user?.prenom} {user?.nom}</div>
            <div className="profile-role">🎓 Étudiant · StageFlow</div>
            <div className="profile-stats-mini">
              <div className="stat">
                <div className="number">{stats.total}</div>
                <div className="label">Recommandations</div>
              </div>
              <div className="stat">
                <div className="number">{stats.topMatch}</div>
                <div className="label">Super matchs</div>
              </div>
              <div className="stat">
                <div className="number">{stats.avgScore}%</div>
                <div className="label">Score moyen</div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="filters-card">
            <div className="title"><i className="fas fa-sliders-h"></i> Filtres</div>
            <div className="filter-group">
              <label>Rechercher</label>
              <input 
                type="text" 
                placeholder="Titre, entreprise, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Score de matching</label>
              <div className="filter-tags">
                <div className={`filter-tag ${selectedStatus === 'tous' ? 'active' : ''}`} onClick={() => setSelectedStatus('tous')}>
                  Tous <span className="count">{stats.total}</span>
                </div>
                <div className={`filter-tag ${selectedStatus === 'top_match' ? 'active' : ''}`} onClick={() => setSelectedStatus('top_match')}>
                  🔥 80%+ <span className="count">{stats.topMatch}</span>
                </div>
                <div className={`filter-tag ${selectedStatus === 'bon_match' ? 'active' : ''}`} onClick={() => setSelectedStatus('bon_match')}>
                  ⭐ 60-80%
                </div>
                <div className={`filter-tag ${selectedStatus === 'match_moyen' ? 'active' : ''}`} onClick={() => setSelectedStatus('match_moyen')}>
                  📈 40-60%
                </div>
              </div>
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{ fontSize: '12px', color: '#8B5A2B', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}
              >
                <i className="fas fa-times"></i> Effacer la recherche
              </button>
            )}
          </div>

          {/* Conseils */}
          <div className="tips-card">
            <div className="title"><i className="fas fa-lightbulb"></i> Conseils</div>
            <div className="tip-item">
              <div className="icon"><i className="fas fa-user-edit"></i></div>
              <div className="text">
                <h4>Complétez votre profil</h4>
                <p>Plus vous avez de compétences, plus les recommandations sont précises.</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="icon"><i className="fas fa-thumbs-up"></i></div>
              <div className="text">
                <h4>Donnez votre avis</h4>
                <p>Vos retours (pertinent / non pertinent) améliorent nos algorithmes.</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="icon"><i className="fas fa-sync-alt"></i></div>
              <div className="text">
                <h4>Actualisez régulièrement</h4>
                <p>Les recommandations s'actualisent en fonction des nouvelles offres.</p>
              </div>
            </div>
            <div className="extra-info">
              <div className="info-item">
                <span className="label">Profil complété</span>
                <span className="value">85%</span>
              </div>
              <div className="info-item">
                <span className="label">Compétences renseignées</span>
                <span className="value">8</span>
              </div>
              <div className="info-item">
                <span className="label">Formations ajoutées</span>
                <span className="value">3</span>
              </div>
            </div>
          </div>

          {/* Cartes supplémentaires */}
          <div className="sidebar-extra-cards">
            <div className="sidebar-extra-card" onClick={() => navigate('/offres')}>
              <div className="icon"><i className="fas fa-fire"></i></div>
              <div className="info">
                <h4>Stages populaires</h4>
                <p>Les offres les plus consultées</p>
              </div>
              <div className="arrow"><i className="fas fa-arrow-right"></i></div>
            </div>
            <div className="sidebar-extra-card" onClick={() => navigate('/offres?keyword=nouveau')}>
              <div className="icon"><i className="fas fa-star"></i></div>
              <div className="info">
                <h4>Nouveautés</h4>
                <p>Les dernières offres publiées</p>
              </div>
              <div className="arrow"><i className="fas fa-arrow-right"></i></div>
            </div>
            <div className="sidebar-extra-card" onClick={() => navigate('/offres?type=PFE')}>
              <div className="icon"><i className="fas fa-graduation-cap"></i></div>
              <div className="info">
                <h4>Recommandés</h4>
                <p>Les offres les mieux notées</p>
              </div>
              <div className="arrow"><i className="fas fa-arrow-right"></i></div>
            </div>
          </div>
        </aside>
      </div>

      {/* ========== MODAL POSTULER ========== */}
      {showPostulerModal && selectedOffre && (
        <div className="modal-overlay" onClick={() => { setShowPostulerModal(false); setLettreMotivation(''); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-paper-plane"></i> Nouvelle candidature</h2>
              <button className="modal-close" onClick={() => { setShowPostulerModal(false); setLettreMotivation(''); }}>&times;</button>
            </div>
            <div className="modal-image" style={{ backgroundImage: `url(${getImageForOffre(selectedOffre.idOffre)})` }}>
              <div className="badge" style={{ background: '#8B5A2B' }}>
                <i className="fas fa-paper-plane"></i> Candidature
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{selectedOffre.titre}</h3>
            <p style={{ color: '#64748b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-building" style={{ color: '#8B5A2B' }}></i> {selectedOffre.entreprise?.nom || 'Entreprise'}
            </p>
            <div className="modal-grid">
              <div className="modal-grid-item">
                <i className="fas fa-map-marker-alt"></i>
                <div className="label">Ville</div>
                <div className="value">{selectedOffre.ville || 'Non spécifiée'}</div>
              </div>
              <div className="modal-grid-item">
                <i className="fas fa-clock"></i>
                <div className="label">Durée</div>
                <div className="value">{selectedOffre.duree || '?'} mois</div>
              </div>
              <div className="modal-grid-item">
                <i className="fas fa-tag"></i>
                <div className="label">Type</div>
                <div className="value">{selectedOffre.typeStage || 'Stage'}</div>
              </div>
              <div className="modal-grid-item">
                <i className="fas fa-calendar-alt"></i>
                <div className="label">Date limite</div>
                <div className="value">{new Date(selectedOffre.dateLimite).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
            <textarea
              className="modal-textarea"
              rows="5"
              placeholder="Exprimez votre motivation, vos compétences et pourquoi vous êtes le candidat idéal..."
              value={lettreMotivation}
              onChange={(e) => setLettreMotivation(e.target.value)}
            />
            <button className="modal-btn-submit" onClick={handlePostuler} disabled={submitting}>
              {submitting ? <><i className="fas fa-spinner fa-spin"></i> Envoi en cours...</> : <><i className="fas fa-paper-plane"></i> Envoyer ma candidature</>}
            </button>
            <button className="modal-btn-close" onClick={() => { setShowPostulerModal(false); setLettreMotivation(''); }}>Annuler</button>
          </div>
        </div>
      )}

      {/* ========== MODAL EXPLICATION ========== */}
      {showExplicationModal && selectedRecommendation && (
        <div className="modal-overlay" onClick={() => setShowExplicationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-info-circle"></i> Pourquoi cette offre ?</h2>
              <button className="modal-close" onClick={() => setShowExplicationModal(false)}>&times;</button>
            </div>
            <div className="modal-image" style={{ backgroundImage: `url(${getImageForOffre(selectedRecommendation.offre?.idOffre)})` }}>
              <div className="badge" style={{ background: getScoreColor(selectedRecommendation.score) }}>
                <i className="fas fa-chart-line"></i> Score: {selectedRecommendation.score}%
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{selectedRecommendation.offre?.titre}</h3>
            <p style={{ color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-building" style={{ color: '#8B5A2B' }}></i> {selectedRecommendation.offre?.entreprise?.nom || 'Entreprise'}
            </p>

            <div className="explication-section">
              <strong><i className="fas fa-chart-line"></i> Score de matching</strong>
              <p style={{ fontSize: '32px', fontWeight: '800', color: getScoreColor(selectedRecommendation.score), marginTop: '4px' }}>
                {selectedRecommendation.score}%
              </p>
              <p>{getScoreLabel(selectedRecommendation.score)} {getScoreEmoji(selectedRecommendation.score)}</p>
              <div className="match-progress">
                <div className="match-progress-fill" style={{ width: `${selectedRecommendation.score}%`, background: getScoreColor(selectedRecommendation.score) }}></div>
              </div>
            </div>

            <div className="explication-section">
              <strong><i className="fas fa-check-circle" style={{ color: '#10b981' }}></i> Compétences que vous possédez</strong>
              {selectedRecommendation.matching_competences && selectedRecommendation.matching_competences.length > 0 ? (
                selectedRecommendation.matching_competences.map((comp, idx) => (
                  <div key={idx} className="competence-match success">
                    <span>{comp.nom}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#10b981' }}>✓ {comp.niveau_etudiant}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontStyle: 'italic' }}>Aucune compétence matching trouvée</p>
              )}
            </div>

            <div className="explication-section">
              <strong><i className="fas fa-graduation-cap" style={{ color: '#f59e0b' }}></i> Compétences à développer</strong>
              {selectedRecommendation.missing_competences && selectedRecommendation.missing_competences.length > 0 ? (
                selectedRecommendation.missing_competences.map((comp, idx) => (
                  <div key={idx} className="competence-match warning">
                    <span>{comp.nom}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#92400e' }}>À acquérir</span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontStyle: 'italic' }}>Vous avez toutes les compétences requises ! 🎉</p>
              )}
            </div>

            <button className="modal-btn-close" onClick={() => setShowExplicationModal(false)}>
              <i className="fas fa-times"></i> Fermer
            </button>
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
              <Link to="/recommandations">Recommandations IA</Link>
              <Link to="/formations">Mes formations</Link>
              <Link to="/competences">Mes compétences</Link>
              <Link to="/mon-cv">Mon CV</Link>
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