import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const avatarImages = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=11',
  'https://i.pravatar.cc/150?img=21',
  'https://i.pravatar.cc/150?img=25',
  'https://i.pravatar.cc/150?img=28',
  'https://i.pravatar.cc/150?img=32',
  'https://i.pravatar.cc/150?img=45',
  'https://i.pravatar.cc/150?img=60',
  'https://i.pravatar.cc/150?img=65',
  'https://i.pravatar.cc/150?img=70',
  'https://i.pravatar.cc/150?img=75',
];

const offreImages = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=150&fit=crop',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300&h=150&fit=crop',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=300&h=150&fit=crop',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&h=150&fit=crop',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&h=150&fit=crop',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&h=150&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=150&fit=crop',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=300&h=150&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=150&fit=crop',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300&h=150&fit=crop',
];

const entrepriseImages = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=50&h=50&fit=crop',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=50&h=50&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=50&h=50&fit=crop',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=50&h=50&fit=crop',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=50&h=50&fit=crop',
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('utilisateurs');
  const [heroAvatar, setHeroAvatar] = useState('');
  
  // Statistiques
  const [stats, setStats] = useState({
    users_count: 0,
    offres_count: 0,
    candidatures_count: 0,
    match_moyen: 0,
    offres_en_attente: 0
  });
  
  // Utilisateurs
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLastPage, setUsersLastPage] = useState(1);
  
  // Offres
  const [offres, setOffres] = useState([]);
  const [allOffres, setAllOffres] = useState([]);
  const [offresLoading, setOffresLoading] = useState(false);
  const [offresPage, setOffresPage] = useState(1);
  const [offresTotal, setOffresTotal] = useState(0);
  const [offresLastPage, setOffresLastPage] = useState(1);
  
  // Admins
  const [admins, setAdmins] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // ========== ÉTATS DE RECHERCHE ==========
  const [searchUsers, setSearchUsers] = useState('');
  const [searchOffres, setSearchOffres] = useState('');
  const [searchAdmins, setSearchAdmins] = useState('');

  // ========== ACTIVITÉ RÉCENTE ==========
  const [recentActivity, setRecentActivity] = useState([]);
  const [topEntreprises, setTopEntreprises] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({
    users: 0,
    offres: 0,
    candidatures: 0
  });

  // ========== ÉTATS POUR LES NOTIFICATIONS ==========
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // ========== AVATAR RANDOM POUR LE HERO ==========
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * avatarImages.length);
    setHeroAvatar(avatarImages[randomIndex]);
  }, []);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Accès non autorisé');
      navigate('/dashboard');
      return;
    }
    
    fetchStats();
    fetchOffres();
    fetchUsers();
    fetchAdmins();
    fetchRecentActivity();
    fetchTopEntreprises();
    fetchMonthlyStats();
    fetchNotifications(); // 🔥 CHARGER LES NOTIFICATIONS
    
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // 🔥 RAFRAÎCHIR LES NOTIFICATIONS TOUTES LES 30 SECONDES
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/rapport');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffres = async (page = 1) => {
    setOffresLoading(true);
    try {
      const response = await api.get(`/admin/offres?page=${page}`);
      setOffres(response.data.data || []);
      setAllOffres(response.data.data || []);
      setOffresTotal(response.data.total || 0);
      setOffresPage(page);
      setOffresLastPage(response.data.last_page || 1);
    } catch (error) {
      console.error('Erreur chargement offres:', error);
      toast.error('Erreur lors du chargement des offres');
    } finally {
      setOffresLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    setUsersLoading(true);
    try {
      const response = await api.get(`/admin/users?page=${page}`);
      setUsers(response.data.data || []);
      setAllUsers(response.data.data || []);
      setUsersTotal(response.data.total || 0);
      setUsersPage(page);
      setUsersLastPage(response.data.last_page || 1);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const response = await api.get('/admin/administrateurs');
      setAdmins(response.data.data || []);
      setAllAdmins(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement administrateurs:', error);
      toast.error('Erreur lors du chargement des administrateurs');
    } finally {
      setAdminsLoading(false);
    }
  };

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

  // ========== FONCTIONS DE RECHERCHE ==========
  const handleSearchUsers = (e) => {
    const value = e.target.value;
    setSearchUsers(value);
    
    if (value.trim() === '') {
      setUsers(allUsers);
      setUsersTotal(allUsers.length);
    } else {
      const filtered = allUsers.filter(user => 
        (user.nom?.toLowerCase().includes(value.toLowerCase()) ||
        user.prenom?.toLowerCase().includes(value.toLowerCase()) ||
        user.email?.toLowerCase().includes(value.toLowerCase()))
      );
      setUsers(filtered);
      setUsersTotal(filtered.length);
    }
  };

  const handleSearchOffres = (e) => {
    const value = e.target.value;
    setSearchOffres(value);
    
    if (value.trim() === '') {
      setOffres(allOffres);
      setOffresTotal(allOffres.length);
    } else {
      const filtered = allOffres.filter(offre => 
        offre.titre?.toLowerCase().includes(value.toLowerCase()) ||
        offre.entreprise?.nom?.toLowerCase().includes(value.toLowerCase()) ||
        offre.ville?.toLowerCase().includes(value.toLowerCase())
      );
      setOffres(filtered);
      setOffresTotal(filtered.length);
    }
  };

  const handleSearchAdmins = (e) => {
    const value = e.target.value;
    setSearchAdmins(value);
    
    if (value.trim() === '') {
      setAdmins(allAdmins);
    } else {
      const filtered = allAdmins.filter(admin => 
        (admin.nom?.toLowerCase().includes(value.toLowerCase()) ||
        admin.prenom?.toLowerCase().includes(value.toLowerCase()) ||
        admin.email?.toLowerCase().includes(value.toLowerCase()))
      );
      setAdmins(filtered);
    }
  };

  // ========== ACTIVITÉ RÉCENTE ==========
  const fetchRecentActivity = async () => {
    try {
      const activities = [
        { id: 1, action: 'Nouvel utilisateur inscrit', user: 'Ahmed Benali', date: '2024-06-19 14:30', type: 'user' },
        { id: 2, action: 'Nouvelle offre publiée', user: 'Maroc Telecom', date: '2024-06-19 13:15', type: 'offre' },
        { id: 3, action: 'Candidature acceptée', user: 'Sara El Fassi', date: '2024-06-19 12:00', type: 'candidature' },
        { id: 4, action: 'Nouvelle offre en attente', user: 'OCP SA', date: '2024-06-19 10:45', type: 'offre' },
        { id: 5, action: 'Profil complété', user: 'Youssef Tazi', date: '2024-06-19 09:30', type: 'user' },
      ];
      setRecentActivity(activities);
    } catch (error) {
      console.error('Erreur chargement activité:', error);
    }
  };

  const fetchTopEntreprises = async () => {
    try {
      const entreprises = [
        { nom: 'Maroc Telecom', offres: 12, candidatures: 45 },
        { nom: 'OCP SA', offres: 8, candidatures: 32 },
        { nom: 'Attijariwafa Bank', offres: 6, candidatures: 28 },
        { nom: 'CGI Maroc', offres: 5, candidatures: 22 },
        { nom: 'HPS', offres: 4, candidatures: 18 },
      ];
      setTopEntreprises(entreprises);
    } catch (error) {
      console.error('Erreur chargement entreprises:', error);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      setMonthlyStats({
        users: 45,
        offres: 23,
        candidatures: 78
      });
    } catch (error) {
      console.error('Erreur chargement stats mensuelles:', error);
    }
  };

  // ========== FONCTIONS POUR OBTENIR DES IMAGES ALEATOIRES ==========
  const getUserAvatar = (userId) => {
    const index = userId % avatarImages.length;
    return avatarImages[index];
  };

  const getOffreImage = (offreId) => {
    const index = offreId % offreImages.length;
    return offreImages[index];
  };

  const getEntrepriseImage = (index) => {
    return entrepriseImages[index % entrepriseImages.length];
  };

  // ========== FONCTIONS EXISTANTES ==========
  const handleActiverUser = async (id) => {
    try {
      await api.put(`/admin/users/${id}/activer`);
      toast.success('Utilisateur activé avec succès');
      fetchUsers(usersPage);
      fetchStats();
    } catch (error) {
      toast.error('Erreur lors de l\'activation');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/administrateurs', adminForm);
      toast.success('Administrateur ajouté avec succès');
      setShowAdminModal(false);
      setAdminForm({ nom: '', prenom: '', email: '', password: '', password_confirmation: '' });
      fetchAdmins();
      fetchStats();
    } catch (error) {
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(key => {
          toast.error(errors[key][0]);
        });
      } else {
        toast.error('Erreur lors de l\'ajout');
      }
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cet administrateur ?')) return;
    try {
      await api.delete(`/admin/administrateurs/${id}`);
      toast.success('Administrateur supprimé avec succès');
      fetchAdmins();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleValiderOffre = async (id) => {
    try {
      await api.put(`/admin/offres/${id}/valider`);
      toast.success('Offre validée avec succès');
      fetchOffres(offresPage);
      fetchStats();
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleRejeterOffre = async () => {
    if (!rejectReason.trim()) {
      toast.error('Veuillez entrer une raison');
      return;
    }
    try {
      await api.put(`/admin/offres/${selectedItem}/rejeter`, {
        raison: rejectReason
      });
      toast.success('Offre rejetée avec succès');
      setShowModal(false);
      setRejectReason('');
      fetchOffres(offresPage);
      fetchStats();
    } catch (error) {
      toast.error('Erreur lors du rejet');
    }
  };

  const handleReactiverOffre = async (id) => {
    try {
      await api.put(`/admin/offres/${id}/reactiver`);
      toast.success('Offre réactivée avec succès');
      fetchOffres(offresPage);
      fetchStats();
    } catch (error) {
      toast.error('Erreur lors de la réactivation');
    }
  };

  const handleSupprimerOffre = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette offre ?')) return;
    try {
      await api.delete(`/admin/offres/${id}`);
      toast.success('Offre supprimée avec succès');
      fetchOffres(offresPage);
      fetchStats();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDesactiverUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}/desactiver`);
      toast.success('Utilisateur désactivé avec succès');
      fetchUsers(usersPage);
      fetchStats();
    } catch (error) {
      toast.error('Erreur lors de la désactivation');
    }
  };

  const handleSupprimerUser = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Utilisateur supprimé avec succès');
      fetchUsers(usersPage);
      fetchStats();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    const roles = {
      'admin': { label: 'Admin', className: 'badge-info' },
      'recruteur': { label: 'Recruteur', className: 'badge-success' },
      'etudiant': { label: 'Étudiant', className: 'badge-warning' }
    };
    const r = roles[role] || { label: role, className: 'badge-warning' };
    return <span className={`badge ${r.className}`}>{r.label}</span>;
  };

  const getStatutBadge = (statut) => {
    const status = {
      'publiée': { label: 'Publiée', className: 'badge-success' },
      'en_attente': { label: 'En attente', className: 'badge-warning' },
      'refusée': { label: 'Refusée', className: 'badge-danger' },
      'archivée': { label: 'Archivée', className: 'badge' }
    };
    const s = status[statut] || { label: statut, className: 'badge' };
    return <span className={`badge ${s.className}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f5]">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-[#8B5A2B] rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .admin-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
          color: #1a1a1a;
          min-height: 100vh;
          width:100%;
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
        .auth-actions { 
          display: flex; 
          gap: 16px; 
          align-items: center; 
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

        /* ========== HERO ========== */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-dashboard-premium {
          position: relative;
          min-height: 750px;
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
          background-image: url('/images/do.png');
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
        .hero-dashboard-content { flex: 1; color: white; }
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
        .hero-title { font-size: 56px; font-weight: 800; line-height: 1.2; margin-bottom: 20px; letter-spacing: -1px; }
        .hero-name { background: linear-gradient(135deg, #ffd966, #ffb347); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .hero-desc { font-size: 18px; line-height: 1.6; margin-bottom: 48px; max-width: 500px; opacity: 0.9; }
        .hero-buttons { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 56px; }
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
        .hero-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(93, 58, 26, 0.4); gap: 14px; }
        .hero-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
        }
        .hero-btn-secondary:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-3px); border-color: white; }
        .hero-btn-outline {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: white;
        }
        .hero-btn-outline:hover { background: rgba(255, 255, 255, 0.15); transform: translateY(-3px); border-color: white; }
        .hero-stats { display: flex; flex-wrap: wrap; gap: 32px; }
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
        .stat-card-glass:hover { background: rgba(255, 255, 255, 0.15); transform: translateY(-5px); }
        .stat-number { font-size: 32px; font-weight: 800; color: #ffd966; line-height: 1.2; }
        .stat-label { font-size: 13px; color: rgba(255, 255, 255, 0.8); margin-top: 6px; }
        .hero-avatar { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .avatar-wrapper { position: relative; width: 260px; height: 260px; }
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
          .hero-title { font-size: 42px; }
        }
        @media (max-width: 700px) {
          .hero-title { font-size: 32px; }
          .avatar-wrapper { width: 160px; height: 160px; }
          .hero-btn { padding: 8px 20px; font-size: 12px; }
        }

        /* ========== STATS AVEC CERCLES ========== */
        .stats-grid-cercles {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 28px;
          margin: 0 100px 40px;
          margin-top:50px;
        }
        .stat-circle-card {
          background: white;
          border-radius: 28px;
          padding: 28px 24px;
          text-align: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
          border: 1px solid #f0f2f5;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .stat-circle-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #5D3A1A, #8B5A2B, #ffd966);
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }
        .stat-circle-card:hover::before { transform: scaleX(1); }
        .stat-circle-card:hover { transform: translateY(-6px); box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.12); }
        .circle-container {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 16px;
        }
        .circle-container svg {
          width: 120px;
          height: 120px;
          transform: rotate(-90deg);
        }
        .circle-bg { fill: none; stroke: #eef2f0; stroke-width: 8; }
        .circle-fill {
          fill: none;
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dashoffset 1.5s ease;
        }
        .circle-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        .circle-number {
          display: block;
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1;
        }
        .circle-label {
          display: block;
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }
        .stat-circle-card .stat-label-bottom {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-top: 8px;
        }
        .stat-circle-card .stat-desc {
          font-size: 12px;
          color: #64748b;
        }
        .stat-circle-card .stat-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
          padding: 4px 12px;
          border-radius: 20px;
          background: #f0fdf4;
          color: #10b981;
        }
        .stat-circle-card .stat-trend.down { background: #fee2e2; color: #dc2626; }

        /* ========== FILTER WRAPPER ========== */
        .filter-wrapper {
          position: relative;
          z-index: 10;
          margin-top: -30px;
          margin-bottom: 40px;
          padding: 0 20px;
        }
        .filter-card {
          background: white;
          border-radius: 60px;
          padding: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          max-width: 1000px;
          margin: 0 auto;
          box-shadow: 0 25px 40px rgba(0, 0, 0, 0.15);
          justify-content: center;
        }
        .filter-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 4px;
          justify-content: center;
        }
        .filter-tab {
          padding: 10px 28px;
          border-radius: 40px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          background: transparent;
          border: none;
          color: #6c757d;
          font-family: 'Inter', sans-serif;
        }
        .filter-tab.active {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          box-shadow: 0 4px 12px rgba(139,90,43,0.25);
        }
        .filter-tab:hover:not(.active) { background: #fef3e8; color: #8B5A2B; transform: translateY(-1px); }

        /* ========== CONTAINER ========== */
        .container { width: 100%; }

        /* ========== TABLE PROFESSIONNEL ========== */
        .table-wrapper {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
          border: 1px solid #e8ecef;
          padding: 0;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
          transition: all 0.3s ease;
        }
        .table-wrapper:hover {
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e8ecef;
          flex-wrap: wrap;
          gap: 12px;
        }
        .table-header .title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .table-header .title i {
          color: #8B5A2B;
          font-size: 18px;
        }
        .table-header .title .count {
          background: #fef3e8;
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 12px;
          border-radius: 20px;
          margin-left: 8px;
        }
        .table-header .actions-header {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .table-header .search-box {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 40px;
          padding: 6px 16px;
          transition: all 0.3s;
        }
        .table-header .search-box:focus-within {
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139,90,43,0.1);
        }
        .table-header .search-box input {
          border: none;
          outline: none;
          padding: 8px 10px;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          background: transparent;
          min-width: 180px;
        }
        .table-header .search-box i {
          color: #94a3b8;
          font-size: 14px;
        }

        .modern-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .modern-table thead tr {
          background: #f8fafc;
        }
        .modern-table th {
          text-align: left;
          padding: 16px 20px;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border-bottom: 1px solid #e8ecef;
          position: sticky;
          top: 0;
          background: #f8fafc;
          z-index: 5;
        }
        .modern-table th:first-child {
          padding-left: 24px;
        }
        .modern-table th:last-child {
          padding-right: 24px;
        }
        .modern-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: all 0.2s ease;
        }
        .modern-table tbody tr:last-child {
          border-bottom: none;
        }
        .modern-table tbody tr:hover {
          background: #fafcfc;
        }
        .modern-table tbody tr:hover td {
          background: #fafcfc;
        }
        .modern-table td {
          padding: 14px 20px;
          vertical-align: middle;
          font-size: 14px;
          color: #1a1a1a;
          transition: background 0.2s ease;
        }
        .modern-table td:first-child {
          padding-left: 24px;
        }
        .modern-table td:last-child {
          padding-right: 24px;
        }

        /* Lignes alternées */
        .modern-table tbody tr:nth-child(even) {
          background: #fafbfc;
        }
        .modern-table tbody tr:nth-child(even):hover {
          background: #f5f6f8;
        }

        /* Badges améliorés */
        .badge {
          padding: 5px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          letter-spacing: 0.3px;
        }
        .badge-success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #d1fae5;
        }
        .badge-success i { color: #10b981; }
        .badge-danger {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        .badge-danger i { color: #ef4444; }
        .badge-info {
          background: #fef3e8;
          color: #8B5A2B;
          border: 1px solid #fde8d8;
        }
        .badge-info i { color: #8B5A2B; }
        .badge-warning {
          background: #fffbeb;
          color: #92400e;
          border: 1px solid #fde68a;
        }
        .badge-warning i { color: #f59e0b; }

        /* Actions */
        .actions-cell {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .btn-approve {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #d1fae5;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-approve:hover {
          background: #065f46;
          color: white;
          border-color: #065f46;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(6, 95, 70, 0.25);
        }
        .btn-reject {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-reject:hover {
          background: #991b1b;
          color: white;
          border-color: #991b1b;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(153, 27, 27, 0.25);
        }
        .btn-danger-sm {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-danger-sm:hover {
          background: #991b1b;
          color: white;
          border-color: #991b1b;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(153, 27, 27, 0.25);
        }
        .btn-warning-sm {
          background: #fffbeb;
          color: #92400e;
          border: 1px solid #fde68a;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-warning-sm:hover {
          background: #92400e;
          color: white;
          border-color: #92400e;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(146, 64, 14, 0.25);
        }
        .btn-primary-sm {
          background: #fef3e8;
          color: #8B5A2B;
          border: 1px solid #fde8d8;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-primary-sm:hover {
          background: #8B5A2B;
          color: white;
          border-color: #8B5A2B;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139,90,43,0.25);
        }
        .btn-success-sm {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #d1fae5;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-success-sm:hover {
          background: #065f46;
          color: white;
          border-color: #065f46;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(6, 95, 70, 0.25);
        }

        /* Status dot */
        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
        }
        .status-dot.active { background: #10b981; }
        .status-dot.inactive { background: #ef4444; }
        .status-dot.pending { background: #f59e0b; }

        /* User avatar in table */
        .user-avatar-sm {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
          overflow: hidden;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
        }
        .user-avatar-sm img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-cell .info {
          display: flex;
          flex-direction: column;
        }
        .user-cell .info .name {
          font-weight: 600;
          color: #1a1a1a;
        }
        .user-cell .info .role-text {
          font-size: 12px;
          color: #94a3b8;
        }

        /* Offre image in table */
        .offre-image-sm {
          width: 60px;
          height: 45px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #e8ecef;
        }
        .offre-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .offre-cell .info .titre {
          font-weight: 600;
          color: #1a1a1a;
          font-size: 14px;
        }
        .offre-cell .info .entreprise {
          font-size: 12px;
          color: #64748b;
        }

        /* Entreprise image in list */
        .entreprise-logo-sm {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e8ecef;
          flex-shrink: 0;
        }

        /* ========== BOUTON AJOUTER ADMIN - DESIGN AMÉLIORÉ ========== */
        .btn-add-admin-premium {
          display: inline-flex;
          align-items: center;
          gap: 20px;
          margin-right:160px;
          padding: 12px 30px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          border-radius: 50px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          box-shadow: 0 4px 15px rgba(139, 90, 43, 0.2);
          font-family: 'Inter', sans-serif;
        }
        .btn-add-admin-premium i {
          font-size: 16px;
          transition: transform 0.3s ease;
        }
        .btn-add-admin-premium:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 25px rgba(93, 58, 26, 0.35);
          gap: 14px;
        }
        .btn-add-admin-premium:hover i {
          transform: rotate(90deg) scale(1.1);
        }
        .btn-add-admin-premium:active {
          transform: scale(0.97);
        }

        /* ========== PAGINATION ========== */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin-top: 40px;
          padding: 0 24px;
        }
        .page-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 24px;
          background: white;
          color: #8B5A2B;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          border-radius: 40px;
          transition: all 0.3s;
          border: 1px solid #e8ecef;
          cursor: pointer;
        }
        .page-link:hover:not(.disabled) {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border-color: transparent;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(139,90,43,0.3);
        }
        .page-link.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f1f5f9;
          color: #94a3b8;
        }
        .page-link.disabled:hover {
          transform: none;
          background: #f1f5f9;
          color: #94a3b8;
          box-shadow: none;
        }
        .page-info {
          padding: 8px 20px;
          background: #fef3e8;
          border-radius: 40px;
          font-size: 14px;
          font-weight: 600;
          color: #8B5A2B;
        }

        /* ========== EMPTY STATE ========== */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 28px;
        }
        .empty-icon {
          font-size: 64px;
          color: #cbd5e1;
          margin-bottom: 20px;
        }
        .empty-state h3 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .empty-state p {
          color: #6c757d;
          margin-bottom: 24px;
        }

        /* ========== MODALS ========== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-content {
          background: white;
          border-radius: 32px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-content h3 {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .modal-content textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          font-family: 'Inter', sans-serif;
          margin: 16px 0;
          resize: vertical;
          min-height: 100px;
        }
        .modal-content textarea:focus { outline: none; border-color: #8B5A2B; }
        .modal-buttons {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .modal-btn { padding: 10px 24px; border-radius: 40px; font-weight: 600; cursor: pointer; border: none; font-size: 13px; }
        .modal-btn-cancel { background: #f1f5f9; color: #475569; }
        .modal-btn-confirm { background: #dc2626; color: white; }
        .modal-btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }

        .modal-admin-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        .modal-admin-content {
          background: white;
          border-radius: 32px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          animation: slideUp 0.3s ease;
        }
        .modal-admin-content h3 { font-size: 22px; font-weight: 800; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .modal-admin-content .form-group { margin-bottom: 16px; }
        .modal-admin-content .form-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .modal-admin-content .form-group input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          background: #fafbfc;
        }
        .modal-admin-content .form-group input:focus { outline: none; border-color: #8B5A2B; box-shadow: 0 0 0 3px rgba(139,90,43,0.1); background: white; }
        .modal-admin-content .modal-buttons { display: flex; gap: 16px; justify-content: flex-end; margin-top: 20px; }
        .modal-admin-content .modal-btn { padding: 10px 24px; border-radius: 40px; font-weight: 600; cursor: pointer; border: none; font-size: 13px; }
        .modal-admin-content .modal-btn-cancel { background: #f1f5f9; color: #475569; }
        .modal-admin-content .modal-btn-confirm { background: linear-gradient(135deg, #5D3A1A, #8B5A2B); color: white; }
        .modal-admin-content .modal-btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(139,90,43,0.3); }

        /* ========== SECTIONS SUPPLÉMENTAIRES ========== */
        .extra-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-top: 40px;
          padding: 0 60px;
          max-width: 1600px;
          margin-left: auto;
          margin-right: auto;
        }
        .extra-card {
          background: white;
          border-radius: 24px;
          padding: 28px 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          border: 1px solid #eef2f0;
          transition: all 0.3s ease;
        }
        .extra-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06); }
        .extra-card .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eef2f0;
        }
        .extra-card .card-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .extra-card .card-header h3 i { color: #8B5A2B; }
        .extra-card .card-header .see-all {
          font-size: 12px;
          color: #8B5A2B;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }
        .extra-card .card-header .see-all:hover { color: #5D3A1A; }

        /* Activity */
        .activity-list { display: flex; flex-direction: column; gap: 12px; }
        .activity-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 14px;
          transition: all 0.3s;
          border: 1px solid transparent;
        }
        .activity-item:hover { background: #fef3e8; border-color: #8B5A2B; transform: translateX(4px); }
        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .activity-icon.user { background: #eff6ff; color: #3b82f6; }
        .activity-icon.offre { background: #fef3e8; color: #8B5A2B; }
        .activity-icon.candidature { background: #f0fdf4; color: #10b981; }
        .activity-content { flex: 1; }
        .activity-content .action { font-weight: 600; color: #1a1a1a; font-size: 14px; }
        .activity-content .user { font-size: 13px; color: #64748b; }
        .activity-content .time { font-size: 11px; color: #94a3b8; display: block; margin-top: 2px; }

        /* Top Entreprises */
        .entreprise-list { display: flex; flex-direction: column; gap: 12px; }
        .entreprise-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 14px;
          transition: all 0.3s;
          border: 1px solid transparent;
        }
        .entreprise-item:hover { background: #fef3e8; border-color: #8B5A2B; transform: translateX(4px); }
        .entreprise-rank {
          font-size: 16px;
          font-weight: 800;
          color: #8B5A2B;
          min-width: 28px;
        }
        .entreprise-info { flex: 1; }
        .entreprise-info .nom { font-weight: 600; color: #1a1a1a; font-size: 14px; }
        .entreprise-info .stats { font-size: 12px; color: #64748b; }
        .entreprise-bar {
          width: 80px;
          height: 6px;
          background: #eef2f0;
          border-radius: 10px;
          overflow: hidden;
        }
        .entreprise-bar .fill {
          height: 100%;
          background: linear-gradient(90deg, #5D3A1A, #8B5A2B);
          border-radius: 10px;
          transition: width 0.8s ease;
        }

        /* Stats mensuelles */
        .monthly-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 8px;
        }
        .monthly-stat {
          text-align: center;
          padding: 16px;
          background: #f8fafc;
          border-radius: 16px;
          transition: all 0.3s;
        }
        .monthly-stat:hover { background: #fef3e8; transform: translateY(-3px); }
        .monthly-stat .number {
          font-size: 28px;
          font-weight: 800;
          color: #8B5A2B;
        }
        .monthly-stat .label {
          font-size: 12px;
          color: #64748b;
          display: block;
          margin-top: 4px;
        }
        .monthly-stat .trend {
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
          display: inline-block;
          padding: 2px 10px;
          border-radius: 20px;
          background: #f0fdf4;
          color: #10b981;
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
        .footer-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
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
        .footer-bottom { text-align: center; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #a0b0a0; }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 1200px) {
          .stats-grid-cercles { margin: 0 40px 40px; grid-template-columns: repeat(2, 1fr); }
          .extra-sections { grid-template-columns: 1fr; padding: 0 20px; }
          .container { padding: 0 20px 40px; }
          .table-header { flex-direction: column; gap: 12px; align-items: stretch; }
          .table-header .search-box input { min-width: 120px; }
        }
        @media (max-width: 900px) {
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .stats-grid-cercles { grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 0 20px 40px; }
          .filter-card { flex-direction: column; border-radius: 30px; }
          .filter-tabs { justify-content: center; }
          .table-wrapper { overflow-x: auto; }
          .modern-table { min-width: 800px; }
          .extra-sections { grid-template-columns: 1fr; padding: 0 20px; }
          .monthly-stats { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .pagination { gap: 12px; flex-wrap: wrap; }
          .page-link { padding: 10px 20px; font-size: 14px; }
          .table-header { flex-direction: column; align-items: stretch; gap: 12px; }
          .table-header .search-box { width: 100%; }
          .table-header .search-box input { min-width: auto; width: 100%; }
          .notification-dropdown {
            width: 320px;
            right: -60px;
          }
        }
        @media (max-width: 600px) {
          .stats-grid-cercles { grid-template-columns: 1fr; gap: 16px; }
          .stat-circle-card { padding: 20px; }
          .circle-container { width: 100px; height: 100px; }
          .circle-container svg { width: 100px; height: 100px; }
          .circle-number { font-size: 22px; }
          .filter-tabs { flex-direction: column; align-items: center; }
          .filter-tab { width: 100%; text-align: center; }
          .actions-cell { flex-direction: column; align-items: center; }
          .extra-card { padding: 20px; }
          .enterprise-item { flex-wrap: wrap; }
          .enterprise-bar { width: 100%; }
          .activity-item { flex-wrap: wrap; }
          .table-header .title { font-size: 14px; flex-wrap: wrap; }
          .user-cell .info .role-text { display: none; }
          .offre-image-sm { width: 45px; height: 35px; }
          .btn-add-admin-premium { width: 100%; justify-content: center; }
          .notification-dropdown {
            width: 300px;
            right: -80px;
          }
          .notification-item {
            padding: 12px 16px;
          }
        }
      `}</style>

      {/* ========== NAVBAR ========== */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="logo">
            <span>Stage<span>Flow</span></span>
          </Link>
        
          <div className="auth-actions">
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
                  <Link to="/dashboard-admin" className="active"><i className="fas fa-tachometer-alt"></i> Tableau de bord</Link>
                  <Link to="/profile"><i className="fas fa-user"></i> Mon profil</Link>
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
          <Link to="/dashboard-admin" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#8B5A2B', padding: '12px', borderRadius: '12px', background: '#fef3e8' }}>Administration</Link>
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
              Espace Administrateur
            </div>
            <h1 className="hero-title">
              Bonjour, <span className="hero-name">{user?.prenom || user?.nom}</span>
            </h1>
            <p className="hero-desc">
              Gérez les utilisateurs, les offres et supervisez toute la plateforme StageFlow.
            </p>
            <div className="hero-buttons">
              <button onClick={() => setActiveTab('utilisateurs')} className="hero-btn hero-btn-primary">
                <i className="fas fa-users"></i> Utilisateurs
              </button>
              <button onClick={() => setActiveTab('admins')} className="hero-btn hero-btn-secondary">
                <i className="fas fa-user-shield"></i> Administrateurs
              </button>
              <button onClick={() => setActiveTab('annonces')} className="hero-btn hero-btn-outline">
                <i className="fas fa-briefcase"></i> Offres en attente
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat-card-glass">
                <div className="stat-number">{stats.users_count}</div>
                <div className="stat-label">Utilisateurs</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.offres_count}</div>
                <div className="stat-label">Offres</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.candidatures_count}</div>
                <div className="stat-label">Candidatures</div>
              </div>
            </div>
          </div>
          <div className="hero-avatar">
            <div className="avatar-wrapper">
              <div className="avatar-ring"></div>
              <div className="avatar-circle">
                {heroAvatar ? (
                  <img 
                    src={heroAvatar} 
                    alt="Admin Avatar" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="avatar-initials">
                          <i class="fas fa-user-shield"></i>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="avatar-initials">
                    <i className="fas fa-user-shield"></i>
                  </div>
                )}
                <div className="avatar-badge">
                  <i className="fas fa-check-circle"></i>
                </div>
              </div>
            </div>
            <div className="hero-quote">
              <i className="fas fa-quote-left"></i> “La supervision au cœur de la plateforme.”
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS AVEC CERCLES ========== */}
      <div className="stats-grid-cercles">
        <div className="stat-circle-card">
          <div className="circle-container">
            <svg viewBox="0 0 120 120">
              <circle className="circle-bg" cx="60" cy="60" r="50" />
              <circle 
                className="circle-fill" 
                cx="60" 
                cy="60" 
                r="50"
                style={{
                  strokeDasharray: 314.16,
                  strokeDashoffset: 314.16 - (stats.users_count > 100 ? 314.16 : (stats.users_count / 100) * 314.16),
                  stroke: '#8B5A2B'
                }}
              />
            </svg>
            <div className="circle-center">
              <span className="circle-number">{stats.users_count}</span>
              <span className="circle-label">Utilisateurs</span>
            </div>
          </div>
          <div className="stat-label-bottom">Total des utilisateurs</div>
          <div className="stat-desc">Inscrits sur la plateforme</div>
          <div className="stat-trend"><i className="fas fa-arrow-up"></i> +12% ce mois</div>
        </div>

        <div className="stat-circle-card">
          <div className="circle-container">
            <svg viewBox="0 0 120 120">
              <circle className="circle-bg" cx="60" cy="60" r="50" />
              <circle 
                className="circle-fill" 
                cx="60" 
                cy="60" 
                r="50"
                style={{
                  strokeDasharray: 314.16,
                  strokeDashoffset: 314.16 - (stats.offres_count > 100 ? 314.16 : (stats.offres_count / 100) * 314.16),
                  stroke: '#3b82f6'
                }}
              />
            </svg>
            <div className="circle-center">
              <span className="circle-number">{stats.offres_count}</span>
              <span className="circle-label">Offres</span>
            </div>
          </div>
          <div className="stat-label-bottom">Offres totales</div>
          <div className="stat-desc">Publiées sur la plateforme</div>
          <div className="stat-trend"><i className="fas fa-arrow-up"></i> +8% ce mois</div>
        </div>

        <div className="stat-circle-card">
          <div className="circle-container">
            <svg viewBox="0 0 120 120">
              <circle className="circle-bg" cx="60" cy="60" r="50" />
              <circle 
                className="circle-fill" 
                cx="60" 
                cy="60" 
                r="50"
                style={{
                  strokeDasharray: 314.16,
                  strokeDashoffset: 314.16 - (stats.candidatures_count > 100 ? 314.16 : (stats.candidatures_count / 100) * 314.16),
                  stroke: '#10b981'
                }}
              />
            </svg>
            <div className="circle-center">
              <span className="circle-number">{stats.candidatures_count}</span>
              <span className="circle-label">Candidatures</span>
            </div>
          </div>
          <div className="stat-label-bottom">Candidatures totales</div>
          <div className="stat-desc">Envoyées par les étudiants</div>
          <div className="stat-trend"><i className="fas fa-arrow-up"></i> +5% ce mois</div>
        </div>

        <div className="stat-circle-card">
          <div className="circle-container">
            <svg viewBox="0 0 120 120">
              <circle className="circle-bg" cx="60" cy="60" r="50" />
              <circle 
                className="circle-fill" 
                cx="60" 
                cy="60" 
                r="50"
                style={{
                  strokeDasharray: 314.16,
                  strokeDashoffset: 314.16 - (stats.offres_en_attente > 100 ? 314.16 : (stats.offres_en_attente / 100) * 314.16),
                  stroke: '#f59e0b'
                }}
              />
            </svg>
            <div className="circle-center">
              <span className="circle-number">{stats.offres_en_attente}</span>
              <span className="circle-label">En attente</span>
            </div>
          </div>
          <div className="stat-label-bottom">Offres en attente</div>
          <div className="stat-desc">À valider par l'admin</div>
          <div className="stat-trend down"><i className="fas fa-arrow-down"></i> -3% ce mois</div>
        </div>
      </div>

  

      {/* ========== CONTAINER ========== */}
      <div className="container">
        {/* Tab Utilisateurs */}
        {activeTab === 'utilisateurs' && (
          <div>
            <div className="table-wrapper">
              <div className="table-header">
                <div className="title">
                  <i className="fas fa-users"></i>
                  Utilisateurs
                  <span className="count">{usersTotal} total</span>
                </div>
                <div className="actions-header">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input 
                      type="text" 
                      placeholder="Rechercher un utilisateur..." 
                      value={searchUsers}
                      onChange={handleSearchUsers}
                    />
                  </div>
                </div>
              </div>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Ville</th>
                    <th>Inscription</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#8B5A2B' }}></i>
                      <p className="mt-2 text-gray-500">Chargement...</p>
                    </td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                      <i className="fas fa-users" style={{ fontSize: '32px', color: '#cbd5e1' }}></i>
                      <p className="mt-2 text-gray-500">Aucun utilisateur trouvé</p>
                    </td></tr>
                  ) : (
                    users.map(userItem => (
                      <tr key={userItem.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-sm">
                              <img 
                                src={getUserAvatar(userItem.id)} 
                                alt={`${userItem.prenom} ${userItem.nom}`}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `
                                    ${userItem.prenom?.charAt(0)}${userItem.nom?.charAt(0)}
                                  `;
                                }}
                              />
                            </div>
                            <div className="info">
                              <span className="name">{userItem.prenom} {userItem.nom}</span>
                              <span className="role-text">{userItem.role === 'etudiant' ? '🎓 Étudiant' : userItem.role === 'recruteur' ? '🏢 Recruteur' : '👑 Admin'}</span>
                            </div>
                          </div>
                        </td>
                        <td>{userItem.email}</td>
                        <td>{getRoleBadge(userItem.role)}</td>
                        <td>{userItem.ville || '—'}</td>
                        <td>{new Date(userItem.dateCreation).toLocaleDateString('fr-FR')}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="actions-cell">
                            {userItem.role !== 'admin' && (
                              <>
                                {userItem.is_active ? (
                                  <button className="btn-warning-sm" onClick={() => handleDesactiverUser(userItem.id)}>
                                    <i className="fas fa-ban"></i> Désactiver
                                  </button>
                                ) : (
                                  <button className="btn-success-sm" onClick={() => handleActiverUser(userItem.id)}>
                                    <i className="fas fa-check-circle"></i> Activer
                                  </button>
                                )}
                                <button className="btn-danger-sm" onClick={() => handleSupprimerUser(userItem.id)}>
                                  <i className="fas fa-trash-alt"></i> Supprimer
                                </button>
                              </>
                            )}
                            {userItem.role === 'admin' && (
                              <span style={{ fontSize: '12px', color: '#94a3b8', padding: '6px 12px', background: '#f1f5f9', borderRadius: '30px' }}>
                                🔒 Protégé
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button 
                className={`page-link ${usersPage <= 1 ? 'disabled' : ''}`}
                onClick={() => fetchUsers(usersPage - 1)}
                disabled={usersPage <= 1}
              >
                <i className="fas fa-arrow-left"></i> Précédent
              </button>
              <span className="page-info">
                Page {usersPage} sur {usersLastPage}
              </span>
              <button 
                className={`page-link ${usersPage >= usersLastPage ? 'disabled' : ''}`}
                onClick={() => fetchUsers(usersPage + 1)}
                disabled={usersPage >= usersLastPage}
              >
                Suivant <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* Tab Administrateurs - AVEC BOUTON DESIGN AMÉLIORÉ */}
        {activeTab === 'admins' && (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-add-admin-premium" 
                onClick={() => setShowAdminModal(true)}
              >
                <i className="fas fa-user-plus"></i>
                Ajouter un administrateur
              </button>
            </div>

            <div className="table-wrapper">
              <div className="table-header">
                <div className="title">
                  <i className="fas fa-user-shield"></i>
                  Administrateurs
                  <span className="count">{admins.length} total</span>
                </div>
                <div className="actions-header">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input 
                      type="text" 
                      placeholder="Rechercher un administrateur..." 
                      value={searchAdmins}
                      onChange={handleSearchAdmins}
                    />
                  </div>
                </div>
              </div>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Administrateur</th>
                    <th>Email</th>
                    <th>Date d'ajout</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminsLoading ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#8B5A2B' }}></i>
                      <p className="mt-2 text-gray-500">Chargement...</p>
                    </td></tr>
                  ) : admins.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                      <i className="fas fa-user-shield" style={{ fontSize: '32px', color: '#cbd5e1' }}></i>
                      <p className="mt-2 text-gray-500">Aucun administrateur trouvé</p>
                    </td></tr>
                  ) : (
                    admins.map(admin => (
                      <tr key={admin.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-sm" style={{ background: 'linear-gradient(135deg, #8B5A2B, #5D3A1A)', overflow: 'hidden' }}>
                              <img 
                                src={getUserAvatar(admin.id)} 
                                alt={`${admin.prenom} ${admin.nom}`}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `
                                    ${admin.prenom?.charAt(0)}${admin.nom?.charAt(0)}
                                  `;
                                }}
                              />
                            </div>
                            <div className="info">
                              <span className="name">{admin.prenom} {admin.nom}</span>
                              <span className="role-text">👑 Administrateur</span>
                            </div>
                          </div>
                        </td>
                        <td>{admin.email}</td>
                        <td>{new Date(admin.dateCreation).toLocaleDateString('fr-FR')}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="actions-cell">
                            {admin.id !== user?.id && (
                              <button className="btn-danger-sm" onClick={() => handleDeleteAdmin(admin.id)}>
                                <i className="fas fa-trash-alt"></i> Supprimer
                              </button>
                            )}
                            {admin.id === user?.id && (
                              <span style={{ fontSize: '12px', color: '#94a3b8', padding: '6px 12px', background: '#f1f5f9', borderRadius: '30px' }}>
                                👤 Vous
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Offres en attente */}
        {activeTab === 'annonces' && (
          <div>
            {offresLoading ? (
              <div className="text-center py-12">
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#8B5A2B' }}></i>
                <p className="mt-4 text-gray-500">Chargement...</p>
              </div>
            ) : offres.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fas fa-check-circle" style={{ color: '#8B5A2B' }}></i>
                </div>
                <h3>Aucune offre en attente</h3>
                <p>Toutes les offres ont été traitées ✅</p>
              </div>
            ) : (
              <>
                <div className="table-wrapper">
                  <div className="table-header">
                    <div className="title">
                      <i className="fas fa-briefcase"></i>
                      Offres en attente
                      <span className="count">{offresTotal} total</span>
                    </div>
                    <div className="actions-header">
                      <div className="search-box">
                        <i className="fas fa-search"></i>
                        <input 
                          type="text" 
                          placeholder="Rechercher une offre..." 
                          value={searchOffres}
                          onChange={handleSearchOffres}
                        />
                      </div>
                    </div>
                  </div>
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Titre</th>
                        <th>Entreprise</th>
                        <th>Ville</th>
                        <th>Statut</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offres.map(offre => (
                        <tr key={offre.idOffre}>
                          <td>
                            <img 
                              src={getOffreImage(offre.idOffre)} 
                              alt={offre.titre}
                              className="offre-image-sm"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=150&fit=crop';
                              }}
                            />
                          </td>
                          <td><strong>{offre.titre}</strong></td>
                          <td>{offre.entreprise?.nom || 'N/A'}</td>
                          <td>{offre.ville}</td>
                          <td>{getStatutBadge(offre.statut)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="actions-cell">
                              {offre.statut === 'en_attente' && (
                                <>
                                  <button className="btn-approve" onClick={() => handleValiderOffre(offre.idOffre)}>
                                    <i className="fas fa-check-circle"></i> Approuver
                                  </button>
                                  <button className="btn-reject" onClick={() => {
                                    setSelectedItem(offre.idOffre);
                                    setModalType('reject');
                                    setShowModal(true);
                                  }}>
                                    <i className="fas fa-times-circle"></i> Rejeter
                                  </button>
                                </>
                              )}
                              {offre.statut === 'refusée' && (
                                <button className="btn-approve" onClick={() => handleReactiverOffre(offre.idOffre)}>
                                  <i className="fas fa-undo"></i> Réactiver
                                </button>
                              )}
                              <button className="btn-danger-sm" onClick={() => handleSupprimerOffre(offre.idOffre)}>
                                <i className="fas fa-trash-alt"></i> Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                  <button 
                    className={`page-link ${offresPage <= 1 ? 'disabled' : ''}`}
                    onClick={() => fetchOffres(offresPage - 1)}
                    disabled={offresPage <= 1}
                  >
                    <i className="fas fa-arrow-left"></i> Précédent
                  </button>
                  <span className="page-info">
                    Page {offresPage} sur {offresLastPage}
                  </span>
                  <button 
                    className={`page-link ${offresPage >= offresLastPage ? 'disabled' : ''}`}
                    onClick={() => fetchOffres(offresPage + 1)}
                    disabled={offresPage >= offresLastPage}
                  >
                    Suivant <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ========== SECTIONS SUPPLÉMENTAIRES ========== */}
      <div className="extra-sections">
        {/* Activité récente */}
        <div className="extra-card">
          <div className="card-header">
            <h3><i className="fas fa-clock"></i> Activité récente</h3>
            <span className="see-all">Voir tout →</span>
          </div>
          <div className="activity-list">
            {recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  <i className={`fas ${activity.type === 'user' ? 'fa-user' : activity.type === 'offre' ? 'fa-briefcase' : 'fa-file-alt'}`}></i>
                </div>
                <div className="activity-content">
                  <div className="action">{activity.action}</div>
                  <div className="user">Par {activity.user}</div>
                  <span className="time">{new Date(activity.date).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Entreprises avec logos */}
        <div className="extra-card">
          <div className="card-header">
            <h3><i className="fas fa-building"></i> Top entreprises</h3>
            <span className="see-all">Voir tout →</span>
          </div>
          <div className="entreprise-list">
            {topEntreprises.map((entreprise, index) => (
              <div key={index} className="entreprise-item">
                <span className="entreprise-rank">#{index + 1}</span>
                <img 
                  src={getEntrepriseImage(index)} 
                  alt={entreprise.nom}
                  className="entreprise-logo-sm"
                  onError={(e) => {
                    e.target.src = 'https://ui-avatars.com/api/?name=' + entreprise.nom.charAt(0) + '&background=8B5A2B&color=fff&size=50';
                  }}
                />
                <div className="entreprise-info">
                  <div className="nom">{entreprise.nom}</div>
                  <div className="stats">{entreprise.offres} offres • {entreprise.candidatures} candidatures</div>
                </div>
                <div className="entreprise-bar">
                  <div className="fill" style={{ width: `${(entreprise.offres / topEntreprises[0].offres) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiques mensuelles */}
        <div className="extra-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3><i className="fas fa-chart-simple"></i> Statistiques du mois</h3>
            <span className="see-all">Voir tout →</span>
          </div>
          <div className="monthly-stats">
            <div className="monthly-stat">
              <div className="number">{monthlyStats.users}</div>
              <span className="label">Nouveaux utilisateurs</span>
              <span className="trend"><i className="fas fa-arrow-up"></i> +15%</span>
            </div>
            <div className="monthly-stat">
              <div className="number">{monthlyStats.offres}</div>
              <span className="label">Nouvelles offres</span>
              <span className="trend"><i className="fas fa-arrow-up"></i> +22%</span>
            </div>
            <div className="monthly-stat">
              <div className="number">{monthlyStats.candidatures}</div>
              <span className="label">Nouvelles candidatures</span>
              <span className="trend"><i className="fas fa-arrow-up"></i> +18%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MODAL ADMIN ========== */}
      {showAdminModal && (
        <div className="modal-admin-overlay" onClick={() => setShowAdminModal(false)}>
          <div className="modal-admin-content" onClick={(e) => e.stopPropagation()}>
            <h3><i className="fas fa-user-shield" style={{ color: '#8B5A2B' }}></i> Ajouter un administrateur</h3>
            <form onSubmit={handleAddAdmin}>
              <div className="form-group">
                <label>Prénom *</label>
                <input 
                  type="text" 
                  value={adminForm.prenom} 
                  onChange={(e) => setAdminForm({...adminForm, prenom: e.target.value})}
                  required
                  placeholder="Prénom"
                />
              </div>
              <div className="form-group">
                <label>Nom *</label>
                <input 
                  type="text" 
                  value={adminForm.nom} 
                  onChange={(e) => setAdminForm({...adminForm, nom: e.target.value})}
                  required
                  placeholder="Nom"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  value={adminForm.email} 
                  onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                  required
                  placeholder="email@example.com"
                />
              </div>
              <div className="form-group">
                <label>Mot de passe *</label>
                <input 
                  type="password" 
                  value={adminForm.password} 
                  onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                  required
                  placeholder="••••••••"
                  minLength="8"
                />
              </div>
              <div className="form-group">
                <label>Confirmer le mot de passe *</label>
                <input 
                  type="password" 
                  value={adminForm.password_confirmation} 
                  onChange={(e) => setAdminForm({...adminForm, password_confirmation: e.target.value})}
                  required
                  placeholder="••••••••"
                  minLength="8"
                />
              </div>
              <div className="modal-buttons">
                <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowAdminModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="modal-btn modal-btn-confirm">
                  <i className="fas fa-plus"></i> Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL REJET ========== */}
      {showModal && modalType === 'reject' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3><i className="fas fa-exclamation-triangle" style={{ color: '#dc2626' }}></i> Rejeter l'offre</h3>
            <p style={{ color: '#64748b', marginBottom: '8px' }}>Veuillez indiquer la raison du rejet :</p>
            <textarea 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Photos non conformes, informations manquantes..."
              rows="4"
            />
            <div className="modal-buttons">
              <button className="modal-btn modal-btn-cancel" onClick={() => {
                setShowModal(false);
                setRejectReason('');
              }}>
                Annuler
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={handleRejeterOffre}>
                Rejeter l'offre
              </button>
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
              <h4>Administration</h4>
              <Link to="/dashboard-admin">Tableau de bord</Link>
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