import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function About() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [counterValues, setCounterValues] = useState({ offres: 0, entreprises: 0, etudiants: 0, satisfaction: 0 });
  const statsRef = useRef(null);

  // ========== NOTIFICATIONS ==========
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Fonction de déconnexion (identique à Home)
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fonction pour rediriger vers le bon dashboard (identique à Home)
  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'etudiant') return '/dashboard';
    if (user.role === 'recruteur') return '/dashboard-recruteur';
    if (user.role === 'admin') return '/dashboard-admin';
    return '/profile';
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    // Charger les notifications
    fetchNotifications();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Rafraîchir les notifications toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateNumbers();
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const animateNumbers = () => {
    const targets = { offres: 5000, entreprises: 1200, etudiants: 50000, satisfaction: 98 };
    const duration = 2000;
    const step = 20;
    const increments = {
      offres: targets.offres / (duration / step),
      entreprises: targets.entreprises / (duration / step),
      etudiants: targets.etudiants / (duration / step),
      satisfaction: targets.satisfaction / (duration / step)
    };
    let current = { offres: 0, entreprises: 0, etudiants: 0, satisfaction: 0 };
    const timer = setInterval(() => {
      current.offres = Math.min(current.offres + increments.offres, targets.offres);
      current.entreprises = Math.min(current.entreprises + increments.entreprises, targets.entreprises);
      current.etudiants = Math.min(current.etudiants + increments.etudiants, targets.etudiants);
      current.satisfaction = Math.min(current.satisfaction + increments.satisfaction, targets.satisfaction);
      setCounterValues({
        offres: Math.floor(current.offres),
        entreprises: Math.floor(current.entreprises),
        etudiants: Math.floor(current.etudiants),
        satisfaction: Math.floor(current.satisfaction)
      });
      if (current.offres >= targets.offres && current.entreprises >= targets.entreprises && 
          current.etudiants >= targets.etudiants && current.satisfaction >= targets.satisfaction) {
        clearInterval(timer);
      }
    }, step);
  };

  const teamMembers = [
    { name: "Mehdi Benali", role: "CEO & Fondateur", bio: "Ancien directeur des stages à l'UCA, il a créé StageFlow pour révolutionner l'accès aux stages.", initials: "MB", photo: "/images/meh.png" },
    { name: "Sofia El Mansouri", role: "CTO", bio: "Experte en IA et machine learning, elle développe notre algorithme de matching intelligent.", initials: "SE", photo: "/images/sop.png" },
    { name: "Karim Idrissi", role: "Head of Growth", bio: "Stratège marketing, il connecte les entreprises aux talents de demain.", initials: "KI", photo: "/images/Kar.png" },
    { name: "Leila Benjelloun", role: "Directrice RH", bio: "Spécialiste en recrutement, elle garantit la qualité et la légitimité des offres.", initials: "LB", photo: "/images/lei.png" }
  ];

  return (
    <div className="about-page">
      <style>{`
        /* ========== RESET & VARIABLES ========== */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .about-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #ffffff;
          color: #1a1a1a;
          overflow-x: hidden;
        }

        /* ========== NAVBAR (identique à Home) ========== */
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

        /* ========== HERO PREMIUM AVEC IMAGE ========== */
        .about-hero {
          position: relative;
          min-height: 850px;
          display: flex;
          align-items: center;
          padding-top: 80px;
          overflow: hidden;
        }
        .about-hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/about.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }
        .about-hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.8) 100%);
          z-index: 1;
        }
        .about-hero-content {
          position: relative;
          z-index: 2;
          max-width: 1100px;
          margin: 0 auto;
          padding: 60px 32px;
          text-align: center;
          color: white;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 217, 102, 0.15);
          backdrop-filter: blur(4px);
          padding: 8px 20px;
          border-radius: 40px;
          margin-bottom: 30px;
          font-size: 14px;
          border: 1px solid rgba(255, 217, 102, 0.3);
        }
        .badge-dot {
          width: 8px;
          height: 8px;
          background: #ffd966;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .hero-title {
          font-size: 64px;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -2px;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #ffd966, #ffb347);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-desc {
          font-size: 18px;
          color: rgba(255,255,255,0.85);
          line-height: 1.6;
          margin-bottom: 48px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }
        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 80px;
          flex-wrap: wrap;
        }
        .stat-item {
          text-align: center;
        }
        .stat-number {
          font-size: 42px;
          font-weight: 800;
          color: #ffd966;
        }
        .stat-label {
          font-size: 14px;
          color: rgba(255,255,255,0.7);
        }
        .hero-scroll {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          animation: bounce 2s infinite;
          z-index: 2;
        }
        .hero-scroll a {
          color: white;
          font-size: 24px;
          opacity: 0.7;
          transition: opacity 0.3s;
        }
        .hero-scroll a:hover { opacity: 1; }
        @keyframes bounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-10px); } }

        /* ========== MISSION PREMIUM ========== */
        .mission-premium { padding: 120px 32px; background: white; }
        .container { max-width: 1280px; margin: 0 auto; }
        .mission-premium-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .section-tag {
          display: inline-block;
          background: rgba(139, 90, 43, 0.1);
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 30px;
          margin-bottom: 20px;
          letter-spacing: 0.5px;
        }
        .mission-title {
          font-size: 48px;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 24px;
          color: #1a1a1a;
        }
        .mission-text {
          font-size: 16px;
          color: #6c757d;
          line-height: 1.7;
          margin-bottom: 20px;
        }
        .mission-features { display: flex; gap: 24px; margin-top: 40px; }
        .mission-feature {
          flex: 1;
          padding: 24px;
          background: #f8f9fa;
          border-radius: 20px;
          transition: all 0.3s;
        }
        .mission-feature:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
        .mission-feature i { font-size: 40px; color: #8B5A2B; margin-bottom: 16px; }
        .mission-feature h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .mission-feature p { font-size: 13px; color: #6c757d; }
        .mission-image-frame {
          position: relative;
          border-radius: 30px;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.1);
        }
        .mission-image-frame img { width: 100%; height: auto; display: block; transition: transform 0.5s; }
        .mission-image-frame:hover img { transform: scale(1.05); }
        .play-button {
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          padding: 12px 24px;
          border-radius: 50px;
          color: white;
          cursor: pointer;
          transition: all 0.3s;
        }
        .play-button:hover { background: #8B5A2B; gap: 15px; }

        /* ========== STATS SECTION PREMIUM ========== */
        .stats-premium {
          padding: 80px 32px;
          background: #b6b0acff;
          position: relative;
        }
        .section-header-stats {
          text-align: center;
          margin-bottom: 60px;
        }
        .section-header-stats .section-tag {
          display: inline-block;
          background: rgba(87, 44, 4, 0.1);
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 30px;
          margin-bottom: 20px;
          letter-spacing: 0.5px;
        }
        .section-header-stats h2 {
          font-size: 42px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 16px;
        }
        .section-header-stats p {
          font-size: 16px;
          color: #6c757d;
          max-width: 600px;
          margin: 0 auto;
        }
        .stats-premium-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
          position: relative;
          z-index: 1;
        }
        .stat-premium-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s ease;
          background-size: cover;
          background-position: center;
          min-height: 280px;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        .stat-premium-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        .stat-card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.8) 100%);
          z-index: 1;
          transition: all 0.3s ease;
        }
        .stat-premium-card:hover .stat-card-overlay {
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.85) 0%, rgba(139, 90, 43, 0.85) 100%);
        }
        .stat-card-content {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 40px 20px;
          color: white;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .stat-premium-icon i {
          font-size: 48px;
          color: #ffd966;
          margin-bottom: 20px;
        }
        .stat-premium-number {
          font-size: 48px;
          font-weight: 800;
          color: white;
          margin-bottom: 10px;
        }
        .stat-premium-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffd966;
          margin-bottom: 8px;
        }
        .stat-premium-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
        }

        /* Responsive Stats */
        @media (max-width: 1000px) {
          .stats-premium-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .section-header-stats h2 {
            font-size: 36px;
          }
          .stat-premium-number {
            font-size: 36px;
          }
        }
        @media (max-width: 700px) {
          .stats-premium-grid {
            grid-template-columns: 1fr;
          }
          .stat-premium-card {
            min-height: 240px;
          }
          .section-header-stats h2 {
            font-size: 28px;
          }
          .stat-premium-number {
            font-size: 42px;
          }
        }
        /* ========== TIMELINE SECTION ========== */
        .timeline-section { padding: 120px 32px; background: #f8f9fa; }
        .timeline-header { text-align: center; margin-bottom: 60px; }
        .timeline-header h2 { font-size: 48px; font-weight: 700; margin-bottom: 16px; }
        .timeline { max-width: 800px; margin: 0 auto; position: relative; }
        .timeline::before {
          content: '';
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, #8B5A2B, #ffd966, #8B5A2B);
        }
        .timeline-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 60px;
          position: relative;
        }
        .timeline-item:nth-child(odd) { flex-direction: row; }
        .timeline-item:nth-child(even) { flex-direction: row-reverse; }
        .timeline-content {
          width: 45%;
          background: white;
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          transition: all 0.3s;
        }
        .timeline-content:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .timeline-year {
          font-size: 24px;
          font-weight: 800;
          color: #8B5A2B;
          margin-bottom: 8px;
        }
        .timeline-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .timeline-text { font-size: 14px; color: #6c757d; }
        .timeline-dot {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 16px;
          background: #ffd966;
          border-radius: 50%;
          border: 3px solid #8B5A2B;
        }

        /* ========== TEAM PREMIUM ========== */
        .team-premium { 
          padding: 100px 32px; 
          background: #b6b0acff;
        }
        .container { 
          max-width: 1280px; 
          margin: 0 auto; 
        }
        .team-header { 
          text-align: center; 
          margin-bottom: 60px; 
        }
        .team-header h2 { 
          font-size: 42px; 
          font-weight: 700; 
          margin-bottom: 16px; 
          color: #1a1a1a;
        }
        .team-header p { 
          font-size: 16px; 
          color: #6c757d; 
        }
        .team-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 30px; 
        }
        .team-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          cursor: pointer;
        }
        .team-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        .team-image {
          position: relative;
          height: 280px;
          overflow: hidden;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
        }
        .team-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .team-card:hover .team-photo {
          transform: scale(1.08);
        }
        .team-social {
          position: absolute;
          bottom: -50px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 15px;
          padding: 15px;
          background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
          transition: bottom 0.3s ease;
          z-index: 2;
        }
        .team-card:hover .team-social {
          bottom: 0;
        }
        .team-social a {
          width: 36px;
          height: 36px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8B5A2B;
          text-decoration: none;
          transition: all 0.3s;
        }
        .team-social a:hover {
          background: #8B5A2B;
          color: white;
          transform: translateY(-3px);
        }
        .team-info {
          padding: 24px;
          text-align: center;
        }
        .team-info h3 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #1a1a1a;
        }
        .team-info .team-role {
          font-size: 13px;
          color: #8B5A2B;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .team-info p {
          font-size: 13px;
          color: #6c757d;
          line-height: 1.6;
        }

        /* Responsive Team */
        @media (max-width: 1000px) {
          .team-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .team-header h2 {
            font-size: 36px;
          }
        }
        @media (max-width: 700px) {
          .team-grid {
            grid-template-columns: 1fr;
          }
          .team-header h2 {
            font-size: 28px;
          }
        }
        /* ========== PARTNERS PREMIUM ========== */
        .partners-premium { 
          padding: 80px 32px; 
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          position: relative;
          overflow: hidden;
        }
        .partners-premium::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(139, 90, 43, 0.03) 0%, transparent 70%);
          pointer-events: none;
        }
        .partners-header { 
          text-align: center; 
          margin-bottom: 50px; 
          position: relative;
          z-index: 1;
        }
        .partners-header .section-tag {
          display: inline-block;
          background: rgba(139, 90, 43, 0.1);
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 30px;
          margin-bottom: 20px;
          letter-spacing: 0.5px;
        }
        .partners-header h2 { 
          font-size: 42px; 
          font-weight: 700; 
          color: #1a1a1a;
          margin-bottom: 16px;
        }
        .partners-header p {
          font-size: 16px;
          color: #6c757d;
          max-width: 600px;
          margin: 0 auto;
        }
        .partners-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 25px; 
          margin-bottom: 50px;
          position: relative;
          z-index: 1;
        }
        .partner-card {
          background: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 20px;
          transition: all 0.3s ease;
          cursor: pointer;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
          border: 1px solid #eef2f0;
          position: relative;
          overflow: hidden;
        }
        .partner-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #5D3A1A, #8B5A2B, #ffd966);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }
        .partner-card:hover::before {
          transform: scaleX(1);
        }
        .partner-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border-color: transparent;
        }
        .partner-logo-wrapper {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #efe6d8, #e0d5c4);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          transition: all 0.3s ease;
        }
        .partner-card:hover .partner-logo-wrapper {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          transform: scale(1.05);
        }
        .partner-logo-wrapper i {
          font-size: 32px;
          color: #8B5A2B;
          transition: all 0.3s ease;
        }
        .partner-card:hover .partner-logo-wrapper i {
          color: #ffd966;
        }
        .partner-name {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 6px;
        }
        .partner-desc {
          display: block;
          font-size: 12px;
          color: #6c757d;
        }
        .partners-cta {
          text-align: center;
          margin-top: 30px;
        }
        .partners-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 40px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        .partners-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(93, 58, 26, 0.3);
          gap: 15px;
        }

        /* Responsive Partners */
        @media (max-width: 1000px) {
          .partners-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .partners-header h2 {
            font-size: 36px;
          }
        }
        @media (max-width: 700px) {
          .partners-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .partners-header h2 {
            font-size: 28px;
          }
          .partner-card {
            padding: 20px 15px;
          }
          .partner-logo-wrapper {
            width: 55px;
            height: 55px;
          }
          .partner-logo-wrapper i {
            font-size: 24px;
          }
          .partner-name {
            font-size: 14px;
          }
        }
        @media (max-width: 480px) {
          .partners-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ========== TESTIMONIALS PREMIUM ========== */
        .testimonials-premium { 
          padding: 100px 32px; 
          background: #b6b0acff;
          position: relative;
        }
        .testimonials-header { 
          text-align: center; 
          margin-bottom: 60px; 
        }
        .testimonials-header .section-tag {
          display: inline-block;
          background: rgba(139, 90, 43, 0.1);
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 30px;
          margin-bottom: 20px;
          letter-spacing: 0.5px;
        }
        .testimonials-header h2 { 
          font-size: 42px; 
          font-weight: 700; 
          color: #1a1a1a;
          margin-bottom: 16px;
        }
        .testimonials-header p {
          font-size: 16px;
          color: #6c757d;
          max-width: 600px;
          margin: 0 auto;
        }
        .testimonials-grid { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 30px; 
          margin-bottom: 60px;
        }
        .testimonial-premium {
          background: white;
          padding: 32px;
          border-radius: 24px;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          border: 1px solid #eef2f0;
          position: relative;
        }
        .testimonial-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
          border-color: transparent;
        }
        .testimonial-rating {
          margin-bottom: 20px;
        }
        .testimonial-rating i {
          color: #ffc107;
          font-size: 14px;
          margin-right: 3px;
        }
        .testimonial-quote {
          margin-bottom: 20px;
        }
        .testimonial-quote i {
          font-size: 32px;
          color: #8B5A2B;
          opacity: 0.3;
        }
        .testimonial-text {
          font-size: 15px;
          line-height: 1.7;
          color: #4a5568;
          margin-bottom: 24px;
          font-style: italic;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 15px;
          padding-top: 20px;
          border-top: 1px solid #eef2f0;
        }
        .author-photo {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #ffd966;
        }
        .author-info h4 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #1a1a1a;
        }
        .author-info span {
          font-size: 12px;
          color: #6c757d;
          display: block;
          margin-bottom: 5px;
        }
        .author-verified {
          font-size: 11px;
          color: #28a745;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .author-verified i {
          font-size: 12px;
        }
        .testimonials-stats {
          display: flex;
          justify-content: center;
          gap: 60px;
          flex-wrap: wrap;
          padding-top: 40px;
          border-top: 1px solid #eef2f0;
        }
        .testimonial-stat {
          text-align: center;
        }
        .testimonial-stat .stat-number {
          font-size: 36px;
          font-weight: 800;
          color: #8B5A2B;
          display: block;
          margin-bottom: 8px;
        }
        .testimonial-stat .stat-text {
          font-size: 14px;
          color: #6c757d;
        }

        /* Responsive Testimonials */
        @media (max-width: 1000px) {
          .testimonials-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .testimonials-header h2 {
            font-size: 36px;
          }
          .testimonials-stats {
            gap: 30px;
          }
        }
        @media (max-width: 700px) {
          .testimonials-grid {
            grid-template-columns: 1fr;
          }
          .testimonials-header h2 {
            font-size: 28px;
          }
          .testimonial-premium {
            padding: 24px;
          }
          .testimonials-stats {
            flex-direction: column;
            gap: 20px;
            align-items: center;
          }
          .testimonial-stat .stat-number {
            font-size: 28px;
          }
        }

        /* ========== CTA PREMIUM ========== */
        .cta-premium-section {
          padding: 100px 32px;
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          position: relative;
          overflow: hidden;
        }
        .cta-premium-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2000 1500'%3E%3Ccircle cx='500' cy='500' r='300' fill='rgba(255,217,102,0.03)'/%3E%3C/svg%3E");
        }
        .cta-container { max-width: 800px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
        .cta-container h2 { font-size: 48px; font-weight: 800; color: white; margin-bottom: 16px; }
        .cta-container p { font-size: 18px; color: rgba(255,255,255,0.8); margin-bottom: 32px; }
        .cta-buttons { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
        .btn-cta-primary {
          padding: 14px 32px;
          background: linear-gradient(135deg, #ffd966, #ffb347);
          border-radius: 50px;
          color: #1a1a2e;
          text-decoration: none;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s;
        }
        .btn-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255,217,102,0.3); gap: 15px; }
        .btn-cta-secondary {
          padding: 14px 32px;
          border: 2px solid white;
          border-radius: 50px;
          color: white;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.3s;
        }
        .btn-cta-secondary:hover { background: white; color: #1a1a2e; }

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

        /* ========== RESPONSIVE ========== */
        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .mission-premium-grid { grid-template-columns: 1fr; }
          .stats-premium-grid { grid-template-columns: repeat(2, 1fr); }
          .team-grid { grid-template-columns: repeat(2, 1fr); }
          .partners-grid { grid-template-columns: repeat(2, 1fr); }
          .testimonials-grid { grid-template-columns: repeat(2, 1fr); }
          .footer-premium-grid { grid-template-columns: repeat(2, 1fr); }
          .hero-title { font-size: 40px; }
          .mission-title { font-size: 36px; }
          .timeline::before { left: 20px; }
          .timeline-item, .timeline-item:nth-child(odd), .timeline-item:nth-child(even) { flex-direction: column; margin-left: 40px; }
          .timeline-content { width: 100%; margin-bottom: 20px; }
          .timeline-dot { left: 20px; }
        }
        @media (max-width: 700px) {
          .stats-premium-grid { grid-template-columns: 1fr; }
          .team-grid { grid-template-columns: 1fr; }
          .partners-grid { grid-template-columns: 1fr; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .footer-premium-grid { grid-template-columns: 1fr; }
          .hero-title { font-size: 32px; }
          .hero-stats { gap: 30px; }
          .mission-title { font-size: 28px; }
          .mission-features { flex-direction: column; }
          .timeline-header h2 { font-size: 32px; }
          .team-header h2 { font-size: 32px; }
          .testimonials-header h2 { font-size: 32px; }
          .cta-container h2 { font-size: 32px; }
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
            <Link to="/about" className="active">À propos</Link>
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

      {/* Mobile Menu - CORRIGÉ */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <div style={{ padding: '20px', textAlign: 'right' }}>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Accueil</Link>
          <Link to="/offres" onClick={() => setMobileMenuOpen(false)}>Offres</Link>
          {user && <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>Tableau de bord</Link>}
          <Link to="/about" onClick={() => setMobileMenuOpen(false)}>À propos</Link>
        </div>
      </div>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* HERO PREMIUM AVEC IMAGE */}
      <section className="about-hero">
        <div className="about-hero-bg"></div>
        <div className="about-hero-overlay"></div>
        <div className="about-hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            La plateforme de stages #1 au Maroc
          </div>
          <h1 className="hero-title">
            Nous connectons les talents<br />
            <span className="hero-gradient">aux opportunités</span>
          </h1>
          <p className="hero-desc">
            StageFlow est née d'une conviction : chaque étudiant mérite de trouver le stage qui façonnera sa carrière, 
            et chaque entreprise mérite de rencontrer les talents de demain.
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">5K+</span>
              <span className="stat-label">Stages réalisés</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1.2K+</span>
              <span className="stat-label">Entreprises</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">98%</span>
              <span className="stat-label">Satisfaction</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Étudiants</span>
            </div>
          </div>
        </div>
        <div className="hero-scroll">
          <a href="#mission"><i className="fas fa-chevron-down"></i></a>
        </div>
      </section>

      {/* MISSION SECTION */}
      <section className="mission-premium" id="mission">
        <div className="container">
          <div className="mission-premium-grid">
            <div>
              <span className="section-tag">Notre raison d'être</span>
              <h2 className="mission-title">Révolutionner l'accès aux stages en Afrique</h2>
              <p className="mission-text">Fondée en 2020 par des passionnés de l'éducation et de la technologie, StageFlow est devenue la référence incontournable pour la recherche de stages au Maroc et en Afrique.</p>
              <p className="mission-text">Notre plateforme intelligente utilise l'intelligence artificielle pour matcher les profils étudiants avec les offres d'entreprises, rendant le recrutement plus rapide, plus juste et plus efficace.</p>
              <div className="mission-features">
                <div className="mission-feature">
                  <i className="fas fa-eye"></i>
                  <h3>Notre Vision</h3>
                  <p>Devenir le leader africain de la mise en relation talents-entreprises</p>
                </div>
                <div className="mission-feature">
                  <i className="fas fa-heart"></i>
                  <h3>Nos Valeurs</h3>
                  <p>Innovation, Transparence, Excellence, Impact</p>
                </div>
              </div>
            </div>
            <div className="mission-image-frame">
              <img src="/images/registre.png" alt="Notre mission" />
              <div className="play-button">
                <i className="fas fa-play"></i>
                <span>Découvrez notre histoire</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION AVEC ANIMATION - FOND BLANC */}
      <section className="stats-premium" ref={statsRef}>
        <div className="container">
          <div className="section-header-stats">
            <span className="section-tag">Nos chiffres clés</span>
            <h2>StageFlow en quelques données</h2>
            <p>Découvrez l'impact de notre plateforme sur l'écosystème des stages</p>
          </div>
          <div className="stats-premium-grid">
            <div className="stat-premium-card" style={{ backgroundImage: "url('/images/o.png')" }}>
              <div className="stat-card-overlay"></div>
              <div className="stat-card-content">
                <div className="stat-premium-icon"><i className="fas fa-briefcase"></i></div>
                <div className="stat-premium-number">{counterValues.offres.toLocaleString()}+</div>
                <div className="stat-premium-title">Offres de stage</div>
                <div className="stat-premium-desc">Postées chaque année</div>
              </div>
            </div>
            <div className="stat-premium-card" style={{ backgroundImage: "url('/images/entr.png')" }}>
              <div className="stat-card-overlay"></div>
              <div className="stat-card-content">
                <div className="stat-premium-icon"><i className="fas fa-building"></i></div>
                <div className="stat-premium-number">{counterValues.entreprises.toLocaleString()}+</div>
                <div className="stat-premium-title">Entreprises</div>
                <div className="stat-premium-desc">Actives sur la plateforme</div>
              </div>
            </div>
            <div className="stat-premium-card" style={{ backgroundImage: "url('/images/etud.png')" }}>
              <div className="stat-card-overlay"></div>
              <div className="stat-card-content">
                <div className="stat-premium-icon"><i className="fas fa-users"></i></div>
                <div className="stat-premium-number">{counterValues.etudiants.toLocaleString()}+</div>
                <div className="stat-premium-title">Étudiants</div>
                <div className="stat-premium-desc">Inscrits et accompagnés</div>
              </div>
            </div>
            <div className="stat-premium-card" style={{ backgroundImage: "url('/images/sat.png')" }}>
              <div className="stat-card-overlay"></div>
              <div className="stat-card-content">
                <div className="stat-premium-icon"><i className="fas fa-smile"></i></div>
                <div className="stat-premium-number">{counterValues.satisfaction}%</div>
                <div className="stat-premium-title">Satisfaction</div>
                <div className="stat-premium-desc">Taux de recommandation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="timeline-section">
        <div className="container">
          <div className="timeline-header">
            <span className="section-tag">Notre parcours</span>
            <h2>L'histoire de StageFlow</h2>
          </div>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-content">
                <div className="timeline-year">2020</div>
                <div className="timeline-title">La naissance de StageFlow</div>
                <div className="timeline-text">Fondation de StageFlow à Marrakech avec une équipe de 3 passionnés.</div>
              </div>
              <div className="timeline-dot"></div>
            </div>
            <div className="timeline-item">
              <div className="timeline-content">
                <div className="timeline-year">2021</div>
                <div className="timeline-title">Premier partenariat majeur</div>
                <div className="timeline-text">Signature d'un partenariat avec l'Université Cadi Ayyad.</div>
              </div>
              <div className="timeline-dot"></div>
            </div>
            <div className="timeline-item">
              <div className="timeline-content">
                <div className="timeline-year">2022</div>
                <div className="timeline-title">Lancement de l'IA</div>
                <div className="timeline-text">Déploiement de notre algorithme de matching intelligent.</div>
              </div>
              <div className="timeline-dot"></div>
            </div>
            <div className="timeline-item">
              <div className="timeline-content">
                <div className="timeline-year">2023</div>
                <div className="timeline-title">1 000 entreprises</div>
                <div className="timeline-text">Franchissement du cap des 1 000 entreprises partenaires.</div>
              </div>
              <div className="timeline-dot"></div>
            </div>
            <div className="timeline-item">
              <div className="timeline-content">
                <div className="timeline-year">2024</div>
                <div className="timeline-title">Expansion panafricaine</div>
                <div className="timeline-text">Lancement de StageFlow au Sénégal et en Côte d'Ivoire.</div>
              </div>
              <div className="timeline-dot"></div>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM SECTION */}
      <section className="team-premium">
        <div className="container">
          <div className="team-header">
            <span className="section-tag">L'équipe</span>
            <h2>Derrière StageFlow</h2>
            <p>Une équipe passionnée dédiée à votre réussite</p>
          </div>
          <div className="team-grid">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="team-card">
                <div className="team-image">
                  <img src={member.photo} alt={member.name} className="team-photo" />
                  <div className="team-social">
                    <a href="#"><i className="fab fa-linkedin-in"></i></a>
                    <a href="#"><i className="fab fa-twitter"></i></a>
                  </div>
                </div>
                <div className="team-info">
                  <h3>{member.name}</h3>
                  <div className="team-role">{member.role}</div>
                  <p>{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



   


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