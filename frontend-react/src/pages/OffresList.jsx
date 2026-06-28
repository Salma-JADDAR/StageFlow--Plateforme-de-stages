import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

// ========== IMAGES POUR LES CARTES ==========
const baseImages = [
  '/images/do.png', '/images/do1.png', '/images/do2.png', '/images/do3.png',
  '/images/do4.png', '/images/do5.png', '/images/do6.png', '/images/do7.png',
  '/images/do8.png', '/images/do9.png', '/images/doo.png', '/images/doo1.png',
  '/images/doo2.png', '/images/doo3.png', '/images/doo4.png', '/images/doo5.png',
];

export default function OffresList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOffre, setSelectedOffre] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ========== ÉTATS POUR LES NOTIFICATIONS ==========
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    location: searchParams.get('location') || '',
    type: searchParams.get('type') || '',
    duration: searchParams.get('duration') || '',
    industry: searchParams.get('industry') || '',
    remote: searchParams.get('remote') === 'true',
    salary: searchParams.get('salary') || ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // ========== FONCTION POUR RÉCUPÉRER UNE IMAGE ==========
  const getImageForOffre = (id) => {
    const index = (id * 2) % baseImages.length;
    return baseImages[index];
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

  const fetchOffres = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.location) params.append('location', filters.location);
      if (filters.type) params.append('type', filters.type);
      if (filters.duration) params.append('duration', filters.duration);
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.remote) params.append('remote', 'true');
      if (filters.salary) params.append('salary', filters.salary);
      
      const res = await api.get(`/offres?${params.toString()}`);
      setOffres(res.data.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateURLAndFetch = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.keyword) params.append('keyword', newFilters.keyword);
    if (newFilters.location) params.append('location', newFilters.location);
    if (newFilters.type) params.append('type', newFilters.type);
    if (newFilters.duration) params.append('duration', newFilters.duration);
    if (newFilters.industry) params.append('industry', newFilters.industry);
    if (newFilters.remote) params.append('remote', 'true');
    if (newFilters.salary) params.append('salary', newFilters.salary);
    setSearchParams(params);
    setCurrentPage(1);
    fetchOffres();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateURLAndFetch(filters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURLAndFetch(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { 
      keyword: '', location: '', type: '', 
      duration: '', industry: '', remote: false, salary: '' 
    };
    setFilters(emptyFilters);
    setSearchParams({});
    setCurrentPage(1);
    fetchOffres();
  };

  useEffect(() => {
    const keyword = searchParams.get('keyword') || '';
    const location = searchParams.get('location') || '';
    const type = searchParams.get('type') || '';
    const duration = searchParams.get('duration') || '';
    const industry = searchParams.get('industry') || '';
    const remote = searchParams.get('remote') === 'true';
    const salary = searchParams.get('salary') || '';
    
    setFilters({ keyword, location, type, duration, industry, remote, salary });
    fetchOffres();
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const typeOptions = ['PFE', 'stage été', 'stage observation', 'Alternance'];
  const durationOptions = ['1-2 mois', '3-4 mois', '5-6 mois', '6+ mois'];
  const industryOptions = ['Tech & IT', 'Marketing & Com', 'Finance', 'Industrie', 'RH', 'R&D'];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOffres = offres.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(offres.length / itemsPerPage);

  return (
    <div className="offres-page">
      <style>{`
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

        .offres-page {
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

        /* ========== HERO OFFRES ========== */
        .hero-offres {
          position: relative;
          min-height: 850px;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding-top: 50px;
        }
        .hero-offres-bg-image {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/offres.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }
        .hero-offres-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(100deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.7) 100%);
          z-index: 1;
        }
        .hero-offres-container {
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
        .hero-offres-content { flex: 1; }
        .hero-offres-badge {
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
        .hero-offres-title {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 24px;
          color: white;
        }
        .hero-offres-highlight {
          background: linear-gradient(135deg, #ffd966, #ffb347);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-offres-desc {
          font-size: 16px;
          color: rgba(255,255,255,0.9);
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 500px;
        }
        .hero-offres-buttons {
          display: flex;
          gap: 16px;
          margin-bottom: 48px;
        }
        .btn-offres-primary {
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
        .btn-offres-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(93,58,26,0.3);
          gap: 15px;
        }
        .btn-offres-secondary {
          padding: 12px 28px;
          border: 2px solid white;
          border-radius: 50px;
          color: white;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.3s;
        }
        .btn-offres-secondary:hover { background: white; color: #8B5A2B; }
        .hero-offres-stats {
          display: flex;
          gap: 48px;
        }
        .stat-offres {
          display: flex;
          flex-direction: column;
        }
        .stat-number-offres {
          font-size: 28px;
          font-weight: 800;
          color: #ffd966;
        }
        .stat-label-offres {
          font-size: 13px;
          color: rgba(255,255,255,0.8);
        }
        .hero-offres-illustration {
          flex: 1;
          position: relative;
          height: 400px;
        }
        .floating-offres-card {
          position: absolute;
          background: white;
          border-radius: 16px;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          animation: float 3s ease-in-out infinite;
        }
        .floating-offres-card i { font-size: 18px; color: #8B5A2B; }
        .card-offres-1 { top: 5%; left: 0; animation-delay: 0s; }
        .card-offres-2 { top: 25%; right: 0; animation-delay: 0.5s; }
        .card-offres-3 { bottom: 15%; left: 5%; animation-delay: 1s; }
        .card-offres-4 { bottom: 30%; right: 15%; animation-delay: 1.5s; }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .illustration-offres-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(255,217,102,0.15) 0%, transparent 70%);
          border-radius: 50%;
        }
        .illustration-offres-circle-2 {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(255,217,102,0.08) 0%, transparent 70%);
          border-radius: 50%;
        }

        @media (max-width: 1000px) {
          .hero-offres-container { flex-direction: column; text-align: center; gap: 50px; }
          .hero-offres-desc { margin: 0 auto 32px; }
          .hero-offres-buttons { justify-content: center; }
          .hero-offres-stats { justify-content: center; }
        }
        @media (max-width: 700px) {
          .hero-offres-title { font-size: 32px; }
          .hero-offres-illustration { display: none; }
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
        }
        .search-field {
          flex: 1;
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
        .search-btn {
          background: linear-gradient(135deg, var(--primary-dark), var(--primary));
          color: white;
          border: none;
          padding: 16px 40px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s;
        }
        .search-btn:hover { transform: scale(1.02); gap: 14px; box-shadow: 0 8px 20px rgba(93, 58, 26, 0.3); }

        /* ========== FILTERS ========== */
        .filters-bar {
          max-width: 1280px;
          margin: 24px auto 0;
          padding: 0 32px;
        }
        .filters-container {
          background: white;
          border-radius: 20px;
          padding: 20px 24px;
          border: 1px solid var(--gray-200);
        }
        .filter-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .filter-chips {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .filter-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: var(--gray-100);
          border-radius: 40px;
          font-size: 13px;
          font-weight: 500;
          color: var(--gray-600);
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-chip:hover { background: var(--gray-200); }
        .filter-chip.active { background: var(--primary); color: white; }
        .filter-chip i { font-size: 12px; }
        .filter-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--primary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 40px;
        }
        .filter-toggle:hover { background: var(--gray-100); }
        .advanced-filters {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--gray-200);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .filter-group label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .filter-group select, .filter-group input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--gray-200);
          border-radius: 12px;
          font-size: 14px;
          background: white;
        }
        .active-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }
        .active-tag {
          background: #efe6d8;
          padding: 5px 14px;
          border-radius: 40px;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--primary-dark);
        }
        .clear-btn {
          background: none;
          border: none;
          color: var(--gray-600);
          font-size: 13px;
          cursor: pointer;
          padding: 5px 12px;
        }

        /* ========== RESULTS BAR ========== */
        .results-bar {
          max-width: 1280px;
          margin: 32px auto 24px;
          padding: 0 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .results-count {
          font-size: 14px;
          color: var(--gray-600);
        }
        .results-count strong {
          font-size: 20px;
          font-weight: 700;
          color: var(--gray-900);
        }
        .view-toggle {
          display: flex;
          gap: 8px;
          background: var(--gray-100);
          padding: 4px;
          border-radius: 12px;
        }
        .view-btn {
          padding: 8px 16px;
          background: transparent;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          color: var(--gray-600);
        }
        .view-btn.active {
          background: white;
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        /* ========== GRID VIEW AVEC IMAGES ========== */
        .jobs-grid {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }

        .job-card {
          background: transparent;
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #eef2f0;
          cursor: pointer;
          position: relative;
          animation: fadeInUp 0.5s ease forwards;
          height: 100%;
        }

        .job-card-bg {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 350px;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: flex-end;
        }

        .job-card-overlay {
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

        .job-card:hover .job-card-overlay {
          background: linear-gradient(180deg, 
            rgba(0, 0, 0, 0.05) 0%, 
            rgba(93, 58, 26, 0.3) 40%, 
            rgba(0, 0, 0, 0.9) 100%
          );
        }

        .job-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.25);
          border-color: transparent;
        }

        .job-card-content {
          position: relative;
          z-index: 1;
          padding: 24px;
          width: 100%;
          color: white;
        }

        .job-card-content .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .job-card-content .company-logo {
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

        .job-card:hover .company-logo {
          background: rgba(255, 217, 102, 0.2);
          transform: scale(1.05);
        }

        .job-card-content .job-badge {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(4px);
          padding: 5px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 700;
          color: #ffd966;
          border: 1px solid rgba(255, 217, 102, 0.2);
        }

        .job-card-content .job-title {
          font-size: 19px;
          font-weight: 700;
          color: white;
          margin: 8px 0 4px;
          line-height: 1.3;
          transition: color 0.2s;
        }

        .job-card:hover .job-title { color: #ffd966; }

        .job-card-content .company-name {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .job-card-content .company-name i { font-size: 12px; color: #ffd966; }

        .job-card-content .job-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          padding: 12px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          margin-bottom: 14px;
        }

        .job-card-content .job-meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }

        .job-card-content .job-meta-item i { color: #ffd966; width: 14px; font-size: 12px; }

        .job-card-content .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .job-card-content .salary {
          font-size: 14px;
          font-weight: 700;
          color: #34d399;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.15);
          padding: 6px 12px;
          border-radius: 30px;
          backdrop-filter: blur(4px);
        }

        .job-card-content .apply-link {
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

        .job-card:hover .apply-link {
          gap: 12px;
          background: rgba(255, 217, 102, 0.2);
          color: #ffe08c;
        }

        /* ========== LIST VIEW AVEC IMAGES ========== */
        .jobs-list {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .job-list-item {
          background: transparent;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          animation: fadeInUp 0.5s ease forwards;
          border: 1px solid #eef2f0;
        }

        .job-list-item:hover {
          border-color: transparent;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          transform: translateX(4px);
        }

        .list-bg-image {
          position: relative;
          width: 100%;
          background-size: cover;
          background-position: center;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 28px;
          flex-wrap: wrap;
          gap: 20px;
          min-height: 120px;
        }

        .list-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.3) 0%, 
            rgba(0, 0, 0, 0.7) 100%
          );
          z-index: 0;
          transition: background 0.3s ease;
        }

        .job-list-item:hover .list-overlay {
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.2) 0%, 
            rgba(93, 58, 26, 0.6) 100%
          );
        }

        .list-bg-image > * {
          position: relative;
          z-index: 1;
        }

        .list-info { flex: 1; }

        .list-header {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .list-logo {
          width: 52px;
          height: 52px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 22px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s;
        }

        .job-list-item:hover .list-logo { 
          background: rgba(255, 217, 102, 0.15);
          transform: scale(1.05); 
        }

        .list-title {
          font-size: 18px;
          font-weight: 700;
          color: white;
          transition: color 0.2s;
        }

        .job-list-item:hover .list-title { color: #ffd966; }

        .list-badge {
          background: rgba(255, 217, 102, 0.12);
          backdrop-filter: blur(4px);
          padding: 4px 12px;
          border-radius: 30px;
          font-size: 10px;
          font-weight: 700;
          color: #ffd966;
          border: 1px solid rgba(255, 217, 102, 0.15);
        }

        .list-company {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .list-company i { color: #ffd966; }

        .list-details {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .list-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }

        .list-detail i { color: #ffd966; font-size: 12px; width: 14px; }

        .list-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .list-salary {
          font-size: 16px;
          font-weight: 700;
          color: #34d399;
          white-space: nowrap;
          background: rgba(16, 185, 129, 0.15);
          padding: 6px 16px;
          border-radius: 40px;
          display: flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(4px);
        }

        .list-apply {
          background: rgba(255, 217, 102, 0.12);
          color: #ffd966;
          padding: 10px 24px;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s;
          border: 1px solid rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(4px);
        }

        .job-list-item:hover .list-apply {
          gap: 14px;
          background: rgba(255, 217, 102, 0.2);
          transform: scale(1.02);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ========== LOADING & EMPTY ========== */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 20px;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #eef2f0;
          border-top-color: #8B5A2B;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty-container {
          text-align: center;
          padding: 80px 40px;
          background: white;
          border-radius: 28px;
          border: 1px solid #eef2f0;
          max-width: 1280px;
          margin: 0 auto;
        }
        .empty-icon {
          width: 90px;
          height: 90px;
          background: #f8fafc;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .empty-icon i { font-size: 40px; color: #cbd5e1; }
        .empty-title { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .empty-subtitle { font-size: 14px; color: #64748b; margin-bottom: 24px; }

        /* ========== PAGINATION ========== */
        .pagination {
          max-width: 1280px;
          margin: 48px auto 0;
          padding: 0 32px 60px;
          display: flex;
          justify-content: center;
          gap: 8px;
        }
        .page-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--gray-200);
          background: white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        .page-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .page-btn:hover:not(.active) {
          border-color: var(--primary);
          color: var(--primary);
        }

        /* ========== SECTION: OFFRES RÉCENTES ========== */
        .container-offres-recentes {
          max-width: 1280px;
          margin: 80px auto 0;
          padding: 0 32px;
          margin-bottom:50px;
        }

        .section-header-center-offres {
          text-align: center;
          margin-bottom: 40px;
        }

        .section-title-center-offres {
          font-size: 36px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
          position: relative;
          display: inline-block;
        }

        .section-title-center-offres::after {
          content: '';
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border-radius: 3px;
        }

        .section-subtitle-center-offres {
          color: #6c757d;
          font-size: 16px;
          margin-top: 20px;
        }

        .recent-special-offres {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 30px;
          margin-top: 20px;
        }

        .recent-featured-card-offres {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          min-height: 400px;
          background-size: cover;
          background-position: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          transition: all 0.4s ease;
          cursor: pointer;
        }

        .recent-featured-card-offres:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .recent-featured-card-offres::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, 
            rgba(0, 0, 0, 0.1) 0%, 
            rgba(0, 0, 0, 0.5) 50%, 
            rgba(0, 0, 0, 0.85) 100%
          );
          z-index: 0;
        }

        .recent-featured-badge-offres {
          position: absolute;
          top: 20px;
          left: 20px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          padding: 6px 18px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 700;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .recent-featured-badge-offres i {
          font-size: 12px;
        }

        .recent-featured-content-offres {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 32px;
          z-index: 1;
          color: white;
        }

        .recent-featured-title-offres {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 6px;
          line-height: 1.2;
        }

        .recent-featured-company-offres {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .recent-featured-company-offres i {
          color: #ffd966;
        }

        .recent-featured-description-offres {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.6;
          margin-bottom: 16px;
          max-width: 80%;
        }

        .recent-featured-meta-offres {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }

        .recent-featured-meta-offres span {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        .recent-featured-meta-offres i {
          color: #ffd966;
        }

        .recent-featured-type-offres {
          background: rgba(255, 217, 102, 0.15);
          padding: 2px 14px;
          border-radius: 20px;
          font-weight: 600;
          color: #ffd966;
          border: 1px solid rgba(255, 217, 102, 0.2);
        }

        .recent-featured-link-offres {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #ffd966;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.3s ease;
          padding: 8px 20px;
          background: rgba(255, 217, 102, 0.1);
          border-radius: 40px;
          border: 1px solid rgba(255, 217, 102, 0.15);
        }

        .recent-featured-link-offres:hover {
          gap: 16px;
          background: rgba(255, 217, 102, 0.2);
          color: #ffe08c;
        }

        .recent-side-cards-offres {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .recent-side-card-offres {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          padding: 28px 24px;
          min-height: 180px;
          background-size: cover;
          background-position: center;
          transition: all 0.4s ease;
          cursor: pointer;
          flex: 1;
        }

        .recent-side-card-offres::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.75) 100%);
          z-index: 0;
        }

        .recent-side-card-offres:hover {
          transform: translateX(5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
        }

        .recent-side-card-offres > * {
          position: relative;
          z-index: 1;
        }

        .side-card-icon-offres {
          width: 44px;
          height: 44px;
          background: rgba(255, 217, 102, 0.12);
          backdrop-filter: blur(4px);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          border: 1px solid rgba(255, 217, 102, 0.1);
        }

        .side-card-icon-offres i {
          font-size: 20px;
          color: #ffd966;
        }

        .side-card-title-offres {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }

        .side-card-text-offres {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
          margin-bottom: 10px;
        }

        .side-card-meta-offres {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .side-card-meta-offres span {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .side-card-meta-offres i {
          color: #ffd966;
          font-size: 11px;
        }

        .side-card-stats-offres {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .side-card-stats-offres span {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 12px;
          border-radius: 20px;
        }

        .side-card-stats-offres i {
          color: #ffd966;
          font-size: 11px;
        }

        .side-card-link-offres {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #ffd966;
          font-weight: 600;
          font-size: 13px;
          text-decoration: none;
          transition: all 0.3s ease;
          width: fit-content;
        }

        .side-card-link-offres:hover {
          gap: 14px;
          color: #ffe08c;
        }

        /* ========== SECTION: POURQUOI STAGEFLOW ? ========== */
        .why-stageflow-section {
          position: relative;
          padding: 80px 90px;
          overflow: hidden;
          min-height: 600px;
          margin-top: 60px;
        }
        .why-stageflow-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/formation13.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }
        .why-stageflow-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.75) 0%, rgba(0, 0, 0, 0.7) 100%);
          z-index: 1;
        }
        .why-stageflow-container {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }
        .why-stageflow-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .why-stageflow-header .badge {
          display: inline-block;
          background: rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(4px);
          padding: 6px 20px;
          border-radius: 40px;
          font-size: 12px;
          color: #ffd966;
          font-weight: 600;
          letter-spacing: 1px;
          margin-bottom: 16px;
          border: 1px solid rgba(255, 217, 102, 0.2);
        }
        .why-stageflow-header h2 {
          font-size: 40px;
          font-weight: 800;
          color: white;
          margin-bottom: 12px;
        }
        .why-stageflow-header p {
          font-size: 16px;
          color: rgba(255,255,255,0.85);
        }
        .why-stageflow-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .why-stageflow-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          padding: 32px 24px;
          text-align: center;
          transition: all 0.4s ease;
          border: 1px solid rgba(255, 255, 255, 0.15);
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .why-stageflow-card:hover {
          transform: translateY(-8px);
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 217, 102, 0.3);
          box-shadow: 0 15px 30px rgba(0,0,0,0.2);
        }
        .why-stageflow-card .icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 28px;
          color: #ffd966;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        .why-stageflow-card:hover .icon {
          background: rgba(255, 217, 102, 0.15);
          transform: scale(1.05);
        }
        .why-stageflow-card h4 {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
        }
        .why-stageflow-card p {
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
        }
        .why-stageflow-card .card-number {
          position: absolute;
          bottom: 12px;
          right: 20px;
          font-size: 48px;
          font-weight: 800;
          color: rgba(255,255,255,0.04);
          z-index: 0;
        }

        /* ========== SECTION: CONSEILS POUR RÉUSSIR ========== */
        .tips-stage-section {
          padding: 80px 90px;
          background: #f8f9fa;
          position: relative;
        }
        .tips-stage-container {
          max-width: 1280px;
          margin: 0 auto;
        }
        .tips-stage-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .tips-stage-header .badge {
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
        .tips-stage-header h2 {
          font-size: 40px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 12px;
        }
        .tips-stage-header p {
          font-size: 16px;
          color: #6c757d;
        }

        .horizontal-tips-container {
          display: flex;
          gap: 40px;
          align-items: stretch;
          margin-top: 20px;
          margin-bottom: 40px;
        }
        .horizontal-tips-left { 
          flex: 1; 
          width: 50%; 
        }
        .image-frame-tips {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.7) 100%);
          border-radius: 24px;
          padding: 8px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        .tips-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 18px;
          min-height: 280px;
          max-height: 320px;
        }
        .horizontal-tips-right { 
          flex: 1; 
          width: 50%; 
        }
        .tips-text-content {
          background: #2c1a0e;
          border-radius: 24px;
          padding: 40px 32px;
          color: white;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        .tips-main-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.3px;
          color: #ffd966;
        }
        .tips-desc {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .tips-points-center {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .tips-point-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.08);
          padding: 16px 20px;
          border-radius: 20px;
          transition: all 0.3s ease;
          min-width: 110px;
          flex: 1;
        }
        .tips-point-center:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-5px);
        }
        .tips-point-center i {
          font-size: 28px;
          color: #ffd966;
        }
        .tips-point-center strong {
          font-size: 14px;
          font-weight: 700;
          color: white;
        }
        .tips-point-center span {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
        }
        .tips-link-center {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #ffd966;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
          background: rgba(255, 217, 102, 0.1);
          padding: 10px 24px;
          border-radius: 40px;
          margin: 0 auto;
          width: fit-content;
        }
        .tips-link-center:hover {
          gap: 12px;
          background: rgba(255, 217, 102, 0.2);
          color: #ffe08c;
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

        /* ========== MODAL ========== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          z-index: 1001;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal {
          background: white;
          border-radius: 32px;
          max-width: 500px;
          width: 90%;
          padding: 32px;
          animation: modalIn 0.3s ease;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .modal-company { color: var(--gray-600); margin-bottom: 8px; }
        .modal-location { color: var(--gray-600); font-size: 14px; margin-bottom: 20px; display: flex; align-items: center; gap: 6px; }
        .modal-actions { display: flex; gap: 12px; margin-top: 24px; }
        .modal-confirm {
          flex: 1;
          background: linear-gradient(135deg, var(--primary-dark), var(--primary));
          color: white;
          border: none;
          padding: 14px;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .modal-cancel {
          flex: 1;
          background: var(--gray-100);
          border: none;
          padding: 14px;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 1100px) {
          .jobs-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .why-stageflow-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 1024px) {
          .recent-special-offres {
            grid-template-columns: 1fr;
          }
          .recent-featured-card-offres {
            min-height: 350px;
          }
          .recent-side-cards-offres {
            flex-direction: row;
          }
          .recent-side-card-offres {
            min-height: 200px;
            flex: 1;
          }
        }
        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .horizontal-tips-container { flex-direction: column; }
          .horizontal-tips-left, .horizontal-tips-right { width: 100%; }
          .tips-points-center { flex-direction: column; gap: 12px; }
          .tips-point-center { flex-direction: row; justify-content: center; gap: 16px; padding: 14px 20px; }
        }
        @media (max-width: 768px) {
          .jobs-grid { grid-template-columns: 1fr; }
          .job-card-bg { min-height: 280px; }
          .list-bg-image { flex-direction: column; text-align: center; padding: 20px; }
          .list-header { justify-content: center; }
          .list-details { justify-content: center; }
          .list-right { justify-content: center; }
          .advanced-filters { grid-template-columns: 1fr; }
          .search-card { flex-direction: column; border-radius: 32px; }
          .container-offres-recentes { padding: 0 16px; }
          .section-title-center-offres { font-size: 28px; }
          .recent-special-offres { gap: 20px; }
          .recent-featured-card-offres { min-height: 300px; }
          .recent-featured-title-offres { font-size: 22px; }
          .recent-featured-description-offres { max-width: 100%; }
          .recent-featured-content-offres { padding: 24px; }
          .recent-side-cards-offres { flex-direction: column; }
          .recent-side-card-offres { min-height: 160px; }
          .why-stageflow-section { padding: 40px 20px; }
          .why-stageflow-grid { grid-template-columns: 1fr; }
          .why-stageflow-header h2 { font-size: 28px; }
          .tips-stage-section { padding: 40px 20px; }
          .tips-stage-header h2 { font-size: 28px; }
          .tips-image { min-height: 200px; max-height: 250px; }
          .tips-text-content { padding: 24px 20px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .notification-dropdown { width: 320px; right: -50px; }
        }
        @media (max-width: 480px) {
          .job-card-bg { min-height: 240px; }
          .job-card-content { padding: 16px; }
          .job-card-content .job-title { font-size: 16px; }
          .job-card-content .job-meta { gap: 10px; }
          .job-card-content .job-meta-item { font-size: 11px; }
          .recent-featured-card-offres { min-height: 260px; }
          .recent-featured-title-offres { font-size: 18px; }
          .recent-featured-meta-offres { gap: 10px; }
          .recent-featured-meta-offres span { font-size: 11px; }
          .recent-featured-link-offres { font-size: 12px; padding: 6px 16px; }
          .recent-side-card-offres { padding: 20px; min-height: 140px; }
          .side-card-title-offres { font-size: 16px; }
          .why-stageflow-card { padding: 24px 16px; }
          .tips-point-center { flex-direction: column; text-align: center; }
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
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="hero-offres">
        <div className="hero-offres-bg-image"></div>
        <div className="hero-offres-overlay"></div>
        <div className="hero-offres-container">
          <div className="hero-offres-content">
            <div className="hero-offres-badge">
              <span className="badge-dot"></span>
              Catalogue de stages #1
            </div>
            <h1 className="hero-offres-title">
              Des milliers d'offres
              <span className="hero-offres-highlight"> pour vous</span>
              <br />
              attendent
            </h1>
            <p className="hero-offres-desc">
              Explorez toutes nos opportunités de stage et trouvez celle qui correspond à vos compétences.
              Filtrez par ville, secteur, durée et postulez en quelques clics.
            </p>
            <div className="hero-offres-buttons">
              <Link to="/register" className="btn-offres-primary">
                Créer mon profil
                <i className="fas fa-arrow-right"></i>
              </Link>
              <Link to="#offres" className="btn-offres-secondary">
                Voir les offres
              </Link>
            </div>
            <div className="hero-offres-stats">
              <div className="stat-offres">
                <span className="stat-number-offres">{offres.length}+</span>
                <span className="stat-label-offres">Offres disponibles</span>
              </div>
              <div className="stat-offres">
                <span className="stat-number-offres">1.2K+</span>
                <span className="stat-label-offres">Entreprises</span>
              </div>
              <div className="stat-offres">
                <span className="stat-number-offres">98%</span>
                <span className="stat-label-offres">Satisfaction</span>
              </div>
            </div>
          </div>
          <div className="hero-offres-illustration">
            <div className="floating-offres-card card-offres-1">
              <i className="fas fa-graduation-cap"></i>
              <span>Stage PFE</span>
            </div>
            <div className="floating-offres-card card-offres-2">
              <i className="fas fa-code"></i>
              <span>Dev Web</span>
            </div>
            <div className="floating-offres-card card-offres-3">
              <i className="fas fa-chart-line"></i>
              <span>Marketing</span>
            </div>
            <div className="floating-offres-card card-offres-4">
              <i className="fas fa-search"></i>
              <span>Recherche</span>
            </div>
            <div className="illustration-offres-circle"></div>
            <div className="illustration-offres-circle-2"></div>
          </div>
        </div>
      </section>

      {/* ========== SEARCH BAR ========== */}
      <div className="search-wrapper">
        <form onSubmit={handleSearch} className="search-card">
          <div className="search-field">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Intitulé, compétence, entreprise..." 
              value={filters.keyword} 
              onChange={(e) => handleFilterChange('keyword', e.target.value)} 
            />
          </div>
          <div className="search-field">
            <i className="fas fa-map-marker-alt"></i>
            <input 
              type="text" 
              placeholder="Ville, région..." 
              value={filters.location} 
              onChange={(e) => handleFilterChange('location', e.target.value)} 
            />
          </div>
          <button type="submit" className="search-btn">
            Rechercher <i className="fas fa-arrow-right"></i>
          </button>
        </form>
      </div>

      {/* ========== FILTERS ========== */}
      <div className="filters-bar">
        <div className="filters-container">
          <div className="filter-row">
            <div className="filter-chips">
              <div 
                className={`filter-chip ${filters.remote ? 'active' : ''}`} 
                onClick={() => handleFilterChange('remote', !filters.remote)}
              >
                <i className="fas fa-laptop-house"></i> Télétravail
              </div>
            </div>
            <div className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <i className="fas fa-sliders-h"></i> Filtres avancés 
              <i className={`fas fa-chevron-${showFilters ? 'up' : 'down'}`}></i>
            </div>
          </div>
          {showFilters && (
            <div className="advanced-filters">
              <div className="filter-group">
                <label>TYPE DE STAGE</label>
                <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
                  <option value="">Tous</option>
                  {typeOptions.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>DURÉE</label>
                <select value={filters.duration} onChange={(e) => handleFilterChange('duration', e.target.value)}>
                  <option value="">Toutes</option>
                  {durationOptions.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>SECTEUR</label>
                <select value={filters.industry} onChange={(e) => handleFilterChange('industry', e.target.value)}>
                  <option value="">Tous</option>
                  {industryOptions.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>SALAIRE MIN</label>
                <input 
                  type="number" 
                  placeholder="0 DH" 
                  value={filters.salary} 
                  onChange={(e) => handleFilterChange('salary', e.target.value)} 
                />
              </div>
            </div>
          )}
          {(filters.type || filters.duration || filters.industry || filters.remote || filters.salary) && (
            <div className="active-filters">
              {filters.type && <span className="active-tag">{filters.type} <button onClick={() => handleFilterChange('type', '')}>×</button></span>}
              {filters.duration && <span className="active-tag">{filters.duration} <button onClick={() => handleFilterChange('duration', '')}>×</button></span>}
              {filters.industry && <span className="active-tag">{filters.industry} <button onClick={() => handleFilterChange('industry', '')}>×</button></span>}
              {filters.remote && <span className="active-tag">Télétravail <button onClick={() => handleFilterChange('remote', false)}>×</button></span>}
              {filters.salary && <span className="active-tag">Salaire ≥ {filters.salary} DH <button onClick={() => handleFilterChange('salary', '')}>×</button></span>}
              <button className="clear-btn" onClick={clearFilters}>Effacer tout</button>
            </div>
          )}
        </div>
      </div>

      {/* ========== RESULTS ========== */}
      <div className="results-bar">
        <div className="results-count">
          <strong>{offres.length}</strong> offres trouvées
        </div>
        <div className="view-toggle">
          <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
            <i className="fas fa-th-large"></i>
          </button>
          <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </div>

      {/* ========== CONTENT ========== */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <div className="loading-text">Chargement des offres...</div>
        </div>
      ) : offres.length === 0 ? (
        <div className="empty-container">
          <div className="empty-icon"><i className="fas fa-search"></i></div>
          <h3 className="empty-title">Aucune offre trouvée</h3>
          <p className="empty-subtitle">Essayez de modifier vos critères de recherche</p>
          <button className="filter-chip" onClick={clearFilters}>Voir toutes les offres</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="jobs-grid">
          {currentOffres.map((offre, index) => (
            <div className="job-card" key={offre.idOffre} onClick={() => window.location.href = `/offres/${offre.idOffre}`} style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="job-card-bg" style={{ backgroundImage: `url(${getImageForOffre(offre.idOffre)})` }}>
                <div className="job-card-overlay"></div>
                <div className="job-card-content">
                  <div className="card-header">
                    <div className="company-logo">{offre.entreprise?.nom?.charAt(0) || 'E'}</div>
                    <span className="job-badge">{offre.typeStage || 'Stage'}</span>
                  </div>
                  <h3 className="job-title">{offre.titre}</h3>
                  <div className="company-name"><i className="fas fa-building"></i> {offre.entreprise?.nom || 'Entreprise'}</div>
                  <div className="job-meta">
                    <div className="job-meta-item"><i className="fas fa-map-marker-alt"></i> {offre.ville}</div>
                    <div className="job-meta-item"><i className="fas fa-clock"></i> {offre.duree} mois</div>
                  </div>
                  <div className="card-footer">
                    <div className="salary"><i className="fas fa-money-bill-wave"></i> Selon profil</div>
                    <div className="apply-link">Postuler <i className="fas fa-arrow-right"></i></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="jobs-list">
          {currentOffres.map((offre, index) => (
            <div className="job-list-item" key={offre.idOffre} onClick={() => window.location.href = `/offres/${offre.idOffre}`} style={{ animationDelay: `${index * 0.03}s` }}>
              <div className="list-bg-image" style={{ backgroundImage: `url(${getImageForOffre(offre.idOffre)})` }}>
                <div className="list-overlay"></div>
                <div className="list-info">
                  <div className="list-header">
                    <div className="list-logo">{offre.entreprise?.nom?.charAt(0) || 'E'}</div>
                    <h3 className="list-title">{offre.titre}</h3>
                    <span className="list-badge">{offre.typeStage || 'Stage'}</span>
                  </div>
                  <div className="list-company"><i className="fas fa-building"></i> {offre.entreprise?.nom || 'Entreprise'}</div>
                  <div className="list-details">
                    <span className="list-detail"><i className="fas fa-map-marker-alt"></i> {offre.ville}</span>
                    <span className="list-detail"><i className="fas fa-clock"></i> {offre.duree} mois</span>
                    <span className="list-detail"><i className="fas fa-calendar-alt"></i> {new Date(offre.datePublication).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="list-right">
                  <div className="list-salary"><i className="fas fa-money-bill-wave"></i> Selon profil</div>
                  <div className="list-apply">Postuler <i className="fas fa-arrow-right"></i></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== PAGINATION ========== */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>←</button>
          {[...Array(Math.min(totalPages, 5))].map((_, i) => (
            <button key={i} className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
          ))}
          {totalPages > 5 && <span className="page-btn">...</span>}
          {totalPages > 5 && <button className="page-btn" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>}
          <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>→</button>
        </div>
      )}

     

      {/* ========== SECTION: POURQUOI STAGEFLOW ? ========== */}
      <div className="why-stageflow-section">
        <div className="why-stageflow-bg"></div>
        <div className="why-stageflow-overlay"></div>
        <div className="why-stageflow-container">
          <div className="why-stageflow-header">
            <span className="badge">🌟 Pourquoi StageFlow ?</span>
            <h2>La plateforme qui change votre recherche</h2>
            <p>Des outils puissants pour trouver le stage de vos rêves</p>
          </div>
          <div className="why-stageflow-grid">
            <div className="why-stageflow-card">
              <div className="card-number">01</div>
              <div className="icon"><i className="fas fa-robot"></i></div>
              <h4>Recommandations IA</h4>
              <p>Notre intelligence artificielle analyse votre profil et vous propose les offres les plus pertinentes.</p>
            </div>
            <div className="why-stageflow-card">
              <div className="card-number">02</div>
              <div className="icon"><i className="fas fa-bolt"></i></div>
              <h4>Candidature rapide</h4>
              <p>Postulez en un seul clic avec votre CV pré-enregistré et suivez vos candidatures en temps réel.</p>
            </div>
            <div className="why-stageflow-card">
              <div className="card-number">03</div>
              <div className="icon"><i className="fas fa-building"></i></div>
              <h4>Entreprises vérifiées</h4>
              <p>Toutes les entreprises sont certifiées pour vous garantir des opportunités de qualité et fiables.</p>
            </div>
            <div className="why-stageflow-card">
              <div className="card-number">04</div>
              <div className="icon"><i className="fas fa-chart-line"></i></div>
              <h4>Suivi en temps réel</h4>
              <p>Consultez l'état de vos candidatures et recevez des notifications instantanées à chaque étape.</p>
            </div>
          </div>
        </div>
      </div>

       {/* ========== SECTION: OFFRES RÉCENTES ========== */}
      <div className="container-offres-recentes" style={{ paddingTop: '14px' }}>
        <div className="section-header-center-offres">
          <h2 className="section-title-center-offres">Offres Récentes</h2>
          <p className="section-subtitle-center-offres">Les dernières offres de stage publiées</p>
        </div>

        <div className="recent-special-offres">
          {/* Grande carte - L'offre la plus récente */}
          <div className="recent-featured-card-offres" style={{ 
            backgroundImage: `url(${offres.length > 0 ? getImageForOffre(offres[0]?.idOffre) : '/images/home.png'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
            <div className="recent-featured-badge-offres">
              <i className="fas fa-fire"></i> Nouveau
            </div>
            <div className="recent-featured-content-offres">
              {offres.length > 0 ? (
                <>
                  <h3 className="recent-featured-title-offres">{offres[0]?.titre || 'Stage Développeur Full Stack'}</h3>
                  <p className="recent-featured-company-offres">
                    <i className="fas fa-building"></i> {offres[0]?.entreprise?.nom || 'Entreprise'}
                  </p>
                  <p className="recent-featured-description-offres">
                    {offres[0]?.description?.substring(0, 80) || 'Découvrez cette opportunité de stage exceptionnelle...'}
                  </p>
                  <div className="recent-featured-meta-offres">
                    <span><i className="fas fa-map-marker-alt"></i> {offres[0]?.ville || 'Marrakech'}</span>
                    <span><i className="fas fa-clock"></i> {offres[0]?.duree || '6'} mois</span>
                    <span className="recent-featured-type-offres">{offres[0]?.typeStage || 'PFE'}</span>
                  </div>
                  <Link to={`/offres/${offres[0]?.idOffre || '#'}`} className="recent-featured-link-offres">
                    Voir l'offre <i className="fas fa-arrow-right"></i>
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="recent-featured-title-offres">Stage Développeur Full Stack</h3>
                  <p className="recent-featured-company-offres"><i className="fas fa-building"></i> TechCorp</p>
                  <p className="recent-featured-description-offres">Rejoignez une équipe dynamique pour développer des applications innovantes...</p>
                  <div className="recent-featured-meta-offres">
                    <span><i className="fas fa-map-marker-alt"></i> Casablanca</span>
                    <span><i className="fas fa-clock"></i> 6 mois</span>
                    <span className="recent-featured-type-offres">PFE</span>
                  </div>
                  <Link to="/offres" className="recent-featured-link-offres">
                    Voir l'offre <i className="fas fa-arrow-right"></i>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Side cards */}
          <div className="recent-side-cards-offres">
            <div className="recent-side-card-offres" style={{ 
              backgroundImage: `url(${offres.length > 1 ? getImageForOffre(offres[1]?.idOffre + 10) : '/images/do.png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              <div className="side-card-icon-offres">
                <i className="fas fa-briefcase"></i>
              </div>
              <h4 className="side-card-title-offres">Postulez maintenant</h4>
              <p className="side-card-text-offres">
                {offres.length > 1 ? offres[1]?.titre || 'Stage en Marketing Digital' : 'Stage en Marketing Digital'}
              </p>
              <div className="side-card-meta-offres">
                <span><i className="fas fa-map-marker-alt"></i> {offres.length > 1 ? offres[1]?.ville || 'Rabat' : 'Rabat'}</span>
                <span><i className="fas fa-clock"></i> {offres.length > 1 ? offres[1]?.duree || '4' : '4'} mois</span>
              </div>
              <Link to={`/offres/${offres.length > 1 ? offres[1]?.idOffre : '#'}`} className="side-card-link-offres">
                Voir l'offre <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            <div className="recent-side-card-offres" style={{ 
              backgroundImage: `url(${offres.length > 2 ? getImageForOffre(offres[2]?.idOffre + 20) : '/images/do1.png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              <div className="side-card-icon-offres">
                <i className="fas fa-star"></i>
              </div>
              <h4 className="side-card-title-offres">À la une</h4>
              <p className="side-card-text-offres">
                {offres.length > 2 ? offres[2]?.titre || 'Stage en Data Science' : 'Stage en Data Science'}
              </p>
              <div className="side-card-stats-offres">
                <span><i className="fas fa-tag"></i> {offres.length > 2 ? offres[2]?.typeStage || 'PFE' : 'PFE'}</span>
                <span><i className="fas fa-map-marker-alt"></i> {offres.length > 2 ? offres[2]?.ville || 'Marrakech' : 'Marrakech'}</span>
                <span><i className="fas fa-clock"></i> {offres.length > 2 ? offres[2]?.duree || '5' : '5'} mois</span>
              </div>
              <Link to={`/offres/${offres.length > 2 ? offres[2]?.idOffre : '#'}`} className="side-card-link-offres">
                Découvrir <i className="fas fa-arrow-right"></i>
              </Link>
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

      {/* ========== MODAL ========== */}
      {showModal && selectedOffre && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Postuler à "{selectedOffre.titre}"</h3>
            <div className="modal-company">{selectedOffre.entreprise?.nom || 'Entreprise'}</div>
            <div className="modal-location"><i className="fas fa-map-marker-alt"></i> {selectedOffre.ville}</div>
            <p>Votre candidature sera envoyée directement à l'entreprise avec votre CV.</p>
            <div className="modal-actions">
              <button className="modal-confirm" onClick={() => { setShowModal(false); toast.success('✅ Candidature envoyée avec succès !'); }}>Confirmer</button>
              <button className="modal-cancel" onClick={() => setShowModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}