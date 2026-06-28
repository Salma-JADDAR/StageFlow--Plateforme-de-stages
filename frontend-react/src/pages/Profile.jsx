import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [memberSince, setMemberSince] = useState('');
  const [lastLogin, setLastLogin] = useState('');

  // ========== NOTIFICATIONS ==========
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const [commonData, setCommonData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    ville: ''
  });

  const [studentData, setStudentData] = useState({
    photo_url: '',
    description: '',
    cv: null
  });
  const [hasCv, setHasCv] = useState(false);
  const [cvFileName, setCvFileName] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  const [recruiterData, setRecruiterData] = useState({
    entreprise_id: '',
    poste: '',
    entreprise_nom: ''
  });
  const [entreprises, setEntreprises] = useState([]);

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });

  const [stats, setStats] = useState({
    totalCandidatures: 0,
    acceptees: 0,
    enAttente: 0,
    totalOffres: 0,
    totalCandidaturesRecues: 0
  });

  const [activityData, setActivityData] = useState({
    lastLogin: '',
    profileCompleteness: 0,
    isProfileComplete: false,
    totalVisits: 0
  });

  const photoInputRef = useRef(null);
  const cvInputRef = useRef(null);

  // ========== ACHIEVEMENTS ==========
  const [achievements, setAchievements] = useState([
    {
      id: 1,
      titre: 'Stage validé',
      description: 'Premier stage validé avec succès',
      icon: 'fas fa-trophy',
      color: '#ffd700',
      date: '2024-06-01'
    },
    {
      id: 2,
      titre: 'Candidatures actives',
      description: 'Plus de 5 candidatures envoyées',
      icon: 'fas fa-paper-plane',
      color: '#3b82f6',
      date: '2024-05-15'
    },
    {
      id: 3,
      titre: 'Profil complet',
      description: 'Profil complété à 100%',
      icon: 'fas fa-check-circle',
      color: '#10b981',
      date: '2024-04-20'
    },
    {
      id: 4,
      titre: 'Première candidature',
      description: 'Première candidature envoyée',
      icon: 'fas fa-star',
      color: '#8B5A2B',
      date: '2024-03-10'
    }
  ]);

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const urlParams = new URLSearchParams(location.search);
        let timestamp = urlParams.get('t');
        if (!timestamp) timestamp = Date.now();

        setCommonData({
          nom: user?.nom || '',
          prenom: user?.prenom || '',
          email: user?.email || '',
          telephone: user?.telephone || '',
          ville: user?.ville || ''
        });

        setLastLogin(user?.dernierAcces || '');

        if (user?.role === 'etudiant') {
          const res = await api.get(`/etudiant/profile?t=${timestamp}`);
          const profile = res.data;
          const photoUrl = profile.photo || null;

          setStudentData({
            photo_url: photoUrl,
            description: profile.description || '',
            cv: null
          });
          setPhotoPreview(photoUrl);
          setHasCv(!!profile.cv);

          setCommonData(prev => ({
            ...prev,
            telephone: profile.telephone || prev.telephone,
            ville: profile.ville || prev.ville,
          }));

          setMemberSince(profile.created_at || user?.created_at || '');

          try {
            const candidaturesRes = await api.get(`/etudiant/mes-candidatures?t=${timestamp}`);
            let candidatures = Array.isArray(candidaturesRes.data) ? candidaturesRes.data : [];
            const acceptees = candidatures.filter(c => c.statut === 'acceptée').length;
            const enAttente = candidatures.filter(c => c.statut === 'en_attente').length;
            setStats({
              totalCandidatures: candidatures.length,
              acceptees,
              enAttente,
              totalOffres: 0,
              totalCandidaturesRecues: 0
            });

            let completeness = 0;
            if (commonData.nom && commonData.prenom) completeness += 20;
            if (commonData.email) completeness += 20;
            if (profile.telephone) completeness += 15;
            if (profile.ville) completeness += 15;
            if (profile.photo) completeness += 15;
            if (profile.description) completeness += 15;
            if (profile.cv) completeness += 20;
            completeness = Math.min(completeness, 100);

            setActivityData({
              lastLogin: user?.dernierAcces || '',
              profileCompleteness: completeness,
              isProfileComplete: completeness >= 80,
              totalVisits: Math.floor(Math.random() * 50) + 5
            });

          } catch (err) {
            console.error('Erreur chargement candidatures:', err);
          }

        } else if (user?.role === 'recruteur') {
          try {
            const res = await api.get(`/recruteur/profile?t=${timestamp}`);
            const recruiter = res.data;
            
            setRecruiterData({
              entreprise_id: recruiter.entreprise_id || '',
              poste: recruiter.poste || '',
              entreprise_nom: recruiter.entreprise_nom || ''
            });

            try {
              const entrepriseRes = await api.get(`/recruteur/entreprise?t=${timestamp}`);
              const entreprise = entrepriseRes.data;
              
              setCommonData(prev => ({
                ...prev,
                telephone: entreprise.telephone || prev.telephone,
                ville: entreprise.ville || prev.ville,
              }));
              
              if (entreprise.logo) {
                setPhotoPreview(entreprise.logo);
              }
              
            } catch (err) {
              console.error('Erreur chargement entreprise:', err);
            }

            try {
              const entreprisesRes = await api.get(`/entreprises?t=${timestamp}`);
              setEntreprises(entreprisesRes.data || []);
            } catch (err) {
              console.error('Erreur chargement entreprises:', err);
              setEntreprises([]);
            }

            try {
              const offresRes = await api.get(`/recruteur/offres?t=${timestamp}`);
              const offres = offresRes.data.data || offresRes.data || [];
              const totalOffres = offres.length;

              const candidaturesRes = await api.get(`/recruteur/candidatures?t=${timestamp}`);
              const candidatures = candidaturesRes.data.data || candidaturesRes.data || [];
              const totalCandidaturesRecues = candidatures.length;

              setStats({
                totalCandidatures: 0,
                acceptees: 0,
                enAttente: 0,
                totalOffres,
                totalCandidaturesRecues
              });

            } catch (err) {
              console.error('Erreur chargement stats recruteur:', err);
            }

          } catch (err) {
            console.error('Erreur chargement profil recruteur:', err);
            toast.error('Erreur chargement profil recruteur');
          }

          setMemberSince(user?.created_at || '');
          
          let completeness = 30;
          if (recruiterData.entreprise_id) completeness += 20;
          if (recruiterData.poste) completeness += 15;
          if (commonData.telephone) completeness += 15;
          if (commonData.ville) completeness += 20;
          completeness = Math.min(completeness, 100);

          setActivityData({
            lastLogin: user?.dernierAcces || '',
            profileCompleteness: completeness,
            isProfileComplete: completeness >= 80,
            totalVisits: Math.floor(Math.random() * 30) + 5
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Erreur chargement profil');
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchProfile();
      fetchNotifications();
    }

    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [user, location.search]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCommonChange = (e) => {
    setCommonData({ ...commonData, [e.target.name]: e.target.value });
  };

  const handleStudentChange = (e) => {
    setStudentData({ ...studentData, [e.target.name]: e.target.value });
  };

  const handleRecruiterChange = (e) => {
    setRecruiterData({ ...recruiterData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
    uploadPhoto(file);
  };

  const uploadPhoto = async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    try {
      await api.post('/upload/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Photo mise à jour');
      await refreshProfileData();
    } catch (err) {
      toast.error('Erreur upload photo');
      console.error(err);
    }
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStudentData({ ...studentData, cv: file });
    setCvFileName(file.name);
    uploadCV(file);
  };

  const uploadCV = async (file) => {
    const formData = new FormData();
    formData.append('cv', file);
    try {
      await api.post('/upload/cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('CV téléchargé');
      window.location.reload();
    } catch (err) {
      toast.error('Erreur upload CV');
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const userResponse = await api.put('/user', {
        nom: commonData.nom,
        prenom: commonData.prenom,
        email: commonData.email
      });

      if (userResponse.data) {
        // Mettre à jour l'utilisateur dans le contexte
        // Note: Vous devrez peut-être ajouter cette fonction à votre AuthContext
        // updateUser({
        //   nom: commonData.nom,
        //   prenom: commonData.prenom,
        //   email: commonData.email
        // });
      }

      if (user?.role === 'etudiant') {
        await api.put('/etudiant/profile', {
          telephone: commonData.telephone,
          ville: commonData.ville,
          description: studentData.description
        });
        toast.success('Profil étudiant mis à jour');
      } else if (user?.role === 'recruteur') {
        await api.put('/recruteur/profile', {
          entreprise_id: recruiterData.entreprise_id,
          poste: recruiterData.poste
        });
        toast.success('Profil recruteur mis à jour');
      }

      toast.success('Profil mis à jour avec succès');
      await refreshProfileData();
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const refreshProfileData = async () => {
    try {
      const urlParams = new URLSearchParams(location.search);
      let timestamp = urlParams.get('t');
      if (!timestamp) timestamp = Date.now();

      setCommonData(prev => ({
        ...prev,
        nom: user?.nom || '',
        prenom: user?.prenom || '',
        email: user?.email || '',
      }));

      if (user?.role === 'etudiant') {
        const res = await api.get(`/etudiant/profile?t=${timestamp}`);
        const profile = res.data;
        
        setCommonData(prev => ({
          ...prev,
          telephone: profile.telephone || prev.telephone,
          ville: profile.ville || prev.ville,
        }));
        
        setStudentData(prev => ({
          ...prev,
          description: profile.description || '',
        }));
        
        setPhotoPreview(profile.photo || null);
        setHasCv(!!profile.cv);
        
      } else if (user?.role === 'recruteur') {
        const res = await api.get(`/recruteur/profile?t=${timestamp}`);
        const recruiter = res.data;
        
        setRecruiterData({
          entreprise_id: recruiter.entreprise_id || '',
          poste: recruiter.poste || '',
          entreprise_nom: recruiter.entreprise_nom || ''
        });
        
        try {
          const entrepriseRes = await api.get(`/recruteur/entreprise?t=${timestamp}`);
          const entreprise = entrepriseRes.data;
          
          setCommonData(prev => ({
            ...prev,
            telephone: entreprise.telephone || prev.telephone,
            ville: entreprise.ville || prev.ville,
          }));
          
          if (entreprise.logo) {
            setPhotoPreview(entreprise.logo);
          }
        } catch (err) {
          console.error('Erreur chargement entreprise:', err);
        }
      }
    } catch (err) {
      console.error('Erreur refresh profil:', err);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setUpdating(true);
    try {
      await api.put('/user/password', {
        current_password: passwordData.current_password,
        password: passwordData.password,
        password_confirmation: passwordData.password_confirmation
      });
      toast.success('Mot de passe modifié');
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
      
      // await refreshUser();
      await refreshProfileData();
      
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadCV = async () => {
    try {
      const res = await api.get('/etudiant/cv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cv.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('CV non trouvé');
    }
  };

  const handleDeleteCV = async () => {
    if (!confirm('Supprimer votre CV ?')) return;
    try {
      await api.delete('/etudiant/cv');
      toast.success('CV supprimé');
      window.location.reload();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
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
          <p className="mt-6 text-gray-600 font-medium">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <style>{`
        /* ========== STYLES GLOBAUX ========== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .profile-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
          color: #1a1a1a;
          overflow-x: hidden;
          width: 100%;
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

        /* ========== NAV LINKS - CACHÉS POUR ADMIN ========== */
        .nav-links {
          display: flex;
          gap: 32px;
        }
        
        /* 🔥 CACHER LES LIENS POUR LES ADMINISTRATEURS */
        .nav-links.admin-hidden {
          display: none !important;
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

        /* ========== CONTAINER PRINCIPAL ========== */
        .profile-container {
          max-width: 1280px;
          width: 92%;
          margin: 100px auto 60px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 28px;
        }

        /* ========== CARTES ========== */
        .profile-card {
          background: white;
          border-radius: 28px;
          padding: 28px 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .profile-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
        }
        .profile-card .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eef2f0;
        }
        .profile-card .card-header .card-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          flex-shrink: 0;
        }
        .profile-card .card-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }
        .profile-card .card-header .card-badge {
          margin-left: auto;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 30px;
          background: #fef3e8;
          color: #8B5A2B;
        }

        /* ========== CARTE PROFIL AVEC IMAGE DE FOND ========== */
        .profile-card-edit {
          position: relative;
          overflow: hidden;
          background: transparent;
          border: none;
          padding: 0;
          min-height: 420px;
        }

        .profile-card-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/profil.png');
          background-size: cover;
          background-position: center;
          z-index: 0;
          transition: transform 0.5s ease;
        }

        .profile-card-edit:hover .profile-card-bg {
          transform: scale(1.03);
        }

        .profile-card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.7) 100%);
          z-index: 1;
        }

        .profile-card-edit .card-header {
          position: relative;
          z-index: 2;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          padding: 20px 24px 16px;
          margin-bottom: 0;
        }

        .profile-card-edit .card-header h3 {
          color: white;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .profile-card-edit .card-header .card-icon {
          background: rgba(255, 255, 255, 0.15) !important;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .profile-card-edit .card-header .card-badge {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        /* ========== FORMULAIRE D'ÉDITION DU PROFIL ========== */
        .profile-edit-form {
          position: relative;
          z-index: 2;
          padding: 20px 24px 28px;
        }

        .profile-edit-layout {
          display: flex;
          gap: 28px;
          align-items: flex-start;
        }

        .profile-edit-avatar {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 140px;
          flex-shrink: 0;
        }

        .avatar-upload-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .avatar-large-edit {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .avatar-upload-wrapper:hover .avatar-large-edit {
          border-color: #ffd966;
          transform: scale(1.02);
        }

        .avatar-large-edit img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-large-edit i {
          font-size: 56px;
          color: rgba(255, 255, 255, 0.6);
        }

        .avatar-upload-btn {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border: 2px solid white;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .avatar-upload-btn:hover {
          transform: scale(1.1);
          background: linear-gradient(135deg, #8B5A2B, #ffd966);
        }

        .profile-name-edit {
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin-top: 12px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .profile-role-edit {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          padding: 4px 16px;
          border-radius: 30px;
          margin-top: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .profile-edit-fields {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .edit-row {
          display: flex;
          gap: 16px;
        }

        .edit-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .edit-group label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .edit-group label i {
          font-size: 12px;
          color: #ffd966;
        }

        .edit-group input,
        .edit-group select,
        .edit-group textarea {
          padding: 10px 14px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          color: white;
          transition: all 0.3s ease;
          width: 100%;
        }

        .edit-group input::placeholder,
        .edit-group textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .edit-group input:focus,
        .edit-group select:focus,
        .edit-group textarea:focus {
          outline: none;
          border-color: #ffd966;
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 3px rgba(255, 217, 102, 0.1);
        }

        .edit-group select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          cursor: pointer;
        }

        .edit-group select option {
          background: #1a1a1a;
          color: white;
        }

        .edit-group textarea {
          resize: vertical;
          min-height: 60px;
        }

        .btn-save-profile {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #ffd966, #f59e0b);
          color: #1a1a1a;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 4px;
        }

        .btn-save-profile:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 217, 102, 0.3);
          gap: 14px;
        }

        .btn-save-profile:disabled {
          opacity: 0.6;
          transform: none;
        }

        /* ========== STATISTIQUES DASHBOARD AVEC GRAND CERCLE ========== */
        .stats-dashboard {
          display: flex;
          gap: 24px;
          align-items: center;
          padding: 8px 0;
        }

        .stats-main-circle {
          flex-shrink: 0;
          width: 140px;
          height: 140px;
          position: relative;
        }

        .stats-main-circle svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .stats-main-circle .circle-bg {
          fill: none;
          stroke: #eef2f0;
          stroke-width: 10;
        }

        .stats-main-circle .circle-fill {
          fill: none;
          stroke-width: 10;
          stroke-linecap: round;
          transition: stroke-dashoffset 1.5s ease;
        }

        .stats-main-circle .circle-center-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .stats-main-circle .circle-center-text .big-number {
          display: block;
          font-size: 32px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1;
        }

        .stats-main-circle .circle-center-text .big-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .stats-metrics {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .stats-metric {
          background: #f8fafc;
          border-radius: 16px;
          padding: 14px 16px;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .stats-metric:hover {
          background: #fef3e8;
          border-color: #8B5A2B;
          transform: translateY(-2px);
        }

        .stats-metric .metric-value {
          font-size: 22px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.2;
        }

        .stats-metric .metric-label {
          font-size: 11px;
          font-weight: 600;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .stats-metric .metric-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
          padding: 2px 10px;
          border-radius: 20px;
        }

        .stats-metric .metric-trend.positive {
          background: #f0fdf4;
          color: #10b981;
        }

        .stats-metric .metric-trend.negative {
          background: #fee2e2;
          color: #dc2626;
        }

        .stats-metric .metric-trend.neutral {
          background: #fef3c7;
          color: #92400e;
        }

        .stats-metric .metric-trend i {
          font-size: 10px;
        }

        .metric-color-1 .metric-value { color: #8B5A2B; }
        .metric-color-2 .metric-value { color: #10b981; }
        .metric-color-3 .metric-value { color: #3b82f6; }
        .metric-color-4 .metric-value { color: #f59e0b; }

        /* ========== ACTIVITÉ ========== */
        .activity-card .card-header {
          margin-bottom: 20px;
        }

        .activity-dashboard {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .activity-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .activity-metric {
          background: #f8fafc;
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .activity-metric:hover {
          background: #fef3e8;
          border-color: #8B5A2B;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          flex-shrink: 0;
        }

        .metric-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .metric-value {
          font-size: 22px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.2;
        }

        .metric-label {
          font-size: 12px;
          font-weight: 500;
          color: #6c757d;
        }

        .metric-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 10px;
          border-radius: 20px;
          margin-top: 2px;
          width: fit-content;
        }

        .metric-trend.positive {
          background: #f0fdf4;
          color: #10b981;
        }

        .metric-trend.negative {
          background: #fee2e2;
          color: #dc2626;
        }

        .metric-trend.neutral {
          background: #fef3c7;
          color: #92400e;
        }

        .metric-trend i {
          font-size: 10px;
        }

        .activity-chart {
          background: #f8fafc;
          border-radius: 16px;
          padding: 20px 24px;
          border: 1px solid #eef2f0;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .chart-header span:first-child {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .chart-days {
          font-size: 11px;
          color: #94a3b8;
          background: #f1f5f9;
          padding: 4px 14px;
          border-radius: 30px;
        }

        .chart-bars {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 230px;
          gap: 10px;
          padding: 0 4px;
        }

        .chart-bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          height: 100%;
          justify-content: flex-end;
        }

        .chart-bar {
          width: 100%;
          max-width: 50px;
          background: linear-gradient(180deg, #8B5A2B, #5D3A1A);
          border-radius: 8px 8px 4px 4px;
          position: relative;
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-height: 200px;
          box-shadow: 0 2px 8px rgba(139, 90, 43, 0.15);
        }

        .chart-bar-wrapper:hover .chart-bar {
          transform: scaleY(1.08);
          transform-origin: bottom;
          box-shadow: 0 4px 16px rgba(139, 90, 43, 0.25);
        }

        .chart-bar .bar-value {
          position: absolute;
          top: -22px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          font-weight: 700;
          color: #1a1a1a;
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.3s ease;
          background: white;
          padding: 2px 8px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          white-space: nowrap;
        }

        .chart-bar-wrapper:hover .bar-value {
          opacity: 1;
          transform: translateX(-50%) translateY(-4px);
        }

        .bar-label {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .chart-bar-wrapper:nth-child(1) .chart-bar { background: linear-gradient(180deg, #8B5A2B, #5D3A1A); }
        .chart-bar-wrapper:nth-child(2) .chart-bar { background: linear-gradient(180deg, #6B4A2B, #4A3A1A); }
        .chart-bar-wrapper:nth-child(3) .chart-bar { background: linear-gradient(180deg, #9B6A3B, #6B4A2B); }
        .chart-bar-wrapper:nth-child(4) .chart-bar { background: linear-gradient(180deg, #AB7A4B, #7B5A3B); }
        .chart-bar-wrapper:nth-child(5) .chart-bar { background: linear-gradient(180deg, #8B5A2B, #5D3A1A); }
        .chart-bar-wrapper:nth-child(6) .chart-bar { background: linear-gradient(180deg, #7B4A2B, #4A2A1A); }
        .chart-bar-wrapper:nth-child(7) .chart-bar { background: linear-gradient(180deg, #9B7A4B, #6B4A2B); }

        @media (max-width: 700px) {
          .chart-bars {
            height: 130px;
            gap: 6px;
          }
          .chart-bar {
            max-width: 24px;
          }
          .activity-chart {
            padding: 16px;
          }
        }

        @media (max-width: 480px) {
          .chart-bars {
            height: 100px;
            gap: 4px;
          }
          .chart-bar {
            max-width: 20px;
          }
          .chart-bar .bar-value {
            font-size: 9px;
            top: -18px;
            padding: 1px 6px;
          }
          .bar-label {
            font-size: 9px;
          }
        }

        @media (max-width: 1000px) {
          .activity-metrics {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 700px) {
          .activity-metrics {
            grid-template-columns: 1fr;
          }
          .chart-bars {
            height: 80px;
          }
          .activity-metric {
            padding: 14px 16px;
          }
          .metric-value {
            font-size: 18px;
          }
        }

        /* ========== STATUS BADGE ========== */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-badge.active {
          background: #f0fdf4;
          color: #10b981;
        }
        .status-badge.inactive {
          background: #fee2e2;
          color: #dc2626;
        }
        .status-badge .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }
        .status-badge.active .dot { background: #10b981; }
        .status-badge.inactive .dot { background: #dc2626; }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        /* ========== PROGRESS BAR ========== */
        .progress-bar-bg {
          width: 100%;
          height: 6px;
          background: #eef2f0;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 12px;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 10px;
          background: linear-gradient(90deg, #5D3A1A, #8B5A2B, #ffd966);
          transition: width 1s ease;
        }

        /* ========== SECURITE & CONSEILS ========== */
        .security-card {
          position: relative;
          overflow: hidden;
          background: transparent;
          border: none;
          padding: 0;
          min-height: 500px;
        }

        .security-card-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/securi.png');
          background-size: cover;
          background-position: center;
          z-index: 0;
          transition: transform 0.5s ease;
        }

        .security-card:hover .security-card-bg {
          transform: scale(1.03);
        }

        .security-card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.8) 100%);
          z-index: 1;
        }

        .security-card .card-header {
          position: relative;
          z-index: 2;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 20px 24px 16px;
          margin-bottom: 0;
        }

        .security-card .card-header h3 {
          color: white;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .security-content {
          position: relative;
          z-index: 2;
          padding: 20px 24px 28px;
        }

        .security-section {
          margin-bottom: 20px;
        }

        .security-section-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .security-section-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .security-section-header h4 {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin: 0;
        }

        .security-section-header p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .security-form .security-form-group {
          margin-bottom: 14px;
        }

        .security-form .security-form-group label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .security-form .security-form-group label i {
          color: #ffd966;
          font-size: 12px;
        }

        .security-form .input-wrapper {
          position: relative;
        }

        .security-form .input-wrapper .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
          z-index: 1;
        }

        .security-form .input-wrapper input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
        }

        .security-form .input-wrapper input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .security-form .input-wrapper input:focus {
          outline: none;
          border-color: #ffd966;
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 3px rgba(255, 217, 102, 0.1);
        }

        .security-form-row {
          display: flex;
          gap: 16px;
        }

        .security-form-row .security-form-group {
          flex: 1;
        }

        .security-form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .show-password-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
        }

        .show-password-btn:hover {
          color: #ffd966;
          background: rgba(255, 217, 102, 0.1);
        }

        .btn-security-submit {
          padding: 12px 28px;
          background: linear-gradient(135deg, #ffd966, #f59e0b);
          color: #1a1a1a;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-security-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 217, 102, 0.3);
          gap: 14px;
        }

        .btn-security-submit:disabled {
          opacity: 0.6;
          transform: none;
          gap: 10px;
        }

        .security-divider {
          display: flex;
          align-items: center;
          margin: 16px 0 20px;
        }

        .security-divider::before,
        .security-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
        }

        .security-divider span {
          padding: 0 16px;
          color: rgba(255, 255, 255, 0.2);
        }

        .security-divider span i {
          font-size: 6px;
        }

        .security-tips-section {
          margin-top: 4px;
        }

        .security-tips-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .security-tips-header h4 {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin: 0;
        }

        .security-tips-header p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .security-tips-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .security-tip-item {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          min-height: 110px;
          background-size: cover;
          background-position: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .security-tip-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .tip-item-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.7) 100%);
          z-index: 0;
          transition: background 0.3s ease;
        }

        .security-tip-item:hover .tip-item-overlay {
          background: linear-gradient(135deg, rgba(139, 90, 43, 0.6) 0%, rgba(0, 0, 0, 0.7) 100%);
        }

        .tip-item-content {
          position: relative;
          z-index: 1;
          padding: 16px 18px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: white;
          height: 100%;
        }

        .tip-item-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: rgba(255, 217, 102, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255, 217, 102, 0.15);
        }

        .tip-item-icon i {
          font-size: 16px;
          color: #ffd966;
        }

        .tip-item-content strong {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: white;
          margin-bottom: 2px;
        }

        .tip-item-content p {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.4;
        }

        @media (max-width: 1000px) {
          .security-tips-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 700px) {
          .security-form-row {
            flex-direction: column;
            gap: 14px;
          }
          .security-form-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .show-password-btn {
            align-self: flex-start;
          }
          .security-tips-grid {
            grid-template-columns: 1fr;
          }
          .security-tip-item {
            min-height: 90px;
          }
          .security-content {
            padding: 16px;
          }
          .security-card .card-header {
            padding: 16px;
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

        /* ========== RESPONSIVE ========== */
        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .profile-container { grid-template-columns: 1fr; gap: 24px; width: 95%; margin-top: 80px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .stats-dashboard { flex-direction: column; align-items: center; }
          .stats-main-circle { width: 120px; height: 120px; }
          .stats-metrics { width: 100%; grid-template-columns: 1fr 1fr; }
          .activity-grid { grid-template-columns: repeat(2, 1fr); }
          .profile-edit-layout { flex-direction: column; align-items: center; }
          .profile-edit-avatar { min-width: auto; }
          .avatar-large-edit { width: 100px; height: 100px; }
          .avatar-upload-btn { width: 32px; height: 32px; font-size: 12px; }
          .profile-edit-fields { width: 100%; }
          .security-form .row-group { flex-direction: column; gap: 16px; }
        }
        @media (max-width: 700px) {
          .profile-container { padding: 0 10px; }
          .stats-metrics { grid-template-columns: 1fr; }
          .activity-grid { grid-template-columns: 1fr; }
          .profile-card { padding: 20px 16px; }
          .profile-card-edit .card-header { padding: 16px 16px 12px; }
          .profile-edit-form { padding: 16px; }
          .edit-row { flex-direction: column; gap: 12px; }
          .profile-name-edit { font-size: 18px; }
          .stats-main-circle { width: 100px; height: 100px; }
          .stats-main-circle .circle-center-text .big-number { font-size: 26px; }
        }
      `}</style>

      {/* ========== NAVBAR ========== */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="logo">
            <span>Stage<span>Flow</span></span>
          </Link>
          
          {/* 🔥 NAV LINKS - CACHÉS POUR ADMIN */}
          <div className={`nav-links ${user?.role === 'admin' ? 'admin-hidden' : ''}`}>
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
                  <Link to={getDashboardLink()}>
                    <i className="fas fa-tachometer-alt"></i> Tableau de bord
                  </Link>
                  <Link to="/profile" className="active"><i className="fas fa-user"></i> Mon profil</Link>
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
          {/* 🔥 MOBILE MENU - CACHÉ POUR ADMIN */}
          {user?.role !== 'admin' && (
            <>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#4a5568', padding: '12px', borderRadius: '12px' }}>Accueil</Link>
              <Link to="/offres" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#4a5568', padding: '12px', borderRadius: '12px' }}>Offres</Link>
            </>
          )}
          {user && (
            <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#4a5568', padding: '12px', borderRadius: '12px' }}>
              Tableau de bord
            </Link>
          )}
          {user?.role !== 'admin' && (
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#4a5568', padding: '12px', borderRadius: '12px' }}>À propos</Link>
          )}
          <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#8B5A2B', padding: '12px', borderRadius: '12px', background: '#fef3e8' }}>Mon profil</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="profile-container">
        {/* ========== CARTE 1 : MON PROFIL ========== */}
        <div className="profile-card profile-card-edit">
          <div className="profile-card-bg"></div>
          <div className="profile-card-overlay"></div>
          
          <div className="card-header">
            <div className="card-icon" style={{ background: 'linear-gradient(135deg, #5D3A1A, #8B5A2B)' }}>
              <i className="fas fa-user-edit"></i>
            </div>
            <h3 style={{ color: 'white' }}>Mon profil</h3>
            <span className="card-badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              {user?.role === 'etudiant' ? 'Étudiant' : user?.role === 'recruteur' ? 'Recruteur' : 'Admin'}
            </span>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="profile-edit-form">
            <div className="profile-edit-layout">
              <div className="profile-edit-avatar">
                <div className="avatar-upload-wrapper">
                  <div className="avatar-large-edit">
                    {user?.role === 'recruteur' ? (
                      photoPreview ? (
                        <img src={photoPreview} alt="Logo" onError={(e) => { e.target.src = '/images/default-company.png'; }} />
                      ) : (
                        <i className="fas fa-building"></i>
                      )
                    ) : (
                      photoPreview ? (
                        <img src={photoPreview} alt="Avatar" onError={(e) => { e.target.src = '/images/default-avatar.png'; }} />
                      ) : (
                        <i className="fas fa-user-circle"></i>
                      )
                    )}
                  </div>
                  <button type="button" className="avatar-upload-btn" onClick={() => photoInputRef.current.click()}>
                    <i className="fas fa-camera"></i>
                  </button>
                  <input type="file" ref={photoInputRef} accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </div>
                <div className="profile-name-edit">{commonData.prenom} {commonData.nom}</div>
                <div className="profile-role-edit">{user?.role === 'etudiant' ? '🎓 Étudiant' : user?.role === 'recruteur' ? '🏢 Recruteur' : '👑 Administrateur'}</div>
              </div>

              <div className="profile-edit-fields">
                <div className="edit-row">
                  <div className="edit-group">
                    <label><i className="fas fa-user"></i> Prénom</label>
                    <input type="text" name="prenom" value={commonData.prenom} onChange={handleCommonChange} required />
                  </div>
                  <div className="edit-group">
                    <label><i className="fas fa-user"></i> Nom</label>
                    <input type="text" name="nom" value={commonData.nom} onChange={handleCommonChange} required />
                  </div>
                </div>
                <div className="edit-group">
                  <label><i className="fas fa-envelope"></i> Email</label>
                  <input type="email" name="email" value={commonData.email} onChange={handleCommonChange} required />
                </div>
                {user?.role === 'etudiant' && (
                  <div className="edit-row">
                    <div className="edit-group">
                      <label><i className="fas fa-phone"></i> Téléphone</label>
                      <input type="tel" name="telephone" value={commonData.telephone} onChange={handleCommonChange} />
                    </div>
                    <div className="edit-group">
                      <label><i className="fas fa-map-marker-alt"></i> Ville</label>
                      <input type="text" name="ville" value={commonData.ville} onChange={handleCommonChange} />
                    </div>
                  </div>
                )}
                {user?.role === 'recruteur' && (
                  <div className="edit-row">
                    <div className="edit-group">
                      <label><i className="fas fa-building"></i> Entreprise</label>
                      <select name="entreprise_id" value={recruiterData.entreprise_id} onChange={handleRecruiterChange}>
                        <option value="">Sélectionnez</option>
                        {entreprises.map(ent => (
                          <option key={ent.idEntreprise} value={ent.idEntreprise}>{ent.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div className="edit-group">
                      <label><i className="fas fa-briefcase"></i> Poste</label>
                      <input type="text" name="poste" value={recruiterData.poste} onChange={handleRecruiterChange} placeholder="RH, Recruteur..." />
                    </div>
                  </div>
                )}
                {user?.role === 'etudiant' && (
                  <div className="edit-group">
                    <label><i className="fas fa-align-left"></i> Description</label>
                    <textarea name="description" rows="2" value={studentData.description} onChange={handleStudentChange} placeholder="Parlez de vous..." />
                  </div>
                )}
                <button type="submit" className="btn-save-profile" disabled={updating}>
                  {updating ? 'Enregistrement...' : <><i className="fas fa-save"></i> Enregistrer les modifications</>}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ========== CARTE 2 : STATISTIQUES DASHBOARD ========== */}
        <div className="profile-card stats-card">
          <div className="card-header">
            <div className="card-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <i className="fas fa-chart-pie"></i>
            </div>
            <h3>Statistiques</h3>
            <span className="card-badge">Taux & performances</span>
          </div>

          <div className="stats-dashboard">
            <div className="stats-main-circle">
              <svg viewBox="0 0 120 120">
                <circle className="circle-bg" cx="60" cy="60" r="50" />
                <circle 
                  className="circle-fill" 
                  cx="60" 
                  cy="60" 
                  r="50"
                  style={{
                    strokeDasharray: 314.16,
                    strokeDashoffset: (() => {
                      let total = 0;
                      if (user?.role === 'etudiant') {
                        total = stats.totalCandidatures || 0;
                        return total > 0 ? 314.16 - Math.min((stats.acceptees / total) * 314.16, 314.16) : 314.16;
                      } else if (user?.role === 'recruteur') {
                        total = stats.totalOffres || 0;
                        return total > 0 ? 314.16 - Math.min((stats.totalCandidaturesRecues / (total * 5)) * 314.16, 314.16) : 314.16;
                      } else {
                        return 62.83;
                      }
                    })(),
                    stroke: '#8B5A2B'
                  }}
                />
              </svg>
              <div className="circle-center-text">
                <span className="big-number">
                  {user?.role === 'etudiant' ? 
                    (stats.totalCandidatures > 0 ? Math.round((stats.acceptees / stats.totalCandidatures) * 100) : 0) :
                    user?.role === 'recruteur' ? 
                      (stats.totalOffres > 0 ? Math.round((stats.totalCandidaturesRecues / (stats.totalOffres * 5)) * 100) : 0) :
                      68
                  }%
                </span>
                <span className="big-label">Taux global</span>
              </div>
            </div>

            <div className="stats-metrics">
              {user?.role === 'etudiant' ? (
                <>
                  <div className="stats-metric metric-color-1">
                    <div className="metric-value">{stats.totalCandidatures}</div>
                    <div className="metric-label">Candidatures totales</div>
                    <div className="metric-trend positive">
                      <i className="fas fa-arrow-up"></i> +12%
                    </div>
                  </div>
                  <div className="stats-metric metric-color-2">
                    <div className="metric-value">{stats.acceptees}</div>
                    <div className="metric-label">Acceptées</div>
                    <div className="metric-trend positive">
                      <i className="fas fa-arrow-up"></i> +8%
                    </div>
                  </div>
                  <div className="stats-metric metric-color-3">
                    <div className="metric-value">{stats.enAttente}</div>
                    <div className="metric-label">En attente</div>
                    <div className="metric-trend neutral">
                      <i className="fas fa-clock"></i> En cours
                    </div>
                  </div>
                  <div className="stats-metric metric-color-4">
                    <div className="metric-value">{stats.totalCandidatures > 0 ? Math.round((stats.acceptees / stats.totalCandidatures) * 100) : 0}%</div>
                    <div className="metric-label">Taux de réussite</div>
                    <div className="metric-trend positive">
                      <i className="fas fa-arrow-up"></i> +5%
                    </div>
                  </div>
                </>
              ) : user?.role === 'recruteur' ? (
                <>
                  <div className="stats-metric metric-color-1">
                    <div className="metric-value">{stats.totalOffres}</div>
                    <div className="metric-label">Offres publiées</div>
                    <div className="metric-trend positive">
                      <i className="fas fa-arrow-up"></i> +15%
                    </div>
                  </div>
                  <div className="stats-metric metric-color-2">
                    <div className="metric-value">{stats.totalCandidaturesRecues}</div>
                    <div className="metric-label">Candidatures reçues</div>
                    <div className="metric-trend positive">
                      <i className="fas fa-arrow-up"></i> +23%
                    </div>
                  </div>
                  <div className="stats-metric metric-color-3">
                    <div className="metric-value">{stats.totalOffres > 0 ? Math.round((stats.totalCandidaturesRecues / (stats.totalOffres * 5)) * 100) : 0}%</div>
                    <div className="metric-label">Taux de conversion</div>
                    <div className="metric-trend positive">
                      <i className="fas fa-arrow-up"></i> +5%
                    </div>
                  </div>
                  <div className="stats-metric metric-color-4">
                    <div className="metric-value">{stats.enAttente || 0}</div>
                    <div className="metric-label">En attente</div>
                    <div className="metric-trend neutral">
                      <i className="fas fa-minus"></i> Stable
                    </div>
                  </div>
                </>
              ) : (
                // Admin
                <>
                  <div className="stats-metric metric-color-1">
                    <div className="metric-value">42</div>
                    <div className="metric-label">Utilisateurs</div>
                    <div className="metric-trend positive"><i className="fas fa-arrow-up"></i> +8%</div>
                  </div>
                  <div className="stats-metric metric-color-2">
                    <div className="metric-value">18</div>
                    <div className="metric-label">Offres actives</div>
                    <div className="metric-trend positive"><i className="fas fa-arrow-up"></i> +12%</div>
                  </div>
                  <div className="stats-metric metric-color-3">
                    <div className="metric-value">5</div>
                    <div className="metric-label">Candidatures</div>
                    <div className="metric-trend neutral"><i className="fas fa-minus"></i> Stable</div>
                  </div>
                  <div className="stats-metric metric-color-4">
                    <div className="metric-value">68%</div>
                    <div className="metric-label">Taux d'activité</div>
                    <div className="metric-trend positive"><i className="fas fa-arrow-up"></i> +3%</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ========== CARTE 3 : ACTIVITÉ ========== */}
        <div className="profile-card activity-card">
          <div className="card-header">
            <div className="card-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <i className="fas fa-activity"></i>
            </div>
            <h3>Activité</h3>
            <div className={`status-badge ${activityData.isProfileComplete ? 'active' : 'inactive'}`}>
              <span className="dot"></span>
              {activityData.isProfileComplete ? 'En ligne' : 'Hors ligne'}
            </div>
          </div>

          <div className="activity-dashboard">
            <div className="activity-metrics">
              <div className="activity-metric">
                <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div className="metric-content">
                  <span className="metric-value" id="visits-count">{activityData.totalVisits || 0}</span>
                  <span className="metric-label">Visites totales</span>
                  <div className="metric-trend positive">
                    <i className="fas fa-arrow-up"></i> +12% ce mois
                  </div>
                </div>
              </div>

              <div className="activity-metric">
                <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #8B5A2B, #5D3A1A)' }}>
                  <i className="fas fa-clock"></i>
                </div>
                <div className="metric-content">
                  <span className="metric-value" style={{ fontSize: '14px' }}>
                    {lastLogin ? new Date(lastLogin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Jamais'}
                  </span>
                  <span className="metric-label">Dernière connexion</span>
                  <div className="metric-trend neutral">
                    <i className="fas fa-clock"></i> Il y a {lastLogin ? Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24)) : 0} jours
                  </div>
                </div>
              </div>

              <div className="activity-metric">
                <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <i className="fas fa-star"></i>
                </div>
                <div className="metric-content">
                  <span className="metric-value">{achievements.length}</span>
                  <span className="metric-label">Réalisations</span>
                  <div className="metric-trend positive">
                    <i className="fas fa-arrow-up"></i> +1 nouvelle
                  </div>
                </div>
              </div>
            </div>

            <div className="activity-chart">
              <div className="chart-header">
                <span>Activité hebdomadaire</span>
                <span className="chart-days">7 derniers jours</span>
              </div>
              <div className="chart-bars">
                {[4, 7, 3, 9, 6, 5, 8].map((value, index) => {
                  const max = 15;
                  const height = (value / max) * 140;
                  return (
                    <div key={index} className="chart-bar-wrapper">
                      <div className="chart-bar" style={{ height: `${height}px` }}>
                        <span className="bar-value">{value}</span>
                      </div>
                      <span className="bar-label">{['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ========== CARTE 4 : SÉCURITÉ & CONSEILS ========== */}
        <div className="profile-card security-card">
          <div className="security-card-bg"></div>
          <div className="security-card-overlay"></div>
          
          <div className="card-header">
            <div className="card-icon" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <i className="fas fa-shield-alt" style={{ color: '#ffd966' }}></i>
            </div>
            <h3 style={{ color: 'white' }}>Sécurité & Conseils</h3>
            <span className="card-badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              <i className="fas fa-check-circle"></i> Protégé
            </span>
          </div>

          <div className="security-content">
            <div className="security-section">
              <div className="security-section-header">
                <div className="security-section-icon" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <i className="fas fa-key" style={{ color: '#ffd966' }}></i>
                </div>
                <div>
                  <h4 style={{ color: 'white' }}>Changer mon mot de passe</h4>
                  <p style={{ color: 'rgba(255,255,255,0.7)' }}>Protégez votre compte avec un mot de passe fort</p>
                </div>
              </div>
              <form onSubmit={handleUpdatePassword} className="security-form">
                <div className="security-form-group">
                  <label style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <i className="fas fa-lock"></i> Mot de passe actuel
                  </label>
                  <div className="input-wrapper">
                    <i className="fas fa-lock input-icon"></i>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="current_password" 
                      value={passwordData.current_password} 
                      onChange={handlePasswordChange} 
                      required 
                      style={{ 
                        background: 'rgba(255,255,255,0.08)', 
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'white'
                      }}
                    />
                  </div>
                </div>
                <div className="security-form-row">
                  <div className="security-form-group">
                    <label style={{ color: 'rgba(255,255,255,0.8)' }}>
                      <i className="fas fa-key"></i> Nouveau mot de passe
                    </label>
                    <div className="input-wrapper">
                      <i className="fas fa-key input-icon"></i>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        name="password" 
                        value={passwordData.password} 
                        onChange={handlePasswordChange} 
                        required 
                        style={{ 
                          background: 'rgba(255,255,255,0.08)', 
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: 'white'
                        }}
                      />
                    </div>
                  </div>
                  <div className="security-form-group">
                    <label style={{ color: 'rgba(255,255,255,0.8)' }}>
                      <i className="fas fa-check-circle"></i> Confirmer
                    </label>
                    <div className="input-wrapper">
                      <i className="fas fa-check-circle input-icon"></i>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        name="password_confirmation" 
                        value={passwordData.password_confirmation} 
                        onChange={handlePasswordChange} 
                        required 
                        style={{ 
                          background: 'rgba(255,255,255,0.08)', 
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: 'white'
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="security-form-actions">
                  <button type="button" className="show-password-btn" onClick={() => setShowPassword(!showPassword)}>
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i> {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                  <button type="submit" className="btn-security-submit" disabled={updating}>
                    {updating ? (
                      <><i className="fas fa-spinner fa-spin"></i> Modification...</>
                    ) : (
                      <><i className="fas fa-shield-alt"></i> Mettre à jour</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="security-divider">
              <span><i className="fas fa-circle"></i></span>
            </div>

            <div className="security-tips-section">
              <div className="security-tips-header">
                <div className="security-section-icon" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <i className="fas fa-lightbulb" style={{ color: '#ffd966' }}></i>
                </div>
                <div>
                  <h4 style={{ color: 'white' }}>Conseils de sécurité</h4>
                  <p style={{ color: 'rgba(255,255,255,0.7)' }}>Optimisez la sécurité de votre compte</p>
                </div>
              </div>

              <div className="security-tips-grid">
                <div className="security-tip-item" style={{ backgroundImage: "url('/images/tip1.jpg')" }}>
                  <div className="tip-item-overlay"></div>
                  <div className="tip-item-content">
                    <div className="tip-item-icon"><i className="fas fa-key"></i></div>
                    <div>
                      <strong>Mot de passe fort</strong>
                      <p>Utilisez au moins 12 caractères avec des lettres, chiffres et symboles</p>
                    </div>
                  </div>
                </div>

                <div className="security-tip-item" style={{ backgroundImage: "url('/images/tip2.jpg')" }}>
                  <div className="tip-item-overlay"></div>
                  <div className="tip-item-content">
                    <div className="tip-item-icon"><i className="fas fa-shield-alt"></i></div>
                    <div>
                      <strong>Authentification 2FA</strong>
                      <p>Activez la double authentification pour plus de sécurité</p>
                    </div>
                  </div>
                </div>

                <div className="security-tip-item" style={{ backgroundImage: "url('/images/tip3.jpg')" }}>
                  <div className="tip-item-overlay"></div>
                  <div className="tip-item-content">
                    <div className="tip-item-icon"><i className="fas fa-envelope"></i></div>
                    <div>
                      <strong>Email vérifié</strong>
                      <p>Vérifiez votre email pour recevoir les alertes de sécurité</p>
                    </div>
                  </div>
                </div>

                <div className="security-tip-item" style={{ backgroundImage: "url('/images/tip4.jpg')" }}>
                  <div className="tip-item-overlay"></div>
                  <div className="tip-item-content">
                    <div className="tip-item-icon"><i className="fas fa-sign-out-alt"></i></div>
                    <div>
                      <strong>Déconnexion automatique</strong>
                      <p>Déconnectez-vous des appareils que vous n'utilisez plus</p>
                    </div>
                  </div>
                </div>
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