import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function MonCV() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cvInfo, setCvInfo] = useState({
    id: null,
    nomFichier: '',
    cheminFichier: '',
    taille: 0,
    dateUpload: null
  });
  const [hasCv, setHasCv] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [stats, setStats] = useState({
    totalCandidatures: 0,
    acceptees: 0,
    enAttente: 0
  });

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

  // ========== CHARGEMENT DES DONNÉES ==========
  useEffect(() => {
    fetchCV();
    fetchUserProfile();
    fetchStats();
    fetchNotifications();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchCV = async () => {
    try {
      setLoading(true);
      const response = await api.get('/etudiant/cv-info');
      
      if (response.data && response.data.id) {
        setCvInfo({
          id: response.data.id,
          nomFichier: response.data.nomFichier || 'CV.pdf',
          cheminFichier: response.data.cheminFichier || '',
          taille: response.data.taille || 0,
          dateUpload: response.data.dateUpload || response.data.created_at,
          updated_at: response.data.updated_at
        });
        setHasCv(true);
      } else {
        setHasCv(false);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setHasCv(false);
      } else {
        toast.error('Erreur lors du chargement du CV');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/etudiant/profile');
      if (response.data) {
        if (response.data.photo) {
          setUserPhoto(response.data.photo);
        } else if (response.data.photo_url) {
          setUserPhoto(response.data.photo_url);
        }
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const candidaturesRes = await api.get('/etudiant/mes-candidatures');
      let candidatures = Array.isArray(candidaturesRes.data) ? candidaturesRes.data : [];
      const acceptees = candidatures.filter(c => c.statut === 'acceptée').length;
      const enAttente = candidatures.filter(c => c.statut === 'en_attente').length;
      setStats({
        totalCandidatures: candidatures.length,
        acceptees,
        enAttente
      });
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  // ========== GESTION DU FICHIER ==========
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez PDF, DOC ou DOCX');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux. Taille max: 5MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('cv', selectedFile);

    try {
      await api.post('/etudiant/cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('CV téléchargé avec succès !');
      setSelectedFile(null);
      await fetchCV();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get('/etudiant/cv');
      
      if (response.data && response.data.url) {
        window.open(response.data.url, '_blank');
        toast.success('CV ouvert dans un nouvel onglet');
      } else {
        toast.error('URL du CV non trouvée');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ouverture du CV');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer votre CV ?')) return;
    
    try {
      await api.delete('/etudiant/cv');
      toast.success('CV supprimé avec succès');
      setHasCv(false);
      setCvInfo({
        id: null,
        nomFichier: '',
        cheminFichier: '',
        taille: 0,
        dateUpload: null
      });
      await fetchCV();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ========== UTILITAIRES ==========
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

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date) => {
    if (!date) return 'Non disponible';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPhotoUrl = () => {
    if (!userPhoto) return null;
    if (userPhoto.startsWith('http') || userPhoto.startsWith('/storage')) {
      return userPhoto;
    }
    return `/storage/${userPhoto}`;
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
          <p className="mt-6 text-gray-600 font-medium">Chargement de votre CV...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mon-cv-page">
      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .mon-cv-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
          color: #1a1a1a;
          overflow-x: hidden;
          width: 100%;
          min-height: 100vh;
        }

        /* ========== NAVBAR AVEC NOTIFICATIONS ========== */
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
        .nav-actions { display: flex; align-items: center; gap: 16px; }
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

        /* ========== CONTAINER PRINCIPAL ========== */
        .main-container {
          max-width: 1800px;
          margin: 0 auto;
          padding: 100px 32px 60px;
        }

        /* ========== HEADER AVEC PHOTO ========== */
        .page-header {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 40px;
          padding: 28px 36px;
          background: white;
          border-radius: 28px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.04);
          flex-wrap: wrap;
        }

        .page-header .header-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 3px solid #ffd966;
          flex-shrink: 0;
        }

        .page-header .header-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .page-header .header-avatar .initials {
          font-size: 34px;
          font-weight: 800;
          color: white;
        }

        .page-header .header-info h1 {
          font-size: 30px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .page-header .header-info h1 span {
          color: #8B5A2B;
        }

        .page-header .header-info p {
          color: #64748b;
          font-size: 15px;
        }

        .page-header .header-status {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 600;
        }

        .status-badge.present {
          background: #f0fdf4;
          color: #10b981;
          border: 1px solid #d1fae5;
        }

        .status-badge.absent {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .stats-mini-header {
          display: flex;
          gap: 24px;
        }

        .stats-mini-header .stat-item {
          text-align: center;
          padding: 4px 16px;
          border-left: 2px solid #eef2f0;
        }

        .stats-mini-header .stat-item:first-child {
          border-left: none;
        }

        .stats-mini-header .stat-item .number {
          font-size: 20px;
          font-weight: 800;
          color: #8B5A2B;
        }

        .stats-mini-header .stat-item .label {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* ========== 3 GRANDES CARTES ========== */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin-bottom: 30px;
        }

        .big-card {
          background: white;
          border-radius: 28px;
          padding: 32px 28px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          min-height: 580px;
          position: relative;
          overflow: hidden;
        }

        .big-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #5D3A1A, #8B5A2B, #ffd966);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .big-card:hover::before {
          opacity: 1;
        }

        .big-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.08);
        }

        .big-card .card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f0f2f5;
        }

        .big-card .card-header .icon-box {
          width: 60px;
          height: 60px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .big-card .card-header .icon-box.cv-icon { background: linear-gradient(135deg, #5D3A1A, #8B5A2B); }
        .big-card .card-header .icon-box.conseils-icon { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .big-card .card-header .icon-box.outils-icon { background: linear-gradient(135deg, #10b981, #059669); }

        .big-card .card-header .header-text h3 {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .big-card .card-header .header-text p {
          font-size: 13px;
          color: #64748b;
          margin: 2px 0 0 0;
        }

        .big-card .card-body {
          flex: 1;
        }

        /* ========== CARTE 1 - CV AVEC STATS ========== */
        .cv-grid-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 20px;
        }

        .cv-info-block {
          background: #f8fafc;
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid #eef2f0;
          transition: all 0.3s ease;
        }

        .cv-info-block:hover {
          background: #fef3e8;
          border-color: #8B5A2B;
          transform: translateY(-3px);
          box-shadow: 0 4px 15px rgba(139, 90, 43, 0.08);
        }

        .cv-info-block .block-label {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cv-info-block .block-label i {
          color: #8B5A2B;
          font-size: 12px;
        }

        .cv-info-block .block-value {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
          margin-top: 6px;
          word-break: break-all;
        }

        .cv-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
          padding: 16px;
          background: linear-gradient(135deg, #fef3e8, #fdf0e0);
          border-radius: 16px;
          border: 1px solid #f0e0d0;
        }

        .cv-stat-item {
          text-align: center;
        }

        .cv-stat-item .stat-number {
          font-size: 22px;
          font-weight: 800;
          color: #8B5A2B;
        }

        .cv-stat-item .stat-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        .cv-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-cv-action {
          padding: 14px 20px;
          border-radius: 14px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: none;
        }

        .btn-cv-action:hover {
          transform: translateY(-3px);
        }

        .btn-cv-action.primary {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          box-shadow: 0 4px 15px rgba(139, 90, 43, 0.2);
        }

        .btn-cv-action.primary:hover {
          box-shadow: 0 8px 25px rgba(93, 58, 26, 0.3);
        }

        .btn-cv-action.outline {
          background: transparent;
          border: 2px solid #8B5A2B;
          color: #8B5A2B;
        }

        .btn-cv-action.outline:hover {
          background: #8B5A2B;
          color: white;
        }

        .btn-cv-action.danger {
          background: #fee2e2;
          color: #dc2626;
        }

        .btn-cv-action.danger:hover {
          background: #dc2626;
          color: white;
          box-shadow: 0 8px 25px rgba(220, 38, 38, 0.2);
        }

        .btn-cv-action.full {
          grid-column: 1 / -1;
        }

        .btn-cv-action:disabled {
          opacity: 0.6;
          transform: none !important;
        }

        .upload-area-mini {
          border: 2px dashed #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          text-align: center;
          background: #fafbfc;
          transition: all 0.3s ease;
          margin-top: 16px;
        }

        .upload-area-mini:hover {
          border-color: #8B5A2B;
          background: #fef3e8;
        }

        .upload-area-mini .file-info {
          margin-top: 12px;
          padding: 12px 18px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
        }

        .upload-area-mini .file-info i { color: #8B5A2B; font-size: 20px; }

        .upload-area-mini .upload-actions {
          margin-top: 14px;
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .empty-cv {
          text-align: center;
          padding: 30px 20px;
        }

        .empty-cv .empty-icon {
          width: 90px;
          height: 90px;
          background: #fef3e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .empty-cv .empty-icon i {
          font-size: 40px;
          color: #8B5A2B;
        }

        .empty-cv h4 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #1a1a1a;
        }

        .empty-cv p {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 16px;
        }

        /* ========== CARTE 2 - CONSEILS ========== */
        .conseils-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .conseil-item {
          display: flex;
          gap: 16px;
          padding: 16px 18px;
          background: #f8fafc;
          border-radius: 14px;
          border: 1px solid #eef2f0;
          transition: all 0.3s ease;
          align-items: center;
        }

        .conseil-item:hover {
          background: #eff6ff;
          border-color: #3b82f6;
          transform: translateX(8px);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
        }

        .conseil-item .conseil-image {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
        }

        .conseil-item .conseil-image.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .conseil-item .conseil-image.green { background: linear-gradient(135deg, #10b981, #059669); }
        .conseil-item .conseil-image.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .conseil-item .conseil-image.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
        .conseil-item .conseil-image.red { background: linear-gradient(135deg, #ef4444, #dc2626); }

        .conseil-item .conseil-text {
          flex: 1;
        }

        .conseil-item .conseil-text h4 {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 3px 0;
        }

        .conseil-item .conseil-text p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .conseil-item .conseil-badge {
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .conseil-item .conseil-badge.essentiel { background: #dbeafe; color: #2563eb; }
        .conseil-item .conseil-badge.important { background: #fef3c7; color: #92400e; }
        .conseil-item .conseil-badge.astuce { background: #fce4ec; color: #dc2626; }
        .conseil-item .conseil-badge.recommande { background: #e0f2fe; color: #2563eb; }
        .conseil-item .conseil-badge.afaire { background: #f0fdf4; color: #10b981; }

        /* ========== CARTE 3 - OUTILS ========== */
        .outils-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .outil-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid #eef2f0;
          text-decoration: none;
          color: #1a1a1a;
          transition: all 0.3s ease;
          text-align: center;
          gap: 10px;
          min-height: 130px;
          position: relative;
          overflow: hidden;
        }

        .outil-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #5D3A1A, #8B5A2B);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .outil-link:hover::after {
          transform: scaleX(1);
        }

        .outil-link:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
          border-color: #8B5A2B;
          background: #fef3e8;
        }

        .outil-link .outil-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .outil-link .outil-icon.green { background: linear-gradient(135deg, #10b981, #059669); }
        .outil-link .outil-icon.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .outil-link .outil-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .outil-link .outil-icon.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
        .outil-link .outil-icon.red { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .outil-link .outil-icon.teal { background: linear-gradient(135deg, #14b8a6, #0d9488); }

        .outil-link .outil-label {
          font-size: 15px;
          font-weight: 700;
        }

        .outil-link .outil-desc {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.4;
        }

        .outil-link .outil-arrow {
          font-size: 12px;
          color: #8B5A2B;
          transition: transform 0.3s ease;
        }

        .outil-link:hover .outil-arrow {
          transform: translateX(4px);
        }

        /* ========== CARTE HORIZONTALE ========== */
        .horizontal-card {
          background: white;
          border-radius: 28px;
          padding: 32px 36px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          margin-top: 0;
          position: relative;
          overflow: hidden;
        }

        .horizontal-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #ffd966, #8B5A2B, #5D3A1A);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .horizontal-card:hover::before {
          opacity: 1;
        }

        .horizontal-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.06);
        }

        .horizontal-card .card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f0f2f5;
        }

        .horizontal-card .card-header .icon-box {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
          flex-shrink: 0;
          background: linear-gradient(135deg, #8B5A2B, #5D3A1A);
          box-shadow: 0 8px 20px rgba(139, 90, 43, 0.2);
        }

        .horizontal-card .card-header .header-text h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .horizontal-card .card-header .header-text p {
          font-size: 13px;
          color: #64748b;
          margin: 2px 0 0 0;
        }

        .horizontal-card .card-body {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .horizontal-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px 16px;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid #eef2f0;
          transition: all 0.3s ease;
        }

        .horizontal-item:hover {
          transform: translateY(-4px);
          background: #fef3e8;
          border-color: #8B5A2B;
          box-shadow: 0 8px 20px rgba(139, 90, 43, 0.08);
        }

        .horizontal-item .item-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          margin-bottom: 10px;
        }

        .horizontal-item .item-icon.gold { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .horizontal-item .item-icon.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .horizontal-item .item-icon.green { background: linear-gradient(135deg, #10b981, #059669); }
        .horizontal-item .item-icon.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

        .horizontal-item .item-title {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .horizontal-item .item-desc {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
        }

        .horizontal-item .item-value {
          font-size: 22px;
          font-weight: 800;
          color: #8B5A2B;
          margin-top: 6px;
        }

        .horizontal-item .item-progress {
          width: 100%;
          height: 6px;
          background: #eef2f0;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 8px;
        }

        .horizontal-item .item-progress .progress-fill {
          height: 100%;
          border-radius: 10px;
          background: linear-gradient(90deg, #5D3A1A, #8B5A2B);
          transition: width 1.5s ease;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 1200px) {
          .cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .horizontal-card .card-body {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .page-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .page-header .header-status {
            margin-left: 0;
          }
          .stats-mini-header {
            width: 100%;
            justify-content: center;
          }
          .stats-mini-header .stat-item {
            border-left: none;
            border-right: 2px solid #eef2f0;
          }
          .stats-mini-header .stat-item:last-child {
            border-right: none;
          }
        }

        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
          .main-container {
            padding: 90px 16px 40px;
          }
          .big-card {
            padding: 24px 20px;
            min-height: auto;
          }
          .cv-grid-info {
            grid-template-columns: 1fr;
          }
          .cv-actions-grid {
            grid-template-columns: 1fr;
          }
          .btn-cv-action.full {
            grid-column: 1;
          }
          .outils-grid {
            grid-template-columns: 1fr 1fr;
          }
          .page-header {
            padding: 20px;
          }
          .page-header .header-info h1 {
            font-size: 22px;
          }
          .stats-mini-header {
            gap: 8px;
            flex-wrap: wrap;
          }
          .stats-mini-header .stat-item {
            border: none;
            padding: 4px 8px;
          }
          .cv-stats-row {
            grid-template-columns: 1fr 1fr;
          }
          .horizontal-card {
            padding: 20px;
          }
          .horizontal-card .card-body {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .horizontal-item {
            padding: 16px 12px;
          }
        }

        @media (max-width: 480px) {
          .outils-grid {
            grid-template-columns: 1fr;
          }
          .conseil-item {
            flex-direction: column;
            align-items: flex-start;
          }
          .page-header .header-avatar {
            width: 60px;
            height: 60px;
          }
          .page-header .header-avatar .initials {
            font-size: 24px;
          }
          .cv-stats-row {
            grid-template-columns: 1fr;
          }
          .horizontal-card .card-body {
            grid-template-columns: 1fr;
          }
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

        @media (max-width: 1000px) {
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
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
                  <div className="user-avatar-nav">
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
                      <Link to="/mon-cv" className="active"><i className="fas fa-file-pdf"></i> Mon CV</Link>
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
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Accueil</Link>
          <Link to="/offres" onClick={() => setMobileMenuOpen(false)}>Offres</Link>
          <Link to="/mon-cv" onClick={() => setMobileMenuOpen(false)}>Mon CV</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* ========== CONTENU PRINCIPAL ========== */}
      <div className="main-container">
        {/* Header avec photo et infos */}
        <div className="page-header">
          <div className="header-avatar">
            {getPhotoUrl() ? (
              <img src={getPhotoUrl()} alt="Photo" onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const parent = e.target.parentElement;
                parent.innerHTML = `<span class="initials">${user?.prenom?.charAt(0) || ''}${user?.nom?.charAt(0) || ''}</span>`;
              }} />
            ) : (
              <span className="initials">{user?.prenom?.charAt(0) || ''}{user?.nom?.charAt(0) || ''}</span>
            )}
          </div>
          <div className="header-info">
            <h1>Mon <span>CV</span></h1>
            <p>Gérez votre curriculum vitae en toute simplicité</p>
          </div>
          <div className="header-status">
            {hasCv ? (
              <span className="status-badge present">
                <i className="fas fa-check-circle"></i> CV présent
              </span>
            ) : (
              <span className="status-badge absent">
                <i className="fas fa-exclamation-circle"></i> Aucun CV
              </span>
            )}
          </div>
          <div className="stats-mini-header">
            <div className="stat-item">
              <div className="number">{stats.totalCandidatures}</div>
              <div className="label">Candidatures</div>
            </div>
            <div className="stat-item">
              <div className="number">{stats.acceptees}</div>
              <div className="label">Acceptées</div>
            </div>
            <div className="stat-item">
              <div className="number">{stats.enAttente}</div>
              <div className="label">En attente</div>
            </div>
          </div>
        </div>

        {/* 3 Grandes Cartes */}
        <div className="cards-grid">
          {/* ========== CARTE 1 : MON CV ========== */}
          <div className="big-card">
            <div className="card-header">
              <div className="icon-box cv-icon"><i className="fas fa-file-pdf"></i></div>
              <div className="header-text">
                <h3>Mon CV</h3>
                <p>Informations et gestion du document</p>
              </div>
            </div>
            <div className="card-body">
              {hasCv ? (
                <>
                  <div className="cv-grid-info">
                    <div className="cv-info-block">
                      <div className="block-label"><i className="fas fa-file"></i> Nom du fichier</div>
                      <div className="block-value">{cvInfo.nomFichier || 'CV.pdf'}</div>
                    </div>
                    <div className="cv-info-block">
                      <div className="block-label"><i className="fas fa-weight-hanging"></i> Taille</div>
                      <div className="block-value">{formatFileSize(cvInfo.taille || 0)}</div>
                    </div>
                    <div className="cv-info-block">
                      <div className="block-label"><i className="fas fa-calendar-alt"></i> Date d'upload</div>
                      <div className="block-value">{formatDate(cvInfo.dateUpload || cvInfo.updated_at)}</div>
                    </div>
                    <div className="cv-info-block">
                      <div className="block-label"><i className="fas fa-tag"></i> Format</div>
                      <div className="block-value">{cvInfo.nomFichier?.split('.').pop()?.toUpperCase() || 'PDF'}</div>
                    </div>
                  </div>

                  <div className="cv-stats-row">
                    <div className="cv-stat-item">
                      <div className="stat-number">1</div>
                      <div className="stat-label">Version</div>
                    </div>
                    <div className="cv-stat-item">
                      <div className="stat-number">100%</div>
                      <div className="stat-label">Complétude</div>
                    </div>
                    <div className="cv-stat-item">
                      <div className="stat-number">✅</div>
                      <div className="stat-label">Validé</div>
                    </div>
                  </div>

                  <div className="cv-actions-grid">
                    <button className="btn-cv-action primary" onClick={handleDownload}>
                      <i className="fas fa-eye"></i> Visualiser
                    </button>
                    <label className="btn-cv-action outline" style={{ cursor: 'pointer' }}>
                      <i className="fas fa-upload"></i> Changer
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                    <button className="btn-cv-action danger full" onClick={handleDelete}>
                      <i className="fas fa-trash-alt"></i> Supprimer définitivement
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-cv">
                  <div className="empty-icon"><i className="fas fa-file-pdf"></i></div>
                  <h4>Aucun CV trouvé</h4>
                  <p>Vous n'avez pas encore téléchargé de CV.</p>
                  <label className="btn-cv-action primary" style={{ cursor: 'pointer', display: 'inline-flex', padding: '14px 32px' }}>
                    <i className="fas fa-upload"></i> Télécharger mon CV
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>
              )}

              {selectedFile && (
                <div className="upload-area-mini">
                  <div className="file-info">
                    <i className="fas fa-file-pdf"></i>
                    <span><strong>{selectedFile.name}</strong> ({formatFileSize(selectedFile.size)})</span>
                  </div>
                  <div className="upload-actions">
                    <button className="btn-cv-action primary" onClick={handleUpload} disabled={uploading} style={{ padding: '10px 28px' }}>
                      {uploading ? <><i className="fas fa-spinner fa-spin"></i> Envoi...</> : <><i className="fas fa-check"></i> Envoyer</>}
                    </button>
                    <button className="btn-cv-action outline" onClick={() => { setSelectedFile(null); }} style={{ padding: '10px 28px' }}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========== CARTE 2 : CONSEILS ========== */}
          <div className="big-card">
            <div className="card-header">
              <div className="icon-box conseils-icon"><i className="fas fa-lightbulb"></i></div>
              <div className="header-text">
                <h3>Conseils CV</h3>
                <p>Améliorez votre curriculum vitae</p>
              </div>
            </div>
            <div className="card-body">
              <div className="conseils-list">
                <div className="conseil-item">
                  <div className="conseil-image blue"><i className="fas fa-file-pdf"></i></div>
                  <div className="conseil-text">
                    <h4>Format PDF</h4>
                    <p>Utilisez toujours le format PDF pour préserver la mise en page de votre CV sur tous les appareils.</p>
                  </div>
                  <span className="conseil-badge essentiel">Essentiel</span>
                </div>

                <div className="conseil-item">
                  <div className="conseil-image green"><i className="fas fa-compress-alt"></i></div>
                  <div className="conseil-text">
                    <h4>Moins de 2 pages</h4>
                    <p>Un CV concis et impactant est plus efficace. Allez à l'essentiel et mettez en avant vos compétences clés.</p>
                  </div>
                  <span className="conseil-badge important">Important</span>
                </div>

                <div className="conseil-item">
                  <div className="conseil-image orange"><i className="fas fa-key"></i></div>
                  <div className="conseil-text">
                    <h4>Mots-clés adaptés</h4>
                    <p>Utilisez des mots-clés spécifiques à votre domaine pour passer les filtres des systèmes ATS.</p>
                  </div>
                  <span className="conseil-badge astuce">Astuce</span>
                </div>

                <div className="conseil-item">
                  <div className="conseil-image purple"><i className="fas fa-camera"></i></div>
                  <div className="conseil-text">
                    <h4>Photo professionnelle</h4>
                    <p>Ajoutez une photo de profil professionnelle, sobre et de bonne qualité pour faire bonne impression.</p>
                  </div>
                  <span className="conseil-badge recommande">Recommandé</span>
                </div>

                <div className="conseil-item">
                  <div className="conseil-image red"><i className="fas fa-sync-alt"></i></div>
                  <div className="conseil-text">
                    <h4>Mettez à jour régulièrement</h4>
                    <p>Actualisez votre CV à chaque nouvelle compétence, expérience ou projet pour rester toujours à jour.</p>
                  </div>
                  <span className="conseil-badge afaire">À faire</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========== CARTE 3 : OUTILS ========== */}
          <div className="big-card">
            <div className="card-header">
              <div className="icon-box outils-icon"><i className="fas fa-tools"></i></div>
              <div className="header-text">
                <h3>Outils & Liens</h3>
                <p>Ressources pour votre carrière</p>
              </div>
            </div>
            <div className="card-body">
              <div className="outils-grid">
                <Link to="/profile" className="outil-link">
                  <div className="outil-icon green"><i className="fas fa-user"></i></div>
                  <span className="outil-label">Mon profil</span>
                  <span className="outil-desc">Complétez vos informations</span>
                  <span className="outil-arrow"><i className="fas fa-arrow-right"></i></span>
                </Link>

                <Link to="/formations" className="outil-link">
                  <div className="outil-icon blue"><i className="fas fa-graduation-cap"></i></div>
                  <span className="outil-label">Formations</span>
                  <span className="outil-desc">Ajoutez vos diplômes</span>
                  <span className="outil-arrow"><i className="fas fa-arrow-right"></i></span>
                </Link>

                <Link to="/competences" className="outil-link">
                  <div className="outil-icon orange"><i className="fas fa-code"></i></div>
                  <span className="outil-label">Compétences</span>
                  <span className="outil-desc">Listez vos savoir-faire</span>
                  <span className="outil-arrow"><i className="fas fa-arrow-right"></i></span>
                </Link>

                <a href="https://www.canva.com/fr_fr/creer/cv/" target="_blank" rel="noopener noreferrer" className="outil-link">
                  <div className="outil-icon purple"><i className="fas fa-paint-brush"></i></div>
                  <span className="outil-label">Créer un CV</span>
                  <span className="outil-desc">Modèles Canva gratuits</span>
                  <span className="outil-arrow"><i className="fas fa-external-link-alt"></i></span>
                </a>

                <Link to="/mes-candidatures" className="outil-link">
                  <div className="outil-icon red"><i className="fas fa-file-alt"></i></div>
                  <span className="outil-label">Candidatures</span>
                  <span className="outil-desc">Suivez vos candidatures</span>
                  <span className="outil-arrow"><i className="fas fa-arrow-right"></i></span>
                </Link>

                <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="outil-link">
                  <div className="outil-icon teal"><i className="fab fa-linkedin"></i></div>
                  <span className="outil-label">LinkedIn</span>
                  <span className="outil-desc">Réseau professionnel</span>
                  <span className="outil-arrow"><i className="fas fa-external-link-alt"></i></span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ========== CARTE HORIZONTALE ========== */}
        <div className="horizontal-card">
          <div className="card-header">
            <div className="icon-box"><i className="fas fa-chart-simple"></i></div>
            <div className="header-text">
              <h3>📊 Mon parcours professionnel</h3>
              <p>Statistiques et progression de votre carrière</p>
            </div>
          </div>
          <div className="card-body">
            <div className="horizontal-item">
              <div className="item-icon gold"><i className="fas fa-file-pdf"></i></div>
              <div className="item-title">CV téléchargé</div>
              <div className="item-desc">Votre CV est prêt</div>
              <div className="item-value">{hasCv ? '✅ Oui' : '❌ Non'}</div>
            </div>

            <div className="horizontal-item">
              <div className="item-icon blue"><i className="fas fa-file-alt"></i></div>
              <div className="item-title">Candidatures</div>
              <div className="item-desc">Offres postulées</div>
              <div className="item-value">{stats.totalCandidatures}</div>
            </div>

            <div className="horizontal-item">
              <div className="item-icon green"><i className="fas fa-check-circle"></i></div>
              <div className="item-title">Acceptées</div>
              <div className="item-desc">Candidatures validées</div>
              <div className="item-value">{stats.acceptees}</div>
              <div className="item-progress">
                <div className="progress-fill" style={{ width: stats.totalCandidatures > 0 ? `${(stats.acceptees / stats.totalCandidatures) * 100}%` : '0%' }}></div>
              </div>
            </div>

            <div className="horizontal-item">
              <div className="item-icon purple"><i className="fas fa-clock"></i></div>
              <div className="item-title">En attente</div>
              <div className="item-desc">Candidatures en cours</div>
              <div className="item-value">{stats.enAttente}</div>
              <div className="item-progress">
                <div className="progress-fill" style={{ width: stats.totalCandidatures > 0 ? `${(stats.enAttente / stats.totalCandidatures) * 100}%` : '0%', background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}></div>
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
              <Link to="/mes-candidatures">Mes candidatures</Link>
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