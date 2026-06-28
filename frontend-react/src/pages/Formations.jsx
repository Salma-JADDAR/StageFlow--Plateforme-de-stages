import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFormations, createFormation, updateFormation, deleteFormation } from '../api/formation';
import toast from 'react-hot-toast';
import api from '../api/axios';

// Images pour l'avatar aléatoire
const avatarImages = [
  '/images/formation1.png', '/images/formation2.png', '/images/formation3.png',
  '/images/formation4.png', '/images/formation5.png', '/images/formation6.png',
  '/images/formation8.png', '/images/formation9.png', '/images/formation10.png',
  '/images/fomration7.png',
];

// Images pour les cartes de formations
const baseImages = [
  '/images/formation1.png', '/images/formation2.png', '/images/formation3.png',
  '/images/formation4.png', '/images/formation5.png', '/images/formation6.png',
  '/images/formation8.png', '/images/formation9.png', '/images/formation10.png',
  '/images/fomration7.png',
];

export default function Formations() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [formations, setFormations] = useState([]);
  const [predefinedFormations, setPredefinedFormations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [randomAvatar, setRandomAvatar] = useState('');
  const [etudiantId, setEtudiantId] = useState(null);
  const [selectedPredefined, setSelectedPredefined] = useState(null);
  const [form, setForm] = useState({
    diplome: '',
    etablissement: '',
    niveau: '',
    anneeDebut: '',
    anneeFin: ''
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

  useEffect(() => {
    fetchFormations();
    fetchPredefinedFormations();
    fetchNotifications();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const randomIndex = Math.floor(Math.random() * avatarImages.length);
    setRandomAvatar(avatarImages[randomIndex]);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPredefinedFormations = async () => {
    try {
      const res = await api.get('/formations-predefinies');
      setPredefinedFormations(res.data);
    } catch (error) {
      console.error('Erreur chargement formations prédéfinies:', error);
    }
  };

  const fetchFormations = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/etudiant/profile');
      const etudiantIdValue = profileRes.data.idEtudiant;
      setEtudiantId(etudiantIdValue);

      const res = await getFormations();
      const userFormations = res.data.filter(formation => formation.etudiant_id === etudiantIdValue);
      setFormations(userFormations);
    } catch (error) {
      console.error('Erreur chargement formations:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPredefined = (predefined) => {
    setSelectedPredefined(predefined);
    setForm({
      diplome: predefined.diplome,
      etablissement: predefined.etablissement,
      niveau: predefined.niveau,
      anneeDebut: '',
      anneeFin: ''
    });
    setShowSelectionModal(false);
    setShowForm(true);
  };

  const handleAddNewFormation = () => {
    setShowSelectionModal(false);
    setSelectedPredefined(null);
    setForm({
      diplome: '',
      etablissement: '',
      niveau: '',
      anneeDebut: '',
      anneeFin: ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateFormation(editing.idFormation, form);
        toast.success('Formation modifiée');
      } else {
        await createFormation(form);
        toast.success('Formation ajoutée');
      }
      setShowForm(false);
      setEditing(null);
      setSelectedPredefined(null);
      setForm({ diplome: '', etablissement: '', niveau: '', anneeDebut: '', anneeFin: '' });
      fetchFormations();
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Supprimer cette formation ?')) {
      await deleteFormation(id);
      toast.success('Formation supprimée');
      fetchFormations();
    }
  };

  const handleViewDetails = (formation) => {
    setSelectedFormation(formation);
    setShowDetailModal(true);
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

  const stats = {
    totalFormations: formations.length,
    totalAnnees: formations.reduce((sum, f) => sum + (parseInt(f.anneeFin) - parseInt(f.anneeDebut) + 1), 0),
    diplomesSup: formations.filter(f => f.niveau?.includes('Master') || f.niveau?.includes('Bac+5') || f.niveau?.includes('Doctorat')).length,
    enCours: formations.filter(f => parseInt(f.anneeFin) >= new Date().getFullYear()).length,
    completed: formations.filter(f => parseInt(f.anneeFin) < new Date().getFullYear()).length,
    completionRate: formations.length > 0 ? Math.round((formations.filter(f => parseInt(f.anneeFin) < new Date().getFullYear()).length / formations.length) * 100) : 0
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
          <p className="mt-6 text-gray-600 font-medium">Chargement de vos formations...</p>
        </div>
      </div>
    );
  }

  const getModalImage = () => {
    if (selectedFormation) {
      const imageIndex = (selectedFormation.idFormation * 2) % baseImages.length;
      return baseImages[imageIndex];
    }
    return baseImages[0];
  };

  return (
    <div className="formations-page">
      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .formations-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
          color: #1a1a1a;
          overflow-x: hidden;
          width: 100%;
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

        /* ========== HERO PREMIUM ========== */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-formations-premium {
          position: relative;
          min-height: 750px;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding-top: 50px;
        }
        .hero-formations-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/fond.png');
          background-size: cover;
          background-position: center;
          z-index: 0;
        }
        .hero-formations-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%);
          z-index: 1;
        }
        .hero-formations-container {
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
        .hero-formations-content {
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
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        .hero-title {
          font-size: 52px;
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
          .hero-formations-container { flex-direction: column; text-align: center; gap: 50px; }
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
        .stat-card:nth-child(1) { background-image: url('images/formation1.png'); }
        .stat-card:nth-child(2) { background-image: url('images/sf.png'); }
        .stat-card:nth-child(3) { background-image: url('images/sf2.png'); }
        .stat-card:nth-child(4) { background-image: url('images/sf3.png'); }
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

        /* ========== SECTION TIMELINE ========== */
        .timeline-section {
          padding: 80px 32px;
          background: #f8f9fa;
        }
        .timeline-container {
          max-width: 1280px;
          margin: 0 auto;
        }
        .timeline-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .section-tag {
          display: inline-block;
          background: rgba(139, 90, 43, 0.1);
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 30px;
          margin-bottom: 16px;
          letter-spacing: 0.5px;
        }
        .timeline-header h2 {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #1a1a1a;
        }
        .timeline-header p {
          font-size: 16px;
          color: #6c757d;
        }
        .timeline {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
        }
        .timeline::before {
          content: '';
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 100%;
          background: linear-gradient(to bottom, #8B5A2B, #ffd966, #8B5A2B);
          border-radius: 10px;
        }
        .timeline-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 50px;
          position: relative;
          cursor: pointer;
        }
        .timeline-item:nth-child(odd) { flex-direction: row; }
        .timeline-item:nth-child(even) { flex-direction: row-reverse; }
        .timeline-content {
          width: 45%;
          background: white;
          padding: 24px 28px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          border: 1px solid #eef2f0;
        }
        .timeline-content:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
          border-color: #8B5A2B;
        }
        .timeline-year {
          font-size: 22px;
          font-weight: 800;
          color: #8B5A2B;
          margin-bottom: 8px;
        }
        .timeline-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #1a1a1a;
        }
        .timeline-text {
          font-size: 14px;
          color: #6c757d;
        }
        .timeline-text .school {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #64748b;
          margin-bottom: 6px;
        }
        .timeline-text .school i { color: #8B5A2B; }
        .timeline-text .tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .timeline-text .tags span {
          background: #f1f5f9;
          padding: 2px 12px;
          border-radius: 20px;
          font-size: 11px;
          color: #475569;
        }
        .timeline-dot {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 18px;
          background: #ffd966;
          border-radius: 50%;
          border: 4px solid #8B5A2B;
          box-shadow: 0 0 0 4px rgba(139, 90, 43, 0.1);
          transition: all 0.3s ease;
          top: 30px;
        }
        .timeline-item:hover .timeline-dot {
          transform: translateX(-50%) scale(1.2);
          background: #ffb347;
        }

        @media (max-width: 1000px) {
          .timeline::before { left: 20px; }
          .timeline-item,
          .timeline-item:nth-child(odd),
          .timeline-item:nth-child(even) {
            flex-direction: column;
            margin-left: 40px;
          }
          .timeline-content { width: 100%; margin-bottom: 20px; }
          .timeline-dot { left: 20px; }
          .timeline-header h2 { font-size: 36px; }
        }
        @media (max-width: 700px) {
          .timeline-header h2 { font-size: 28px; }
          .timeline-content { padding: 20px; }
        }

        /* ========== SECTION SKILLS (6 cartes + fond image) ========== */
        .skills-section {
          position: relative;
          padding: 80px 32px;
          background-image: url('/images/formation6.png');
          background-size: cover;
          background-position: center;
         
          overflow: hidden;
        }
        .skills-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.8) 0%, rgba(0, 0, 0, 0.7) 100%);
          z-index: 0;
        }
        .skills-container {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .skills-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .skills-header .badge {
          display: inline-block;
          background: rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(4px);
          color: #ffd966;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 20px;
          border-radius: 40px;
          border: 1px solid rgba(255, 217, 102, 0.2);
          margin-bottom: 12px;
        }
        .skills-header h2 {
          font-size: 38px;
          font-weight: 800;
          color: white;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .skills-header p {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.85);
        }
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .skills-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          border-radius: 20px;
          padding: 28px 20px;
          text-align: center;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          cursor: default;
        }
        .skills-card::after {
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
        .skills-card:hover::after {
          transform: scaleX(1);
        }
        .skills-card:hover {
          transform: translateY(-8px);
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 217, 102, 0.3);
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.4);
        }
        .skills-card .icon {
          width: 72px;
          height: 72px;
          background: rgba(255, 217, 102, 0.12);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          border: 1px solid rgba(255, 217, 102, 0.2);
          transition: all 0.3s;
        }
        .skills-card:hover .icon {
          background: rgba(255, 217, 102, 0.2);
          transform: scale(1.05);
          border-color: rgba(255, 217, 102, 0.4);
        }
        .skills-card .icon i {
          font-size: 32px;
          color: #ffd966;
          transition: color 0.2s;
        }
        .skills-card h4 {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin-bottom: 6px;
        }
        .skills-card p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
        }

        @media (max-width: 1100px) {
          .skills-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
        }
        @media (max-width: 768px) {
          .skills-grid { grid-template-columns: repeat(2, 1fr); }
          .skills-header h2 { font-size: 28px; }
          .skills-section { padding: 60px 20px; }
        }
        @media (max-width: 480px) {
          .skills-grid { grid-template-columns: 1fr; }
          .skills-card { padding: 24px 16px; }
          .skills-card .icon { width: 60px; height: 60px; }
          .skills-card .icon i { font-size: 26px; }
        }

        /* ========== SECTION RECOMMANDATIONS (4 cartes avec images) ========== */
        .recs-section {
          padding: 80px 32px;
          background: linear-gradient(135deg, #f8fafc, #efe6d8);
        }
        .recs-container {
          max-width: 1280px;
          margin: 0 auto;
        }
        .recs-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .recs-header .badge {
          display: inline-block;
          background: rgba(139, 90, 43, 0.1);
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 16px;
          border-radius: 20px;
          margin-bottom: 12px;
        }
        .recs-header h2 {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .recs-header p {
          color: #64748b;
          font-size: 16px;
        }

        .recs-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .recs-card {
          text-decoration: none;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          height: 100%;
          position: relative;
        }

        .recs-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .recs-card-bg {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 300px;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: flex-end;
          padding: 24px;
        }

        .recs-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.6) 50%,
            rgba(0, 0, 0, 0.85) 100%
          );
          z-index: 0;
          transition: all 0.4s ease;
        }

        .recs-card:hover .recs-card-overlay {
          background: linear-gradient(180deg,
            rgba(0, 0, 0, 0.1) 0%,
            rgba(93, 58, 26, 0.5) 50%,
            rgba(0, 0, 0, 0.9) 100%
          );
        }

        .recs-card-content {
          position: relative;
          z-index: 1;
          color: white;
          width: 100%;
        }

        .recs-icon {
          width: 56px;
          height: 56px;
          background: rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(4px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          border: 1px solid rgba(255, 217, 102, 0.2);
          transition: all 0.3s;
        }

        .recs-card:hover .recs-icon {
          background: rgba(255, 217, 102, 0.25);
          transform: scale(1.05);
        }

        .recs-icon i {
          font-size: 24px;
          color: #ffd966;
        }

        .recs-card-content h4 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 6px;
          color: white;
        }

        .recs-card-content p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .recs-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #ffd966;
          transition: all 0.3s ease;
          padding: 6px 16px;
          background: rgba(255, 217, 102, 0.1);
          border-radius: 30px;
          border: 1px solid rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(4px);
        }

        .recs-card:hover .recs-btn {
          gap: 14px;
          background: rgba(255, 217, 102, 0.2);
          color: #ffe08c;
        }

        @media (max-width: 1100px) {
          .recs-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
        }
        @media (max-width: 768px) {
          .recs-grid { grid-template-columns: 1fr; }
          .recs-card-bg { min-height: 240px; }
          .recs-header h2 { font-size: 28px; }
          .recs-section { padding: 60px 20px; }
        }

        /* ========== ADD BUTTON ========== */
        .add-button-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 32px;
          padding: 0 90px;
        }
        .btn-add-premium {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(93, 58, 26, 0.2);
        }
        .btn-add-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(93, 58, 26, 0.3);
          gap: 14px;
        }

        /* ========== MODALS ========== */
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
          max-width: 550px;
          width: 90%;
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
        .form-group-premium input {
          width: 100%;
          padding: 14px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 16px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          background: #fafbfc;
        }
        .form-group-premium input:focus {
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
        .modal-actions {
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
        }
        .btn-submit-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(93, 58, 26, 0.3);
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

        /* ========== MODAL DE SÉLECTION ========== */
        .selection-modal {
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }
        .predefined-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .predefined-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid #eef2f0;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .predefined-item:hover {
          background: #fef3e8;
          border-color: #8B5A2B;
          transform: translateX(4px);
        }
        .predefined-info h4 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .predefined-info p {
          font-size: 13px;
          color: #64748b;
        }
        .predefined-badge {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .predefined-add-new {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eef2f0;
        }
        .predefined-add-new-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: linear-gradient(135deg, #fef3e8, #fff5ed);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s;
          border: 1px dashed #8B5A2B;
        }
        .predefined-add-new-item:hover {
          background: linear-gradient(135deg, #8B5A2B, #5D3A1A);
          transform: translateX(4px);
        }
        .predefined-add-new-item:hover .predefined-add-new-icon i,
        .predefined-add-new-item:hover .predefined-add-new-info h4,
        .predefined-add-new-item:hover .predefined-add-new-info p,
        .predefined-add-new-item:hover .predefined-add-new-badge i {
          color: white;
        }
        .predefined-add-new-icon {
          width: 50px;
          height: 50px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }
        .predefined-add-new-icon i {
          font-size: 24px;
          color: #8B5A2B;
        }
        .predefined-add-new-info {
          flex: 1;
        }
        .predefined-add-new-info h4 {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .predefined-add-new-info p {
          font-size: 13px;
          color: #64748b;
        }
        .predefined-add-new-badge {
          width: 36px;
          height: 36px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }
        .predefined-add-new-badge i {
          font-size: 16px;
          color: #8B5A2B;
        }

        /* ========== FORMATIONS LAYOUT ========== */
        .formations-layout {
          display: flex;
          gap: 32px;
          padding: 0 90px;
          margin-bottom: 60px;
        }
        .formations-sidebar {
          width: 420px;
          flex-shrink: 0;
        }
        .formations-main {
          flex: 1;
        }
        .formations-grid-premium {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        /* ========== SIDEBAR ========== */
        .sidebar-card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          border: 1px solid #f0f2f5;
          transition: all 0.3s ease;
        }
        .sidebar-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
        }
        .sidebar-header {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          padding: 20px;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .sidebar-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 150%;
          height: 150%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          transform: rotate(25deg);
        }
        .sidebar-header h3 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
          position: relative;
          z-index: 1;
        }
        .sidebar-header p {
          font-size: 12px;
          opacity: 0.8;
          position: relative;
          z-index: 1;
        }
        .sidebar-body {
          padding: 20px;
        }
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #eef2f0;
        }
        .stat-item:last-child {
          border-bottom: none;
        }
        .stat-label {
          font-size: 13px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .stat-label i {
          color: #8B5A2B;
          width: 20px;
        }
        .stat-value {
          font-weight: 700;
          color: #1a1a1a;
        }
        .progress-bar {
          margin: 16px 0;
        }
        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 8px;
          color: #64748b;
        }
        .progress-track {
          height: 8px;
          background: #eef2f0;
          border-radius: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #5D3A1A, #8B5A2B);
          border-radius: 10px;
          transition: width 0.5s ease;
        }
        .tip-card {
          background: #fef3e8;
          border-radius: 16px;
          padding: 16px;
          margin-top: 16px;
        }
        .tip-card i {
          color: #8B5A2B;
          font-size: 20px;
          margin-bottom: 10px;
          display: inline-block;
        }
        .tip-card h4 {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .tip-card p {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }
        .sidebar-image {
          width: 100%;
          height: 120px;
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .sidebar-image::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.6), rgba(139, 90, 43, 0.4));
        }

        /* ========== FORMATIONS CARDS ========== */
        .formation-card-premium {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #f0f2f5;
          cursor: pointer;
          animation: fadeInCard 0.5s ease forwards;
          opacity: 0;
        }
        @keyframes fadeInCard {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .formation-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.15);
          border-color: transparent;
        }
        .formation-image-premium {
          position: relative;
          height: 160px;
          background-size: cover;
          background-position: center;
          transition: transform 0.4s;
        }
        .formation-card-premium:hover .formation-image-premium {
          transform: scale(1.05);
        }
        .formation-image-premium::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.3), rgba(139, 90, 43, 0.2));
        }
        .formation-badge-premium {
          position: absolute;
          top: 16px;
          right: 16px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          z-index: 2;
        }
        .formation-content-premium {
          padding: 24px;
        }
        .formation-header-premium {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .formation-title-premium {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.3;
          flex: 1;
        }
        .card-actions-premium {
          display: flex;
          gap: 12px;
        }
        .card-actions-premium button {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          padding: 6px;
          border-radius: 8px;
        }
        .btn-edit-premium { color: #8B5A2B; }
        .btn-edit-premium:hover { background: #fef3e8; transform: scale(1.1); }
        .btn-delete-premium { color: #dc2626; }
        .btn-delete-premium:hover { background: #fee2e2; transform: scale(1.1); }
        .formation-etablissement-premium {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 13px;
          margin-bottom: 16px;
        }
        .formation-etablissement-premium i { color: #8B5A2B; }
        .formation-details-premium {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          padding: 16px 0;
          border-top: 1px solid #eef2f0;
          border-bottom: 1px solid #eef2f0;
          margin-bottom: 16px;
        }
        .detail-item-premium {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748b;
        }
        .detail-item-premium i { color: #8B5A2B; width: 16px; }
        .formation-footer-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .annee-badge-premium {
          background: #f1f5f9;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }
        .status-badge-premium {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #10b981;
          background: #f0fdf4;
          padding: 6px 14px;
          border-radius: 30px;
        }
        .status-badge-premium.in-progress {
          background: #fef3c7;
          color: #92400e;
        }

        /* ========== MODAL DÉTAILS ========== */
        .detail-modal {
          max-width: 550px;
          width: 90%;
        }
        .detail-modal-image {
          width: 100%;
          height: 250px;
          background-size: cover;
          background-position: center;
          position: relative;
          border-radius: 24px 24px 0 0;
        }
        .detail-modal-image::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.6), rgba(139, 90, 43, 0.4));
          border-radius: 24px 24px 0 0;
        }
        .detail-modal-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          z-index: 2;
        }
        .detail-content {
          padding: 24px;
        }
        .detail-title {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 8px;
          color: #1a1a1a;
        }
        .detail-subtitle {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 14px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eef2f0;
        }
        .detail-subtitle i { color: #8B5A2B; }
        .detail-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .detail-info-item {
          background: #f8fafc;
          padding: 14px;
          border-radius: 16px;
          text-align: center;
        }
        .detail-info-item i {
          font-size: 24px;
          color: #8B5A2B;
          margin-bottom: 8px;
          display: inline-block;
        }
        .detail-info-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .detail-info-value {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin-top: 4px;
        }
        .detail-description {
          background: #fef3e8;
          padding: 16px;
          border-radius: 16px;
          margin-bottom: 24px;
        }
        .detail-description p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 12px;
        }
        .detail-description strong { color: #8B5A2B; }
        .detail-actions {
          display: flex;
          gap: 12px;
        }
        .detail-actions .btn-detail-edit {
          flex: 1;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .detail-actions .btn-detail-edit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(93, 58, 26, 0.3);
        }
        .detail-actions .btn-detail-delete {
          flex: 1;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          padding: 12px;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .detail-actions .btn-detail-delete:hover {
          background: #dc2626;
          color: white;
          transform: translateY(-2px);
        }
        .detail-actions .btn-detail-close {
          flex: 1;
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 12px;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .detail-actions .btn-detail-close:hover { background: #e2e8f0; }

        /* ========== EMPTY STATE ========== */
        .empty-state-premium {
          text-align: center;
          padding: 80px 40px;
          background: white;
          border-radius: 32px;
          border: 1px solid #eef2f0;
        }
        .empty-icon-premium {
          width: 100px;
          height: 100px;
          background: #fef3e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .empty-icon-premium i { font-size: 48px; color: #8B5A2B; }
        .empty-title-premium {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1a1a1a;
        }
        .empty-desc-premium {
          color: #64748b;
          margin-bottom: 24px;
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
          .stats-grid, .formations-layout, .add-button-container { padding: 0 40px; }
          .formations-layout { flex-direction: column; }
          .formations-sidebar { width: 100%; display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        }
        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 40px 20px; }
          .formations-sidebar { grid-template-columns: 1fr; }
          .recs-grid { grid-template-columns: repeat(2, 1fr); }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .timeline::before { left: 20px; }
          .timeline-item,
          .timeline-item:nth-child(odd),
          .timeline-item:nth-child(even) {
            flex-direction: column;
            margin-left: 40px;
          }
          .timeline-content { width: 100%; margin-bottom: 20px; }
          .timeline-dot { left: 20px; }
          .timeline-header h2 { font-size: 36px; }
        }
        @media (max-width: 768px) {
          .skills-grid { grid-template-columns: repeat(2, 1fr); }
          .skills-header h2 { font-size: 28px; }
          .skills-section { padding: 60px 20px; }
          .recs-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 700px) {
          .stats-grid { grid-template-columns: 1fr; }
          .formations-grid-premium { grid-template-columns: 1fr; }
          .form-row-premium { grid-template-columns: 1fr; }
          .modal-content-premium { padding: 24px; }
          .detail-info-grid { grid-template-columns: 1fr; }
          .detail-actions { flex-direction: column; }
          .timeline-header h2 { font-size: 28px; }
          .timeline-content { padding: 20px; }
        }
        @media (max-width: 480px) {
          .skills-grid { grid-template-columns: 1fr; }
          .skills-card { padding: 24px 16px; }
          .skills-card .icon { width: 60px; height: 60px; }
          .skills-card .icon i { font-size: 26px; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr; }
          .formations-grid-premium { grid-template-columns: 1fr; }
          .form-row-premium { grid-template-columns: 1fr; }
          .modal-content-premium { padding: 24px; }
          .detail-info-grid { grid-template-columns: 1fr; }
          .detail-actions { flex-direction: column; }
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
                  <div className="user-avatar">{user.prenom?.charAt(0)}{user.nom?.charAt(0)}</div>
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
                      <Link to="/formations" className="active"><i className="fas fa-graduation-cap"></i> Mes formations</Link>
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
          {user && <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#4a5568', padding: '12px', borderRadius: '12px' }}>Tableau de bord</Link>}
          <Link to="/formations" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#8B5A2B', padding: '12px', borderRadius: '12px', background: '#fef3e8' }}>Mes formations</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* ========== HERO ========== */}
      <section className="hero-formations-premium">
        <div className="hero-formations-bg"></div>
        <div className="hero-formations-overlay"></div>
        <div className="hero-formations-container">
          <div className="hero-formations-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Mon parcours académique
            </div>
            <h1 className="hero-title">
              Mes <span className="hero-name">formations</span>
            </h1>
            <p className="hero-desc">
              Gérez votre parcours éducatif, ajoutez vos diplômes et certifications
            </p>
            <div className="hero-buttons">
              <button onClick={() => setShowSelectionModal(true)} className="hero-btn hero-btn-primary">
                <i className="fas fa-plus-circle"></i> Ajouter une formation
              </button>
              <Link to="/profile" className="hero-btn hero-btn-secondary">
                <i className="fas fa-user-edit"></i> Compléter mon profil
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-card-glass">
                <div className="stat-number">{stats.totalFormations}</div>
                <div className="stat-label">Formations</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.totalAnnees}</div>
                <div className="stat-label">Années études</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.diplomesSup}</div>
                <div className="stat-label">Diplômes sup.</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.enCours}</div>
                <div className="stat-label">En cours</div>
              </div>
            </div>
          </div>
          <div className="hero-avatar">
            <div className="avatar-wrapper">
              <div className="avatar-ring"></div>
              <div className="avatar-circle">
                {randomAvatar ? (
                  <img src={randomAvatar} alt="Avatar formation" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-initials"><i className="fas fa-graduation-cap"></i></div>
                )}
                <div className="avatar-badge"><i className="fas fa-check-circle"></i></div>
              </div>
            </div>
            <div className="hero-quote">
              <i className="fas fa-quote-left"></i> “La formation est la clé de votre réussite”
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS GRID ========== */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-graduation-cap"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalFormations}</div>
            <div className="stat-label">Formations enregistrées</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-calendar-alt"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalAnnees}</div>
            <div className="stat-label">Années d'études</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-trophy"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.diplomesSup}</div>
            <div className="stat-label">Diplômes supérieurs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-clock"></i></div>
          <div className="stat-info">
            <div className="stat-number">{stats.enCours}</div>
            <div className="stat-label">Formations en cours</div>
          </div>
        </div>
      </div>

       {/* ========== FORMATIONS SECTION AVEC SIDEBAR ========== */}
      {formations.length === 0 ? (
        <div className="empty-state-premium" style={{ margin: '0 90px 60px' }}>
          <div className="empty-icon-premium"><i className="fas fa-graduation-cap"></i></div>
          <h3 className="empty-title-premium">Aucune formation</h3>
          <p className="empty-desc-premium">Vous n'avez pas encore ajouté de formation à votre parcours.</p>
          <button onClick={() => setShowSelectionModal(true)} className="btn-add-premium">
            <i className="fas fa-plus-circle"></i> Ajouter votre première formation
          </button>
        </div>
      ) : (
        <>
          <div className="add-button-container">
            <button onClick={() => setShowSelectionModal(true)} className="btn-add-premium">
              <i className="fas fa-plus-circle"></i> Ajouter une formation
            </button>
          </div>
          <div className="formations-layout">
            <div className="formations-sidebar">
              <div className="sidebar-card">
                <div className="sidebar-header">
                  <h3><i className="fas fa-chart-line"></i> Ma progression</h3>
                  <p>Suivi de votre parcours académique</p>
                </div>
                <div className="sidebar-body">
                  <div className="stat-item">
                    <span className="stat-label"><i className="fas fa-check-circle"></i> Formations complétées</span>
                    <span className="stat-value">{stats.completed}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label"><i className="fas fa-hourglass-half"></i> En cours</span>
                    <span className="stat-value">{stats.enCours}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label"><i className="fas fa-star"></i> Taux de complétion</span>
                    <span className="stat-value">{stats.completionRate}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-label">
                      <span>Progression globale</span>
                      <span>{stats.completionRate}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${stats.completionRate}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sidebar-card">
                <div className="sidebar-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=420&h=120&fit=crop')" }}></div>
                <div className="sidebar-body">
                  <div className="tip-card">
                    <i className="fas fa-lightbulb"></i>
                    <h4>Astuce StageFlow</h4>
                    <p>Plus vous complétez votre profil avec vos formations, plus nos recommandations de stages seront pertinentes !</p>
                  </div>
                </div>
              </div>
              <div className="sidebar-card">
                <div className="sidebar-header" style={{ background: 'linear-gradient(135deg, #2d1a0e, #4a2a15)' }}>
                  <h3><i className="fas fa-chart-bar"></i> En chiffres</h3>
                  <p>Votre parcours en données</p>
                </div>
                <div className="sidebar-body">
                  <div className="stat-item">
                    <span className="stat-label"><i className="fas fa-graduation-cap"></i> Total formations</span>
                    <span className="stat-value">{stats.totalFormations}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label"><i className="fas fa-calendar-alt"></i> Années d'études</span>
                    <span className="stat-value">{stats.totalAnnees}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label"><i className="fas fa-trophy"></i> Diplômes supérieurs</span>
                    <span className="stat-value">{stats.diplomesSup}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="formations-main">
              <div className="formations-grid-premium">
                {formations.map((f, idx) => {
                  const imageIndex = (f.idFormation * 2) % baseImages.length;
                  const imageUrl = baseImages[imageIndex];
                  const isCompleted = parseInt(f.anneeFin) < new Date().getFullYear();
                  return (
                    <div key={f.idFormation} className="formation-card-premium" style={{ animationDelay: `${idx * 0.05}s` }} onClick={() => handleViewDetails(f)}>
                      <div className="formation-image-premium" style={{ backgroundImage: `url(${imageUrl})` }}>
                        <div className="formation-badge-premium"><i className="fas fa-certificate"></i> {f.niveau?.split(' ')[0] || 'Formation'}</div>
                      </div>
                      <div className="formation-content-premium">
                        <div className="formation-header-premium">
                          <h3 className="formation-title-premium">{f.diplome}</h3>
                          <div className="card-actions-premium" onClick={(e) => e.stopPropagation()}>
                            {f.etudiant_id === etudiantId && (
                              <>
                                <button onClick={() => { setEditing(f); setForm(f); setShowForm(true); }} className="btn-edit-premium" title="Modifier"><i className="fas fa-edit"></i></button>
                                <button onClick={() => handleDelete(f.idFormation)} className="btn-delete-premium" title="Supprimer"><i className="fas fa-trash-alt"></i></button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="formation-etablissement-premium"><i className="fas fa-university"></i> {f.etablissement}</div>
                        <div className="formation-details-premium">
                          <div className="detail-item-premium"><i className="fas fa-graduation-cap"></i> {f.niveau}</div>
                          <div className="detail-item-premium"><i className="fas fa-calendar-alt"></i> {f.anneeDebut} - {f.anneeFin}</div>
                        </div>
                        <div className="formation-footer-premium">
                          <span className="annee-badge-premium"><i className="fas fa-clock"></i> {parseInt(f.anneeFin) - parseInt(f.anneeDebut) + 1} ans</span>
                          {isCompleted ? (
                            <span className="status-badge-premium"><i className="fas fa-check-circle"></i> Complété</span>
                          ) : (
                            <span className="status-badge-premium in-progress"><i className="fas fa-hourglass-half"></i> En cours</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========== SECTION TIMELINE ========== */}
      {formations.length > 0 && (
        <section className="timeline-section">
          <div className="timeline-container">
            <div className="timeline-header">
              <span className="section-tag">📅 Chronologie</span>
              <h2>Mon parcours dans le temps</h2>
              <p>Retrouvez l'évolution de vos formations année par année</p>
            </div>
            <div className="timeline">
              {[...formations]
                .sort((a, b) => parseInt(a.anneeDebut) - parseInt(b.anneeDebut))
                .map((f, idx) => (
                  <div key={idx} className="timeline-item" onClick={() => handleViewDetails(f)}>
                    <div className="timeline-content">
                      <div className="timeline-year">{f.anneeDebut} - {f.anneeFin}</div>
                      <div className="timeline-title">{f.diplome}</div>
                      <div className="timeline-text">
                        <div className="school"><i className="fas fa-university"></i> {f.etablissement}</div>
                        <div className="tags">
                          <span>{f.niveau}</span>
                          <span>{parseInt(f.anneeFin) - parseInt(f.anneeDebut) + 1} ans</span>
                          <span>{parseInt(f.anneeFin) < new Date().getFullYear() ? '✅ Complété' : '⏳ En cours'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="timeline-dot"></div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== SECTION SKILLS (6 cartes + fond image) ========== */}
      <section className="skills-section">
        <div className="skills-container">
          <div className="skills-header">
            <span className="badge">🧠 Compétences</span>
            <h2>Ce que j'ai appris</h2>
            <p>Les compétences développées à travers mes formations</p>
          </div>
          <div className="skills-grid">
            {formations.length > 0 ? (
              <>
                <div className="skills-card">
                  <div className="icon"><i className="fas fa-code"></i></div>
                  <h4>Développement</h4>
                  <p>Programmation et conception</p>
                </div>
                <div className="skills-card">
                  <div className="icon"><i className="fas fa-database"></i></div>
                  <h4>Gestion de données</h4>
                  <p>Analyse et manipulation</p>
                </div>
                <div className="skills-card">
                  <div className="icon"><i className="fas fa-users"></i></div>
                  <h4>Travail en équipe</h4>
                  <p>Collaboration et communication</p>
                </div>
                <div className="skills-card">
                  <div className="icon"><i className="fas fa-lightbulb"></i></div>
                  <h4>Résolution de problèmes</h4>
                  <p>Analyse et prise de décision</p>
                </div>
                <div className="skills-card">
                  <div className="icon"><i className="fas fa-rocket"></i></div>
                  <h4>Innovation</h4>
                  <p>Créativité et adaptation</p>
                </div>
                <div className="skills-card">
                  <div className="icon"><i className="fas fa-tasks"></i></div>
                  <h4>Gestion de projet</h4>
                  <p>Planification et organisation</p>
                </div>
              </>
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.9)' }}>
                <i className="fas fa-plus-circle" style={{ fontSize: '40px', color: '#ffd966', display: 'block', marginBottom: '16px' }}></i>
                <p>Ajoutez vos formations pour voir les compétences associées.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========== SECTION RECOMMANDATIONS (4 cartes avec images) ========== */}
      <section className="recs-section">
        <div className="recs-container">
          <div className="recs-header">
            <span className="badge">🎯 Suggestions</span>
            <h2>Formations recommandées pour vous</h2>
            <p>Découvrez des formations qui pourraient compléter votre parcours</p>
          </div>
          <div className="recs-grid">
            <Link to="/formations/cloud" className="recs-card">
              <div className="recs-card-bg" style={{ backgroundImage: "url('/images/cloud.png')" }}>
                <div className="recs-card-overlay"></div>
                <div className="recs-card-content">
                  <div className="recs-icon"><i className="fas fa-cloud"></i></div>
                  <h4>Cloud Computing</h4>
                  <p>Maîtrisez AWS, Azure et GCP</p>
                  <span className="recs-btn">En savoir plus <i className="fas fa-arrow-right"></i></span>
                </div>
              </div>
            </Link>
            <Link to="/formations/ia" className="recs-card">
              <div className="recs-card-bg" style={{ backgroundImage: "url('/images/iaaa.png')" }}>
                <div className="recs-card-overlay"></div>
                <div className="recs-card-content">
                  <div className="recs-icon"><i className="fas fa-robot"></i></div>
                  <h4>Intelligence Artificielle</h4>
                  <p>Formez-vous à l'IA et au Machine Learning</p>
                  <span className="recs-btn">En savoir plus <i className="fas fa-arrow-right"></i></span>
                </div>
              </div>
            </Link>
            <Link to="/formations/cyber" className="recs-card">
              <div className="recs-card-bg" style={{ backgroundImage: "url('/images/cyber.png')" }}>
                <div className="recs-card-overlay"></div>
                <div className="recs-card-content">
                  <div className="recs-icon"><i className="fas fa-shield-alt"></i></div>
                  <h4>Cybersécurité</h4>
                  <p>Protégez les systèmes et les données</p>
                  <span className="recs-btn">En savoir plus <i className="fas fa-arrow-right"></i></span>
                </div>
              </div>
            </Link>
            <Link to="/formations/data" className="recs-card">
              <div className="recs-card-bg" style={{ backgroundImage: "url('/images/data.png')" }}>
                <div className="recs-card-overlay"></div>
                <div className="recs-card-content">
                  <div className="recs-icon"><i className="fas fa-database"></i></div>
                  <h4>Data Science</h4>
                  <p>Analyse et visualisation de données</p>
                  <span className="recs-btn">En savoir plus <i className="fas fa-arrow-right"></i></span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== MODAL SÉLECTION ========== */}
      {showSelectionModal && (
        <div className="modal-overlay" onClick={() => setShowSelectionModal(false)}>
          <div className="modal-content-premium selection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h2><i className="fas fa-list"></i> Choisir une formation</h2>
              <button className="modal-close" onClick={() => setShowSelectionModal(false)}>&times;</button>
            </div>
            <div className="predefined-list">
              {predefinedFormations.length === 0 ? (
                <div className="empty-state-premium" style={{ margin: 0, padding: '40px' }}><p>Aucune formation prédéfinie trouvée.</p></div>
              ) : (
                predefinedFormations.map((pf) => (
                  <div key={pf.idFormation} className="predefined-item" onClick={() => handleSelectPredefined(pf)}>
                    <div className="predefined-info">
                      <h4>{pf.diplome}</h4>
                      <p>{pf.etablissement} • {pf.niveau}</p>
                    </div>
                    <div className="predefined-badge"><i className="fas fa-plus"></i> Sélectionner</div>
                  </div>
                ))
              )}
              <div className="predefined-add-new">
                <div className="predefined-add-new-item" onClick={handleAddNewFormation}>
                  <div className="predefined-add-new-icon"><i className="fas fa-plus-circle"></i></div>
                  <div className="predefined-add-new-info">
                    <h4>Ajouter une nouvelle formation</h4>
                    <p>Créez votre propre formation personnalisée</p>
                  </div>
                  <div className="predefined-add-new-badge"><i className="fas fa-arrow-right"></i></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL FORMULAIRE ========== */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(null); setSelectedPredefined(null); setForm({ diplome: '', etablissement: '', niveau: '', anneeDebut: '', anneeFin: '' }); }}>
          <div className="modal-content-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h2><i className="fas fa-graduation-cap"></i> {editing ? 'Modifier' : 'Ajouter'} une formation</h2>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditing(null); setSelectedPredefined(null); setForm({ diplome: '', etablissement: '', niveau: '', anneeDebut: '', anneeFin: '' }); }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group-premium">
                <label>Diplôme / Formation</label>
                <input type="text" placeholder="Ex: Master en Informatique" value={form.diplome} onChange={e => setForm({ ...form, diplome: e.target.value })} required />
              </div>
              <div className="form-group-premium">
                <label>Établissement</label>
                <input type="text" placeholder="Ex: Université Cadi Ayyad" value={form.etablissement} onChange={e => setForm({ ...form, etablissement: e.target.value })} required />
              </div>
              <div className="form-group-premium">
                <label>Niveau d'étude</label>
                <input type="text" placeholder="Ex: Bac+5, Master, Licence" value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })} required />
              </div>
              <div className="form-row-premium">
                <div className="form-group-premium">
                  <label>Année de début</label>
                  <input type="number" placeholder="2020" value={form.anneeDebut} onChange={e => setForm({ ...form, anneeDebut: e.target.value })} required />
                </div>
                <div className="form-group-premium">
                  <label>Année de fin</label>
                  <input type="number" placeholder="2024" value={form.anneeFin} onChange={e => setForm({ ...form, anneeFin: e.target.value })} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-submit-premium"><i className="fas fa-save"></i> {editing ? 'Mettre à jour' : 'Enregistrer'}</button>
                <button type="button" className="btn-cancel-premium" onClick={() => { setShowForm(false); setEditing(null); setSelectedPredefined(null); setForm({ diplome: '', etablissement: '', niveau: '', anneeDebut: '', anneeFin: '' }); }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL DÉTAILS ========== */}
      {showDetailModal && selectedFormation && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content-premium detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-image" style={{ backgroundImage: `url(${getModalImage()})` }}>
              <div className="detail-modal-badge"><i className="fas fa-certificate"></i> {selectedFormation.niveau?.split(' ')[0] || 'Formation'}</div>
            </div>
            <div className="detail-content">
              <h2 className="detail-title">{selectedFormation.diplome}</h2>
              <div className="detail-subtitle"><i className="fas fa-university"></i> {selectedFormation.etablissement}</div>
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <i className="fas fa-graduation-cap"></i>
                  <div className="detail-info-label">Niveau</div>
                  <div className="detail-info-value">{selectedFormation.niveau}</div>
                </div>
                <div className="detail-info-item">
                  <i className="fas fa-calendar-alt"></i>
                  <div className="detail-info-label">Période</div>
                  <div className="detail-info-value">{selectedFormation.anneeDebut} - {selectedFormation.anneeFin}</div>
                </div>
                <div className="detail-info-item">
                  <i className="fas fa-clock"></i>
                  <div className="detail-info-label">Durée</div>
                  <div className="detail-info-value">{parseInt(selectedFormation.anneeFin) - parseInt(selectedFormation.anneeDebut) + 1} ans</div>
                </div>
                <div className="detail-info-item">
                  <i className="fas fa-flag-checkered"></i>
                  <div className="detail-info-label">Statut</div>
                  <div className="detail-info-value" style={{ color: parseInt(selectedFormation.anneeFin) < new Date().getFullYear() ? '#10b981' : '#f59e0b' }}>
                    {parseInt(selectedFormation.anneeFin) < new Date().getFullYear() ? 'Complété' : 'En cours'}
                  </div>
                </div>
              </div>
              <div className="detail-description">
                <p><strong><i className="fas fa-info-circle"></i> À propos de cette formation</strong></p>
                <p>Cette formation de niveau <strong>{selectedFormation.niveau}</strong> vous a permis d'acquérir des compétences solides dans le domaine de <strong>{selectedFormation.diplome}</strong>.</p>
                <p>Diplôme délivré par <strong>{selectedFormation.etablissement}</strong>, reconnu dans le secteur professionnel.</p>
              </div>
              <div className="detail-actions">
                <button className="btn-detail-edit" onClick={() => { setShowDetailModal(false); setEditing(selectedFormation); setForm(selectedFormation); setShowForm(true); }}>
                  <i className="fas fa-edit"></i> Modifier
                </button>
                <button className="btn-detail-delete" onClick={() => { setShowDetailModal(false); handleDelete(selectedFormation.idFormation); }}>
                  <i className="fas fa-trash-alt"></i> Supprimer
                </button>
                <button className="btn-detail-close" onClick={() => setShowDetailModal(false)}>
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