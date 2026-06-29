import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllCompetences, ajouterCompetenceEtudiant, supprimerCompetenceEtudiant } from '../api/competence';
import toast from 'react-hot-toast';
import api from '../api/axios';

const avatarImages = [
  '/images/formation1.png', '/images/formation2.png', '/images/formation3.png',
  '/images/formation4.png', '/images/formation5.png', '/images/formation6.png',
  '/images/formation8.png', '/images/formation9.png', '/images/formation10.png',
  '/images/fomration7.png',
];

const competenceImages = [
  '/images/do.png', '/images/do1.png', '/images/do2.png', '/images/do3.png',
  '/images/do4.png', '/images/do5.png', '/images/do6.png', '/images/do7.png',
  '/images/do8.png', '/images/do9.png', '/images/doo.png', '/images/doo1.png',
  '/images/doo2.png', '/images/doo3.png', '/images/doo4.png', '/images/doo5.png',
];

export default function Competences() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [allComps, setAllComps] = useState([]);
  const [myComps, setMyComps] = useState([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [niveau, setNiveau] = useState('intermédiaire');
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompetence, setSelectedCompetence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [randomAvatar, setRandomAvatar] = useState('');
  const [etudiantId, setEtudiantId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    expert: 0,
    avance: 0,
    intermediaire: 0,
    debutant: 0
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

  // ========== ÉTAT POUR MODIFIER LE NIVEAU D'UNE COMPÉTENCE ==========
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCompetence, setEditCompetence] = useState(null);
  const [editNiveau, setEditNiveau] = useState('intermédiaire');
  const [editingCompetence, setEditingCompetence] = useState(false);

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
    fetchData();
    fetchNotifications();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const randomIndex = Math.floor(Math.random() * avatarImages.length);
    setRandomAvatar(avatarImages[randomIndex]);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const profileRes = await api.get('/etudiant/profile');
      const etudiantIdValue = profileRes.data.idEtudiant;
      setEtudiantId(etudiantIdValue);
      
      const allCompsRes = await getAllCompetences();
      setAllComps(allCompsRes.data);
      
      const myCompsRes = await api.get('/etudiant/competences');
      const myCompsData = myCompsRes.data || [];
      setMyComps(myCompsData);
      
      const expertCount = myCompsData.filter(c => c.pivot?.niveau === 'expert').length;
      const avanceCount = myCompsData.filter(c => c.pivot?.niveau === 'avancé').length;
      const intermediaireCount = myCompsData.filter(c => c.pivot?.niveau === 'intermédiaire').length;
      const debutantCount = myCompsData.filter(c => c.pivot?.niveau === 'débutant').length;
      
      setStats({
        total: myCompsData.length,
        expert: expertCount,
        avance: avanceCount,
        intermediaire: intermediaireCount,
        debutant: debutantCount
      });
      
    } catch (error) {
      console.error('Erreur chargement compétences:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
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
      setAllComps([...allComps, addedCompetence]);
      
      // Ajouter automatiquement la compétence à l'étudiant avec le niveau choisi
      await ajouterCompetenceEtudiant(addedCompetence.idCompetence, newCompetence.niveau);
      
      toast.success('Compétence ajoutée avec succès !');
      setNewCompetence({ nom: '', categorie: '', niveau: 'intermédiaire' });
      setShowAddCompetenceModal(false);
      
      await fetchData();
      
    } catch (error) {
      console.error('Erreur ajout compétence:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout de la compétence');
    } finally {
      setAddingCompetence(false);
    }
  };

  // ========== FONCTION POUR AJOUTER UNE COMPÉTENCE EXISTANTE AVEC NIVEAU ==========
  const handleAddExistingCompetence = async () => {
    if (!selectedExistingCompetence) {
      toast.error('Veuillez sélectionner une compétence');
      return;
    }
    
    // Vérifier si la compétence est déjà dans ma liste
    if (myComps.some(c => c.idCompetence === selectedExistingCompetence)) {
      toast.warning('Vous possédez déjà cette compétence');
      return;
    }
    
    try {
      await ajouterCompetenceEtudiant(selectedExistingCompetence, tempNiveau);
      toast.success('Compétence ajoutée avec le niveau ' + tempNiveau);
      setSelectedExistingCompetence(null);
      setTempNiveau('intermédiaire');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la compétence');
    }
  };

  // ========== FONCTION POUR MODIFIER LE NIVEAU D'UNE COMPÉTENCE ==========
  const handleEditNiveau = (competence) => {
    setEditCompetence(competence);
    setEditNiveau(competence.pivot?.niveau || 'intermédiaire');
    setShowEditModal(true);
  };

  const handleUpdateNiveau = async () => {
    if (!editCompetence) return;
    
    setEditingCompetence(true);
    try {
      // Supprimer l'ancienne compétence
      await supprimerCompetenceEtudiant(editCompetence.idCompetence);
      // Ajouter avec le nouveau niveau
      await ajouterCompetenceEtudiant(editCompetence.idCompetence, editNiveau);
      
      toast.success('Niveau mis à jour avec succès !');
      setShowEditModal(false);
      setEditCompetence(null);
      fetchData();
    } catch (error) {
      console.error('Erreur mise à jour niveau:', error);
      toast.error('Erreur lors de la mise à jour du niveau');
    } finally {
      setEditingCompetence(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedComp) {
      toast.error('Veuillez sélectionner une compétence');
      return;
    }
    try {
      await ajouterCompetenceEtudiant(selectedComp, niveau);
      toast.success('Compétence ajoutée avec succès');
      setSelectedComp('');
      setNiveau('intermédiaire');
      setShowForm(false);
      fetchData();
    } catch (err) { 
      toast.error('Erreur lors de l\'ajout'); 
    }
  };

  const handleRemove = async (id) => {
    if (confirm('Supprimer cette compétence de votre profil ?')) {
      try {
        await supprimerCompetenceEtudiant(id);
        toast.success('Compétence supprimée');
        fetchData();
      } catch (err) { 
        toast.error('Erreur lors de la suppression'); 
      }
    }
  };

  const handleViewDetails = (competence) => {
    setSelectedCompetence(competence);
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

  const getNiveauColor = (niveau) => {
    switch(niveau) {
      case 'expert': return '#10b981';
      case 'avancé': return '#3b82f6';
      case 'intermédiaire': return '#f59e0b';
      case 'débutant': return '#8B5A2B';
      default: return '#64748b';
    }
  };

  const getNiveauIcon = (niveau) => {
    switch(niveau) {
      case 'expert': return 'fas fa-crown';
      case 'avancé': return 'fas fa-rocket';
      case 'intermédiaire': return 'fas fa-chart-line';
      case 'débutant': return 'fas fa-seedling';
      default: return 'fas fa-code';
    }
  };

  const getNiveauLabel = (niveau) => {
    switch(niveau) {
      case 'expert': return 'Expert';
      case 'avancé': return 'Avancé';
      case 'intermédiaire': return 'Intermédiaire';
      case 'débutant': return 'Débutant';
      default: return niveau;
    }
  };

  const getImageForCompetence = (id) => {
    const imageIndex = (id * 3) % competenceImages.length;
    return competenceImages[imageIndex];
  };

  const competencesByCategory = allComps.reduce((acc, comp) => {
    const cat = comp.categorie || 'Autres';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(comp);
    return acc;
  }, {});

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
          <p className="mt-6 text-gray-600 font-medium">Chargement de vos compétences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="competences-page">
      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .competences-page {
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
        .hero-competences-premium {
          position: relative;
          min-height: 850px;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding-top: 50px;
        }
        .hero-competences-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/doo3.png');
          background-size: cover;
          background-position: center;
          z-index: 0;
        }
        .hero-competences-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%);
          z-index: 1;
        }
        .hero-competences-container {
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
        .hero-competences-content {
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
          min-width: 100px;
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
          .hero-competences-container { flex-direction: column; text-align: center; gap: 50px; }
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
          grid-template-columns: repeat(5, 1fr);
          gap: 28px;
          margin-bottom: 56px;
          padding: 60px 90px;
        }
        .stat-card-premium {
          background: white;
          border-radius: 28px;
          padding: 28px 24px;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.02);
          border: 1px solid #f0f2f5;
          position: relative;
          overflow: hidden;
        }
        .stat-card-premium::before {
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
        .stat-card-premium:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.12);
          border-color: transparent;
        }
        .stat-card-premium:hover::before { transform: scaleX(1); }
        .stat-icon-premium {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #fef3e8, #fff5ed);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          transition: all 0.3s;
        }
        .stat-card-premium:hover .stat-icon-premium {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          transform: scale(1.02);
        }
        .stat-icon-premium i { font-size: 32px; color: #8B5A2B; transition: color 0.2s; }
        .stat-card-premium:hover .stat-icon-premium i { color: white; }
        .stat-number-premium {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
          margin-bottom: 6px;
        }
        .stat-label-premium {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
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

        /* ========== MODAL FORMULAIRE PREMIUM ========== */
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
        .form-group-premium select, .form-group-premium input {
          width: 100%;
          padding: 14px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 16px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          background: #fafbfc;
        }
        .form-group-premium select:focus, .form-group-premium input:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
          background: white;
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

        /* ========== LAYOUT COMPÉTENCES AVEC SIDEBAR ========== */
        .competences-layout {
          display: flex;
          gap: 32px;
          padding: 0 90px;
          margin-bottom: 60px;
        }
        .competences-sidebar {
          width: 400px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .competences-main {
          flex: 1;
        }
        .competences-grid-premium {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        /* ========== SIDEBAR STYLES ========== */
        .sidebar-card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
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
        .stat-label-sidebar {
          font-size: 13px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .stat-label-sidebar i {
          color: #8B5A2B;
          width: 20px;
        }
        .stat-value-sidebar {
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

        /* ========== COMPÉTENCES RECOMMANDÉES DANS SIDEBAR ========== */
        .sidebar-recommended-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sidebar-rec-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 14px;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }
        .sidebar-rec-item:hover {
          background: #fef3e8;
          border-color: #8B5A2B;
          transform: translateX(4px);
        }
        .sidebar-rec-item .info h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 2px;
        }
        .sidebar-rec-item .info p {
          font-size: 11px;
          color: #64748b;
        }
        .sidebar-rec-item .btn-add-rec {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          padding: 4px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .sidebar-rec-item .btn-add-rec:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(93, 58, 26, 0.2);
        }

        /* ========== COMPÉTENCES GRID PREMIUM AVEC BOUTON MODIFIER ========== */
        .competence-card-premium {
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
        .competence-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.15);
          border-color: transparent;
        }
        .competence-image-premium {
          position: relative;
          height: 160px;
          background-size: cover;
          background-position: center;
          transition: transform 0.4s;
        }
        .competence-card-premium:hover .competence-image-premium {
          transform: scale(1.05);
        }
        .competence-image-premium::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.3), rgba(139, 90, 43, 0.2));
        }
        .competence-badge-premium {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          z-index: 2;
          background: rgba(0, 0, 0, 0.7);
          color: white;
        }
        .competence-content-premium {
          padding: 24px;
        }
        .competence-header-premium {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .competence-title-premium {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.3;
          flex: 1;
        }
        .card-actions-premium {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        /* ========== BOUTON MODIFIER ========== */
        .btn-edit-premium {
          color: #3b82f6;
          background: none;
          border: none;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          padding: 6px;
          border-radius: 8px;
        }
        .btn-edit-premium:hover {
          background: #eff6ff;
          transform: scale(1.1);
          color: #2563eb;
        }

        .btn-delete-premium { 
          color: #dc2626; 
          background: none;
          border: none;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          padding: 6px;
          border-radius: 8px;
        }
        .btn-delete-premium:hover { 
          background: #fee2e2; 
          transform: scale(1.1); 
        }

        .competence-categorie-premium {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 13px;
          margin-bottom: 16px;
        }
        .competence-categorie-premium i { color: #8B5A2B; }
        .competence-footer-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #eef2f0;
        }
        .niveau-badge-premium {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
        }

        /* ========== MODAL DÉTAILS COMPÉTENCE ========== */
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
        .detail-description strong {
          color: #8B5A2B;
        }
        .detail-actions {
          display: flex;
          gap: 12px;
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
        .detail-actions .btn-detail-close:hover {
          background: #e2e8f0;
        }

        /* ========== MODAL AJOUT COMPÉTENCE DESIGN PROFESSIONNEL ========== */
        .add-competence-modal-content {
          max-width: 580px;
          padding: 0;
          overflow: hidden;
          border-radius: 28px;
        }

        .modal-header-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 28px 32px 20px;
          border-bottom: 1px solid #eef2f0;
          background: linear-gradient(135deg, #faf7f2 0%, #ffffff 100%);
        }

        .modal-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .modal-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 22px;
          box-shadow: 0 4px 12px rgba(139, 90, 43, 0.25);
        }

        .modal-header-premium h2 {
          font-size: 22px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
          line-height: 1.2;
        }

        .modal-header-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .modal-close {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f1f5f9;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .modal-close:hover:not(:disabled) {
          background: #fee2e2;
          color: #dc2626;
          transform: rotate(90deg);
        }
        .modal-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-body-premium {
          padding: 24px 32px 32px;
          max-height: 70vh;
          overflow-y: auto;
        }
        .modal-body-premium::-webkit-scrollbar {
          width: 4px;
        }
        .modal-body-premium::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .section-header-comp {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .section-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .section-icon-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #fef3e8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8B5A2B;
          font-size: 14px;
        }
        .section-icon-badge.new {
          background: #ecfdf5;
          color: #10b981;
        }
        .section-header-comp h4 {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }
        .section-header-comp p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }
        .section-badge-count {
          font-size: 11px;
          font-weight: 600;
          color: #8B5A2B;
          background: #fef3e8;
          padding: 4px 12px;
          border-radius: 20px;
        }
        .section-badge-count.new {
          background: #ecfdf5;
          color: #10b981;
        }

        .section-existing-competence {
          background: #f8fafc;
          border-radius: 16px;
          padding: 16px;
          border: 1px solid #eef2f0;
        }
        .add-existing-competence-row {
          margin-top: 4px;
        }
        .add-existing-competence-fields {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }
        .field-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .field-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .field-label i {
          color: #8B5A2B;
          font-size: 11px;
        }
        .required {
          color: #dc2626;
        }
        .form-select-premium {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          background: white;
          transition: all 0.2s;
          color: #1a1a1a;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 34px;
        }
        .form-select-premium:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
        }
        .form-select-premium .option-category {
          color: #94a3b8;
          font-size: 12px;
        }
        .niveau-select {
          min-width: 130px;
          flex: 0.7;
        }
        .btn-add-existing-competence {
          padding: 10px 24px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          min-height: 44px;
        }
        .btn-add-existing-competence:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(93, 58, 26, 0.3);
          gap: 12px;
        }
        .btn-add-existing-competence:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .modal-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 24px 0;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
        }
        .divider-text {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          padding: 0 8px;
        }
        .divider-text i {
          color: #8B5A2B;
          font-size: 12px;
        }

        .section-new-competence {
          margin-top: 4px;
        }
        .new-competence-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-row-comp {
          display: flex;
          gap: 16px;
        }
        .form-row-comp .field-wrapper {
          flex: 1;
        }
        .form-input-premium {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          background: white;
          color: #1a1a1a;
        }
        .form-input-premium:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
        }
        .form-input-premium::placeholder {
          color: #94a3b8;
        }
        .field-hint {
          display: block;
          margin-top: 6px;
          font-size: 11px;
          color: #94a3b8;
        }
        .field-hint i {
          color: #8B5A2B;
          margin-right: 4px;
        }

        .modal-actions-premium {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .btn-submit-premium {
          flex: 1;
          padding: 12px 24px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 48px;
        }
        .btn-submit-premium:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(93, 58, 26, 0.35);
          gap: 14px;
        }
        .btn-submit-premium:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .btn-cancel-premium {
          flex: 1;
          padding: 12px 24px;
          background: #f1f5f9;
          color: #475569;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 48px;
        }
        .btn-cancel-premium:hover:not(:disabled) {
          background: #e2e8f0;
        }
        .btn-cancel-premium:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ========== MODAL MODIFIER LE NIVEAU ========== */
        .edit-niveau-modal {
          max-width: 500px;
        }

        .edit-niveau-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .edit-competence-preview {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid #eef2f0;
        }

        .preview-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          flex-shrink: 0;
        }

        .preview-info {
          flex: 1;
        }
        .preview-info h4 {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }
        .preview-category {
          font-size: 12px;
          color: #64748b;
        }

        .preview-current-level {
          text-align: right;
        }
        .current-label {
          display: block;
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .current-value {
          font-size: 16px;
          font-weight: 700;
        }

        .niveau-progression {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 8px;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid #eef2f0;
        }

        .progression-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
        }
        .step-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e2e8f0;
          border: 2px solid #cbd5e1;
          transition: all 0.3s ease;
        }
        .step-dot.active {
          background: #8B5A2B;
          border-color: #5D3A1A;
          box-shadow: 0 0 0 4px rgba(139, 90, 43, 0.15);
          transform: scale(1.1);
        }
        .step-label {
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          transition: color 0.3s;
        }
        .step-label.active {
          color: #8B5A2B;
        }
        .progression-line {
          flex: 1;
          height: 2px;
          background: #e2e8f0;
          border-radius: 2px;
          margin: 0 4px;
          margin-bottom: 18px;
        }

        .edit-niveau-form .field-wrapper {
          margin-bottom: 8px;
        }

        /* ========== SECTION POURQUOI VALORISER VOS COMPÉTENCES ? (5 cartes) ========== */
        .pourquoi-section {
          position: relative;
          padding: 80px 32px;
          background-image: url('/images/vosc.png');
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }
        .pourquoi-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.85) 0%, rgba(0, 0, 0, 0.7) 100%);
          z-index: 0;
        }
        .pourquoi-container {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .pourquoi-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .pourquoi-header .badge {
          display: inline-block;
          background: rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(4px);
          padding: 6px 20px;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 600;
          color: #ffd966;
          border: 1px solid rgba(255, 217, 102, 0.2);
          margin-bottom: 16px;
        }
        .pourquoi-header h2 {
          font-size: 38px;
          font-weight: 800;
          color: white;
          margin-bottom: 12px;
        }
        .pourquoi-header p {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.85);
        }
        .pourquoi-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 24px;
        }
        .pourquoi-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          border-radius: 20px;
          padding: 28px 20px;
          text-align: center;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition: all 0.4s ease;
        }
        .pourquoi-card:hover {
          transform: translateY(-6px);
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 217, 102, 0.3);
        }
        .pourquoi-card .icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 217, 102, 0.12);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          border: 1px solid rgba(255, 217, 102, 0.2);
        }
        .pourquoi-card .icon i {
          font-size: 28px;
          color: #ffd966;
        }
        .pourquoi-card h4 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .pourquoi-card p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
        }

        /* ========== SECTION COMPÉTENCES TENDANCE (8 cartes, marron) ========== */
        .trending-section {
          padding: 80px 32px;
          background: white;
        }
        .trending-container {
          max-width: 1280px;
          margin: 0 auto;
        }
        .trending-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .trending-header .badge {
          display: inline-block;
          background: rgba(139, 90, 43, 0.1);
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 16px;
          border-radius: 20px;
          margin-bottom: 12px;
        }
        .trending-header h2 {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .trending-header p {
          color: #64748b;
          font-size: 16px;
        }

        .trending-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .trending-item {
          border-radius: 20px;
          padding: 24px 16px;
          text-align: center;
          transition: all 0.4s ease;
          border: 1px solid transparent;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          cursor: default;
        }
        .trending-item:hover {
          transform: translateY(-8px);
          border-color: #ffd966;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
        }
        .trending-item .icon {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: all 0.3s;
        }
        .trending-item:hover .icon {
          background: rgba(255, 217, 102, 0.15);
          transform: scale(1.05);
        }
        .trending-item .icon i {
          font-size: 28px;
          color: #ffd966;
        }
        .trending-item h4 {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin-bottom: 6px;
        }
        .trending-item span {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          display: block;
          margin-bottom: 12px;
        }
        .trending-badge {
          display: inline-block;
          background: rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(4px);
          padding: 4px 12px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 700;
          color: #ffd966;
          border: 1px solid rgba(255, 217, 102, 0.2);
          transition: all 0.3s;
        }
        .trending-item:hover .trending-badge {
          background: rgba(255, 217, 102, 0.25);
          color: white;
        }

        /* ========== SECTION SUGGESTIONS DE FORMATIONS (avec images de fond) ========== */
        .suggestions-section {
          padding: 80px 32px;
          background: #efe6d8;
          margin-bottom: 0px;
        }
        .suggestions-container {
          max-width: 1280px;
          margin: 0 auto;
        }
        .suggestions-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .suggestions-header .badge {
          display: inline-block;
          background: rgba(139, 90, 43, 0.1);
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 16px;
          border-radius: 20px;
          margin-bottom: 12px;
        }
        .suggestions-header h2 {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .suggestions-header p {
          color: #64748b;
          font-size: 16px;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .suggestion-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid #eef2f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }
        .suggestion-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.08);
          border-color: #8B5A2B;
        }

        .suggestion-card-bg {
          position: relative;
          height: 180px;
          background-size: cover;
          background-position: center;
        }
        .suggestion-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%);
          z-index: 0;
        }
        .suggestion-card-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          padding: 4px 14px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(4px);
        }
        .suggestion-card-badge i {
          font-size: 12px;
        }

        .suggestion-body {
          padding: 20px;
        }
        .suggestion-body h4 {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #1a1a1a;
        }
        .suggestion-body p {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 12px;
        }
        .skills-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .skills-tags span {
          background: #f1f5f9;
          padding: 2px 12px;
          border-radius: 20px;
          font-size: 11px;
          color: #475569;
        }
        .suggestion-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #8B5A2B;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: gap 0.3s;
        }
        .suggestion-link:hover {
          gap: 14px;
        }

        /* ========== EMPTY STATE PREMIUM ========== */
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
          .stats-grid, .competences-layout, .add-button-container { padding: 0 40px; }
          .stats-grid { padding: 40px; }
          .competences-layout { flex-direction: column; }
          .competences-sidebar { width: 100%; display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .pourquoi-grid { grid-template-columns: repeat(2, 1fr); }
          .trending-grid { grid-template-columns: repeat(3, 1fr); }
          .suggestions-grid { grid-template-columns: repeat(2, 1fr); }
          .add-existing-competence-fields { flex-direction: column; align-items: stretch; }
          .add-existing-competence-fields .form-select-premium { min-width: auto; }
          .add-existing-competence-fields .niveau-select { min-width: auto; }
          .btn-add-existing-competence { justify-content: center; }
          .form-row-comp { flex-direction: column; gap: 12px; }
          .edit-competence-preview { flex-direction: column; text-align: center; }
          .preview-current-level { text-align: center; }
          .niveau-progression { flex-direction: column; gap: 8px; padding: 16px; }
          .progression-step { flex-direction: row; width: 100%; justify-content: space-between; }
          .progression-line { width: 2px; height: 12px; margin: 0 auto; }
        }
        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .competences-sidebar { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
        }
        @media (max-width: 768px) {
          .pourquoi-grid { grid-template-columns: 1fr; }
          .trending-grid { grid-template-columns: repeat(2, 1fr); }
          .suggestions-grid { grid-template-columns: 1fr; }
          .suggestion-card-bg { height: 140px; }
          .modal-content-premium.add-competence-modal-content {
            max-width: 95%;
            border-radius: 20px;
          }
          .modal-header-premium {
            padding: 20px 20px 16px;
            flex-wrap: wrap;
            gap: 12px;
          }
          .modal-header-left { flex: 1; }
          .modal-header-premium h2 { font-size: 18px; }
          .modal-body-premium { padding: 16px 20px 24px; }
          .add-existing-competence-fields { flex-direction: column; align-items: stretch; }
          .add-existing-competence-fields .field-wrapper { flex: 1; }
          .niveau-select { min-width: auto; flex: 1; }
          .btn-add-existing-competence { justify-content: center; min-height: 44px; }
          .modal-actions-premium { flex-direction: column; }
          .btn-submit-premium, .btn-cancel-premium { min-height: 44px; padding: 10px 20px; }
          .section-header-comp { flex-direction: column; align-items: flex-start; gap: 8px; }
          .section-badge-count { font-size: 10px; }
          .edit-niveau-modal { max-width: 95%; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .competences-grid-premium { grid-template-columns: 1fr; }
          .modal-content-premium { padding: 24px; }
          .detail-info-grid { grid-template-columns: 1fr; }
          .detail-actions { flex-direction: column; }
          .trending-grid { grid-template-columns: 1fr; }
          .modal-header-premium { padding: 16px 16px 12px; }
          .modal-body-premium { padding: 12px 16px 20px; }
          .modal-header-icon { width: 40px; height: 40px; font-size: 18px; }
          .modal-header-premium h2 { font-size: 16px; }
          .modal-header-subtitle { font-size: 11px; }
          .section-header-comp h4 { font-size: 13px; }
          .form-select-premium, .form-input-premium { font-size: 12px; padding: 8px 12px; }
          .btn-add-existing-competence, .btn-submit-premium, .btn-cancel-premium { font-size: 12px; min-height: 40px; }
          .competence-card-premium .card-actions-premium { flex-direction: row; }
          .competence-card-premium .btn-edit-premium,
          .competence-card-premium .btn-delete-premium { font-size: 14px; padding: 4px 8px; }
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
                  <Link to={getDashboardLink()}>
                    <i className="fas fa-tachometer-alt"></i> Tableau de bord
                  </Link>
                  <Link to="/profile"><i className="fas fa-user"></i> Mon profil</Link>
                  {user.role === 'etudiant' && (
                    <>
                      <Link to="/mes-candidatures"><i className="fas fa-file-alt"></i> Mes candidatures</Link>
                      <Link to="/recommandations"><i className="fas fa-robot"></i> Recommandations IA</Link>
                      <Link to="/formations"><i className="fas fa-graduation-cap"></i> Mes formations</Link>
                      <Link to="/competences" className="active"><i className="fas fa-code"></i> Mes compétences</Link>
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
          <Link to="/competences" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#8B5A2B', padding: '12px', borderRadius: '12px', background: '#fef3e8' }}>Mes compétences</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* ========== HERO PREMIUM ========== */}
      <section className="hero-competences-premium">
        <div className="hero-competences-bg"></div>
        <div className="hero-competences-overlay"></div>
        <div className="hero-competences-container">
          <div className="hero-competences-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Mon arsenal de compétences
            </div>
            <h1 className="hero-title">
              Mes <span className="hero-name">compétences</span>
            </h1>
            <p className="hero-desc">
              Gérez vos savoir-faire, ajoutez vos compétences techniques et comportementales
            </p>
            <div className="hero-buttons">
              <button onClick={() => setShowAddCompetenceModal(true)} className="hero-btn hero-btn-primary">
                <i className="fas fa-plus-circle"></i> Ajouter une compétence
              </button>
              <Link to="/profile" className="hero-btn hero-btn-secondary">
                <i className="fas fa-user-edit"></i> Compléter mon profil
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-card-glass">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Compétences</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.expert}</div>
                <div className="stat-label">Expert</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.avance}</div>
                <div className="stat-label">Avancé</div>
              </div>
              <div className="stat-card-glass">
                <div className="stat-number">{stats.intermediaire}</div>
                <div className="stat-label">Intermédiaire</div>
              </div>
            </div>
          </div>
          <div className="hero-avatar">
            <div className="avatar-wrapper">
              <div className="avatar-ring"></div>
              <div className="avatar-circle">
                {randomAvatar ? (
                  <img src={randomAvatar} alt="Avatar compétences" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-initials">
                    <i className="fas fa-code"></i>
                  </div>
                )}
                <div className="avatar-badge">
                  <i className="fas fa-rocket"></i>
                </div>
              </div>
            </div>
            <div className="hero-quote">
              <i className="fas fa-quote-left"></i> “Les compétences sont la clé de votre employabilité”
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS GRID ========== */}
      <div className="stats-grid">
        <div className="stat-card-premium">
          <div className="stat-icon-premium"><i className="fas fa-code"></i></div>
          <div className="stat-number-premium">{stats.total}</div>
          <div className="stat-label-premium">Compétences totales</div>
        </div>
        <div className="stat-card-premium">
          <div className="stat-icon-premium"><i className="fas fa-crown"></i></div>
          <div className="stat-number-premium">{stats.expert}</div>
          <div className="stat-label-premium">Expert</div>
        </div>
        <div className="stat-card-premium">
          <div className="stat-icon-premium"><i className="fas fa-rocket"></i></div>
          <div className="stat-number-premium">{stats.avance}</div>
          <div className="stat-label-premium">Avancé</div>
        </div>
        <div className="stat-card-premium">
          <div className="stat-icon-premium"><i className="fas fa-chart-line"></i></div>
          <div className="stat-number-premium">{stats.intermediaire}</div>
          <div className="stat-label-premium">Intermédiaire</div>
        </div>
        <div className="stat-card-premium">
          <div className="stat-icon-premium"><i className="fas fa-seedling"></i></div>
          <div className="stat-number-premium">{stats.debutant}</div>
          <div className="stat-label-premium">Débutant</div>
        </div>
      </div>

      {/* ========== COMPÉTENCES SECTION AVEC SIDEBAR ========== */}
      {myComps.length === 0 ? (
        <div className="empty-state-premium" style={{ margin: '0 90px 60px' }}>
          <div className="empty-icon-premium">
            <i className="fas fa-code"></i>
          </div>
          <h3 className="empty-title-premium">Aucune compétence</h3>
          <p className="empty-desc-premium">Vous n'avez pas encore ajouté de compétences à votre profil.</p>
          <button onClick={() => setShowAddCompetenceModal(true)} className="btn-add-premium">
            <i className="fas fa-plus-circle"></i> Ajouter votre première compétence
          </button>
        </div>
      ) : (
        <>
          <div className="add-button-container">
            <button onClick={() => setShowAddCompetenceModal(true)} className="btn-add-premium">
              <i className="fas fa-plus-circle"></i> Ajouter une compétence
            </button>
          </div>
          
          <div className="competences-layout">
            {/* ========== SIDEBAR GAUCHE (avec compétences recommandées) ========== */}
            <div className="competences-sidebar">
              <div className="sidebar-card">
                <div className="sidebar-header">
                  <h3><i className="fas fa-chart-line"></i> Ma progression</h3>
                  <p>Suivi de votre montée en compétences</p>
                </div>
                <div className="sidebar-body">
                  <div className="stat-item">
                    <span className="stat-label-sidebar"><i className="fas fa-crown"></i> Compétences expert</span>
                    <span className="stat-value-sidebar">{stats.expert}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label-sidebar"><i className="fas fa-rocket"></i> Niveau avancé</span>
                    <span className="stat-value-sidebar">{stats.avance}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label-sidebar"><i className="fas fa-chart-line"></i> Intermédiaire</span>
                    <span className="stat-value-sidebar">{stats.intermediaire}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label-sidebar"><i className="fas fa-seedling"></i> Débutant</span>
                    <span className="stat-value-sidebar">{stats.debutant}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-label">
                      <span>Score de compétences</span>
                      <span>{Math.round((stats.expert * 100 + stats.avance * 75 + stats.intermediaire * 50 + stats.debutant * 25) / Math.max(1, stats.total))}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${Math.round((stats.expert * 100 + stats.avance * 75 + stats.intermediaire * 50 + stats.debutant * 25) / Math.max(1, stats.total))}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {myComps.length < allComps.length && (
                <div className="sidebar-card">
                  <div className="sidebar-header" style={{ background: 'linear-gradient(135deg, #1a0f0a, #2d1a0e)' }}>
                    <h3><i className="fas fa-plus-circle"></i> Compétences recommandées</h3>
                    <p>Ajoutez ces compétences pour booster votre profil</p>
                  </div>
                  <div className="sidebar-body">
                    <div className="sidebar-recommended-list">
                      {allComps.filter(c => !myComps.find(mc => mc.idCompetence === c.idCompetence)).slice(0, 5).map(comp => (
                        <div key={comp.idCompetence} className="sidebar-rec-item">
                          <div className="info">
                            <h4>{comp.nom}</h4>
                            <p>{comp.categorie || 'Compétence technique'}</p>
                          </div>
                          <button 
                            className="btn-add-rec"
                            onClick={() => {
                              setSelectedExistingCompetence(comp.idCompetence);
                              setTempNiveau('intermédiaire');
                              setShowAddCompetenceModal(true);
                            }}
                          >
                            <i className="fas fa-plus"></i> Ajouter
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ========== GRILLE DES COMPÉTENCES AVEC BOUTON MODIFIER ========== */}
            <div className="competences-main">
              <div className="competences-grid-premium">
                {myComps.map((comp, idx) => (
                  <div 
                    key={comp.idCompetence} 
                    className="competence-card-premium" 
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="competence-image-premium" style={{ backgroundImage: `url(${getImageForCompetence(comp.idCompetence)})` }}>
                      <div className="competence-badge-premium" style={{ background: getNiveauColor(comp.pivot?.niveau) }}>
                        <i className={getNiveauIcon(comp.pivot?.niveau)}></i> {getNiveauLabel(comp.pivot?.niveau)}
                      </div>
                    </div>
                    <div className="competence-content-premium">
                      <div className="competence-header-premium">
                        <h3 className="competence-title-premium" onClick={() => handleViewDetails(comp)}>{comp.nom}</h3>
                        <div className="card-actions-premium" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleEditNiveau(comp)} 
                            className="btn-edit-premium" 
                            title="Modifier le niveau"
                          >
                            <i className="fas fa-pen"></i>
                          </button>
                          <button 
                            onClick={() => handleRemove(comp.idCompetence)} 
                            className="btn-delete-premium" 
                            title="Supprimer"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                      <div className="competence-categorie-premium">
                        <i className="fas fa-folder"></i>
                        <span>{comp.categorie || 'Technique'}</span>
                      </div>
                      <div className="competence-footer-premium" onClick={() => handleViewDetails(comp)}>
                        <div className="niveau-badge-premium" style={{ background: `${getNiveauColor(comp.pivot?.niveau)}15`, color: getNiveauColor(comp.pivot?.niveau) }}>
                          <i className={getNiveauIcon(comp.pivot?.niveau)}></i>
                          {getNiveauLabel(comp.pivot?.niveau)}
                        </div>
                        <i className="fas fa-arrow-right" style={{ color: '#8B5A2B', fontSize: '14px' }}></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========== MODAL AJOUT COMPÉTENCE DESIGN PROFESSIONNEL ========== */}
      {showAddCompetenceModal && (
        <div className="modal-overlay" onClick={() => {
          if (!addingCompetence) {
            setShowAddCompetenceModal(false);
            setNewCompetence({ nom: '', categorie: '', niveau: 'intermédiaire' });
            setSelectedExistingCompetence(null);
            setTempNiveau('intermédiaire');
          }
        }}>
          <div className="modal-content-premium add-competence-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="modal-header-left">
                <div className="modal-header-icon">
                  <i className="fas fa-plus-circle"></i>
                </div>
                <div>
                  <h2>Ajouter une compétence</h2>
                  <p className="modal-header-subtitle">Enrichissez votre profil avec vos savoir-faire</p>
                </div>
              </div>
              <button 
                className="modal-close" 
                onClick={() => {
                  if (!addingCompetence) {
                    setShowAddCompetenceModal(false);
                    setNewCompetence({ nom: '', categorie: '', niveau: 'intermédiaire' });
                    setSelectedExistingCompetence(null);
                    setTempNiveau('intermédiaire');
                  }
                }}
                disabled={addingCompetence}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body-premium">
              <div className="section-existing-competence">
                <div className="section-header-comp">
                  <div className="section-header-left">
                    <div className="section-icon-badge">
                      <i className="fas fa-list-ul"></i>
                    </div>
                    <div>
                      <h4>Compétences existantes</h4>
                      <p>Choisissez une compétence déjà disponible dans la base</p>
                    </div>
                  </div>
                  <span className="section-badge-count">{allComps.filter(c => !myComps.some(mc => mc.idCompetence === c.idCompetence)).length} disponibles</span>
                </div>

                <div className="add-existing-competence-row">
                  <div className="add-existing-competence-fields">
                    <div className="field-wrapper">
                      <label className="field-label">
                        <i className="fas fa-search"></i>
                        <span>Compétence</span>
                      </label>
                      <select 
                        className="form-select-premium"
                        value={selectedExistingCompetence || ''}
                        onChange={(e) => setSelectedExistingCompetence(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Rechercher une compétence...</option>
                        {allComps
                          .filter(c => !myComps.some(mc => mc.idCompetence === c.idCompetence))
                          .map(c => (
                            <option key={c.idCompetence} value={c.idCompetence}>
                              {c.nom} <span className="option-category">• {c.categorie || 'Générale'}</span>
                            </option>
                          ))}
                      </select>
                    </div>
                    
                    <div className="field-wrapper">
                      <label className="field-label">
                        <i className="fas fa-level-up-alt"></i>
                        <span>Niveau</span>
                      </label>
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
                    </div>
                    
                    <button 
                      type="button" 
                      className="btn-add-existing-competence"
                      onClick={handleAddExistingCompetence}
                      disabled={!selectedExistingCompetence || addingCompetence}
                    >
                      <i className="fas fa-plus"></i>
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-divider">
                <span className="divider-line"></span>
                <span className="divider-text">
                  <i className="fas fa-plus-circle"></i>
                  OU
                </span>
                <span className="divider-line"></span>
              </div>

              <div className="section-new-competence">
                <div className="section-header-comp">
                  <div className="section-header-left">
                    <div className="section-icon-badge new">
                      <i className="fas fa-plus"></i>
                    </div>
                    <div>
                      <h4>Nouvelle compétence</h4>
                      <p>Créez une compétence personnalisée</p>
                    </div>
                  </div>
                  <span className="section-badge-count new">+ Ajouter</span>
                </div>

                <form onSubmit={handleAddCompetence} className="new-competence-form">
                  <div className="form-row-comp">
                    <div className="field-wrapper">
                      <label className="field-label">
                        <i className="fas fa-tag"></i>
                        <span>Nom de la compétence <span className="required">*</span></span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: React.js, Python, Gestion de projet..."
                        value={newCompetence.nom}
                        onChange={(e) => setNewCompetence({...newCompetence, nom: e.target.value})}
                        required
                        disabled={addingCompetence}
                        className="form-input-premium"
                      />
                    </div>
                  </div>

                  <div className="form-row-comp">
                    <div className="field-wrapper">
                      <label className="field-label">
                        <i className="fas fa-folder-open"></i>
                        <span>Catégorie <span className="required">*</span></span>
                      </label>
                      <select 
                        value={newCompetence.categorie} 
                        onChange={(e) => setNewCompetence({...newCompetence, categorie: e.target.value})}
                        disabled={addingCompetence}
                        required
                        className="form-select-premium"
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
                      <small className="field-hint">
                        <i className="fas fa-info-circle"></i> Choisissez la catégorie qui correspond le mieux à cette compétence
                      </small>
                    </div>
                  </div>

                  <div className="form-row-comp">
                    <div className="field-wrapper">
                      <label className="field-label">
                        <i className="fas fa-level-up-alt"></i>
                        <span>Votre niveau <span className="required">*</span></span>
                      </label>
                      <select 
                        value={newCompetence.niveau} 
                        onChange={(e) => setNewCompetence({...newCompetence, niveau: e.target.value})}
                        disabled={addingCompetence}
                        required
                        className="form-select-premium"
                      >
                        <option value="débutant">🟢 Débutant - Notions de base</option>
                        <option value="intermédiaire">🟡 Intermédiaire - Pratique régulière</option>
                        <option value="avancé">🟠 Avancé - Maîtrise confirmée</option>
                        <option value="expert">🔴 Expert - Expertise reconnue</option>
                      </select>
                      <small className="field-hint">
                        <i className="fas fa-info-circle"></i> Sélectionnez votre niveau de maîtrise pour cette compétence
                      </small>
                    </div>
                  </div>

                  <div className="modal-actions-premium">
                    <button 
                      type="button" 
                      className="btn-cancel-premium" 
                      onClick={() => {
                        if (!addingCompetence) {
                          setShowAddCompetenceModal(false);
                          setNewCompetence({ nom: '', categorie: '', niveau: 'intermédiaire' });
                          setSelectedExistingCompetence(null);
                          setTempNiveau('intermédiaire');
                        }
                      }}
                      disabled={addingCompetence}
                    >
                      <i className="fas fa-times"></i> Annuler
                    </button>
                    <button type="submit" className="btn-submit-premium" disabled={addingCompetence}>
                      {addingCompetence ? (
                        <><i className="fas fa-spinner fa-spin"></i> Ajout en cours...</>
                      ) : (
                        <><i className="fas fa-check-circle"></i> Ajouter la compétence</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL MODIFIER LE NIVEAU ========== */}
      {showEditModal && editCompetence && (
        <div className="modal-overlay" onClick={() => {
          if (!editingCompetence) {
            setShowEditModal(false);
            setEditCompetence(null);
          }
        }}>
          <div className="modal-content-premium edit-niveau-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="modal-header-left">
                <div className="modal-header-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                  <i className="fas fa-pen"></i>
                </div>
                <div>
                  <h2>Modifier le niveau</h2>
                  <p className="modal-header-subtitle">
                    Compétence : <strong>{editCompetence.nom}</strong>
                  </p>
                </div>
              </div>
              <button 
                className="modal-close" 
                onClick={() => {
                  if (!editingCompetence) {
                    setShowEditModal(false);
                    setEditCompetence(null);
                  }
                }}
                disabled={editingCompetence}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body-premium">
              <div className="edit-niveau-content">
                {/* ========== APERÇU DE LA COMPÉTENCE ========== */}
                <div className="edit-competence-preview">
                  <div className="preview-icon" style={{ background: getNiveauColor(editCompetence.pivot?.niveau) }}>
                    <i className={getNiveauIcon(editCompetence.pivot?.niveau)}></i>
                  </div>
                  <div className="preview-info">
                    <h4>{editCompetence.nom}</h4>
                    <span className="preview-category">{editCompetence.categorie || 'Technique'}</span>
                  </div>
                  <div className="preview-current-level">
                    <span className="current-label">Niveau actuel</span>
                    <span className="current-value" style={{ color: getNiveauColor(editCompetence.pivot?.niveau) }}>
                      {getNiveauLabel(editCompetence.pivot?.niveau)}
                    </span>
                  </div>
                </div>

                {/* ========== SÉLECTEUR DE NIVEAU ========== */}
                <div className="edit-niveau-form">
                  <div className="field-wrapper">
                    <label className="field-label">
                      <i className="fas fa-level-up-alt"></i>
                      <span>Nouveau niveau</span>
                    </label>
                    <select 
                      value={editNiveau} 
                      onChange={(e) => setEditNiveau(e.target.value)}
                      disabled={editingCompetence}
                      className="form-select-premium"
                    >
                      <option value="débutant">🟢 Débutant - Notions de base</option>
                      <option value="intermédiaire">🟡 Intermédiaire - Pratique régulière</option>
                      <option value="avancé">🟠 Avancé - Maîtrise confirmée</option>
                      <option value="expert">🔴 Expert - Expertise reconnue</option>
                    </select>
                  </div>

                  {/* ========== NIVEAUX DE PROGRESSION ========== */}
                  <div className="niveau-progression">
                    <div className="progression-step">
                      <div className={`step-dot ${editNiveau === 'débutant' ? 'active' : ''}`}></div>
                      <span className={`step-label ${editNiveau === 'débutant' ? 'active' : ''}`}>Débutant</span>
                    </div>
                    <div className="progression-line"></div>
                    <div className="progression-step">
                      <div className={`step-dot ${editNiveau === 'intermédiaire' ? 'active' : ''}`}></div>
                      <span className={`step-label ${editNiveau === 'intermédiaire' ? 'active' : ''}`}>Intermédiaire</span>
                    </div>
                    <div className="progression-line"></div>
                    <div className="progression-step">
                      <div className={`step-dot ${editNiveau === 'avancé' ? 'active' : ''}`}></div>
                      <span className={`step-label ${editNiveau === 'avancé' ? 'active' : ''}`}>Avancé</span>
                    </div>
                    <div className="progression-line"></div>
                    <div className="progression-step">
                      <div className={`step-dot ${editNiveau === 'expert' ? 'active' : ''}`}></div>
                      <span className={`step-label ${editNiveau === 'expert' ? 'active' : ''}`}>Expert</span>
                    </div>
                  </div>
                </div>

                {/* ========== BOUTONS D'ACTION ========== */}
                <div className="modal-actions-premium">
                  <button 
                    type="button" 
                    className="btn-cancel-premium" 
                    onClick={() => {
                      if (!editingCompetence) {
                        setShowEditModal(false);
                        setEditCompetence(null);
                      }
                    }}
                    disabled={editingCompetence}
                  >
                    <i className="fas fa-times"></i> Annuler
                  </button>
                  <button 
                    type="button" 
                    className="btn-submit-premium" 
                    onClick={handleUpdateNiveau}
                    disabled={editingCompetence || editNiveau === editCompetence?.pivot?.niveau}
                    style={{ 
                      background: editNiveau === editCompetence?.pivot?.niveau 
                        ? 'linear-gradient(135deg, #94a3b8, #64748b)' 
                        : 'linear-gradient(135deg, #5D3A1A, #8B5A2B)'
                    }}
                  >
                    {editingCompetence ? (
                      <><i className="fas fa-spinner fa-spin"></i> Mise à jour...</>
                    ) : (
                      <><i className="fas fa-save"></i> Mettre à jour</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL DÉTAILS COMPÉTENCE ========== */}
      {showDetailModal && selectedCompetence && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content-premium detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-image" style={{ backgroundImage: `url(${getImageForCompetence(selectedCompetence.idCompetence)})` }}>
              <div className="detail-modal-badge">
                <i className={getNiveauIcon(selectedCompetence.pivot?.niveau)}></i> {getNiveauLabel(selectedCompetence.pivot?.niveau)}
              </div>
            </div>
            <div className="detail-content">
              <h2 className="detail-title">{selectedCompetence.nom}</h2>
              <div className="detail-subtitle">
                <i className="fas fa-tag"></i>
                <span>{selectedCompetence.categorie || 'Compétence technique'}</span>
              </div>
              
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <i className={getNiveauIcon(selectedCompetence.pivot?.niveau)}></i>
                  <div className="detail-info-label">Niveau</div>
                  <div className="detail-info-value" style={{ color: getNiveauColor(selectedCompetence.pivot?.niveau) }}>
                    {getNiveauLabel(selectedCompetence.pivot?.niveau)}
                  </div>
                </div>
                <div className="detail-info-item">
                  <i className="fas fa-chart-line"></i>
                  <div className="detail-info-label">Progression</div>
                  <div className="detail-info-value">
                    {selectedCompetence.pivot?.niveau === 'expert' ? '100%' :
                     selectedCompetence.pivot?.niveau === 'avancé' ? '75%' :
                     selectedCompetence.pivot?.niveau === 'intermédiaire' ? '50%' : '25%'}
                  </div>
                </div>
              </div>

              <div className="detail-description">
                <p><strong><i className="fas fa-info-circle"></i> À propos de cette compétence</strong></p>
                <p>La compétence <strong>{selectedCompetence.nom}</strong> est essentielle dans le domaine <strong>{selectedCompetence.categorie || 'informatique'}</strong>.</p>
                <p>Votre niveau <strong>{getNiveauLabel(selectedCompetence.pivot?.niveau)}</strong> vous permet de l'utiliser efficacement dans vos projets professionnels.</p>
              </div>

              <div className="detail-actions">
                <button className="btn-detail-delete" onClick={() => {
                  setShowDetailModal(false);
                  handleRemove(selectedCompetence.idCompetence);
                }}>
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

      {/* ========== SECTION POURQUOI VALORISER VOS COMPÉTENCES ? (5 cartes) ========== */}
      <section className="pourquoi-section">
        <div className="pourquoi-container">
          <div className="pourquoi-header">
            <span className="badge">🎯 Pourquoi valoriser vos compétences ?</span>
            <h2>Vos compétences, votre plus grand atout</h2>
            <p>Découvrez pourquoi il est essentiel de mettre en avant vos savoir-faire</p>
          </div>
          <div className="pourquoi-grid">
            <div className="pourquoi-card">
              <div className="icon"><i className="fas fa-bullseye"></i></div>
              <h4>Meilleures recommandations</h4>
              <p>Plus vous renseignez vos compétences, plus nos algorithmes vous proposent des offres pertinentes.</p>
            </div>
            <div className="pourquoi-card">
              <div className="icon"><i className="fas fa-rocket"></i></div>
              <h4>Démarquez-vous</h4>
              <p>Un profil riche en compétences attire l'attention des recruteurs et vous différencie des autres candidats.</p>
            </div>
            <div className="pourquoi-card">
              <div className="icon"><i className="fas fa-chart-line"></i></div>
              <h4>Suivez votre progression</h4>
              <p>Visualisez l'évolution de vos compétences et identifiez les domaines à développer pour atteindre vos objectifs.</p>
            </div>
            <div className="pourquoi-card">
              <div className="icon"><i className="fas fa-handshake"></i></div>
              <h4>Augmentez votre crédibilité</h4>
              <p>Des compétences bien documentées renforcent votre crédibilité et rassurent les recruteurs sur votre expertise.</p>
            </div>
            <div className="pourquoi-card">
              <div className="icon"><i className="fas fa-graduation-cap"></i></div>
              <h4>Accélérez votre carrière</h4>
              <p>Les entreprises recherchent des profils complets. Mettez en avant vos compétences pour décrocher le stage de vos rêves.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION COMPÉTENCES TENDANCE (8 cartes, marron) ========== */}
      <section className="trending-section">
        <div className="trending-container">
          <div className="trending-header">
            <span className="badge">🔥 Tendance</span>
            <h2>Compétences les plus recherchées</h2>
            <p>Les compétences qui font la différence auprès des recruteurs en 2024</p>
          </div>
          <div className="trending-grid">
            <div className="trending-item" style={{ background: '#5D3A1A' }}>
              <div className="icon"><i className="fab fa-python" style={{ color: '#ffd966' }}></i></div>
              <h4>Python</h4>
              <span>2 350 offres</span>
              <div className="trending-badge">Top 1</div>
            </div>
            <div className="trending-item" style={{ background: '#4A2A15' }}>
              <div className="icon"><i className="fab fa-react" style={{ color: '#ffd966' }}></i></div>
              <h4>React.js</h4>
              <span>1 890 offres</span>
              <div className="trending-badge">Top 2</div>
            </div>
            <div className="trending-item" style={{ background: '#3D1F0E' }}>
              <div className="icon"><i className="fas fa-database" style={{ color: '#ffd966' }}></i></div>
              <h4>SQL</h4>
              <span>1 720 offres</span>
              <div className="trending-badge">Top 3</div>
            </div>
            <div className="trending-item" style={{ background: '#5D3A1A' }}>
              <div className="icon"><i className="fas fa-cloud" style={{ color: '#ffd966' }}></i></div>
              <h4>Cloud AWS</h4>
              <span>1 450 offres</span>
              <div className="trending-badge">+15%</div>
            </div>
            <div className="trending-item" style={{ background: '#4A2A15' }}>
              <div className="icon"><i className="fas fa-robot" style={{ color: '#ffd966' }}></i></div>
              <h4>Machine Learning</h4>
              <span>1 280 offres</span>
              <div className="trending-badge">+22%</div>
            </div>
            <div className="trending-item" style={{ background: '#3D1F0E' }}>
              <div className="icon"><i className="fas fa-shield-alt" style={{ color: '#ffd966' }}></i></div>
              <h4>Cybersécurité</h4>
              <span>1 100 offres</span>
              <div className="trending-badge">+30%</div>
            </div>
            <div className="trending-item" style={{ background: '#5D3A1A' }}>
              <div className="icon"><i className="fab fa-java" style={{ color: '#ffd966' }}></i></div>
              <h4>Java</h4>
              <span>980 offres</span>
              <div className="trending-badge">Stable</div>
            </div>
            <div className="trending-item" style={{ background: '#4A2A15' }}>
              <div className="icon"><i className="fab fa-js" style={{ color: '#ffd966' }}></i></div>
              <h4>JavaScript</h4>
              <span>920 offres</span>
              <div className="trending-badge">+12%</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION SUGGESTIONS DE FORMATIONS (avec images de fond) ========== */}
      <section className="suggestions-section">
        <div className="suggestions-container">
          <div className="suggestions-header">
            <span className="badge">📚 Suggestions</span>
            <h2>Formations pour monter en compétences</h2>
            <p>Découvrez des formations recommandées pour renforcer vos compétences</p>
          </div>
          <div className="suggestions-grid">
            <div className="suggestion-card">
              <div 
                className="suggestion-card-bg" 
                style={{ 
                  backgroundImage: "url('/images/c1.png')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '180px'
                }}
              >
                <div className="suggestion-card-overlay"></div>
                <div className="suggestion-card-badge">
                  <i className="fas fa-cloud"></i> Cloud
                </div>
              </div>
              <div className="suggestion-body">
                <h4>Cloud Computing Masterclass</h4>
                <p>Maîtrisez les services AWS, Azure et GCP pour devenir un expert cloud.</p>
                <div className="skills-tags">
                  <span>AWS</span><span>Azure</span><span>GCP</span>
                </div>
                <Link to="#" className="suggestion-link">En savoir plus <i className="fas fa-arrow-right"></i></Link>
              </div>
            </div>

            <div className="suggestion-card">
              <div 
                className="suggestion-card-bg" 
                style={{ 
                  backgroundImage: "url('/images/c2.png')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '180px'
                }}
              >
                <div className="suggestion-card-overlay"></div>
                <div className="suggestion-card-badge">
                  <i className="fas fa-robot"></i> IA
                </div>
              </div>
              <div className="suggestion-body">
                <h4>Intelligence Artificielle & Deep Learning</h4>
                <p>Plongez dans le monde de l'IA et du Machine Learning avec des projets concrets.</p>
                <div className="skills-tags">
                  <span>Python</span><span>TensorFlow</span><span>PyTorch</span>
                </div>
                <Link to="#" className="suggestion-link">En savoir plus <i className="fas fa-arrow-right"></i></Link>
              </div>
            </div>

            <div className="suggestion-card">
              <div 
                className="suggestion-card-bg" 
                style={{ 
                  backgroundImage: "url('/images/c3.png')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '180px'
                }}
              >
                <div className="suggestion-card-overlay"></div>
                <div className="suggestion-card-badge">
                  <i className="fas fa-shield-alt"></i> Cyber
                </div>
              </div>
              <div className="suggestion-body">
                <h4>Cybersécurité & Ethical Hacking</h4>
                <p>Apprenez à protéger les systèmes et à anticiper les menaces.</p>
                <div className="skills-tags">
                  <span>Réseaux</span><span>Sécurité</span><span>Kali Linux</span>
                </div>
                <Link to="#" className="suggestion-link">En savoir plus <i className="fas fa-arrow-right"></i></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

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