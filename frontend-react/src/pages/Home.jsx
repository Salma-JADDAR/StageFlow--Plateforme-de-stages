import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Home() {
  const [offres, setOffres] = useState([]);
  const [featuredOffres, setFeaturedOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    const fetchOffres = async () => {
      try {
        const res = await api.get('/offres');
        const allOffres = res.data.data || [];
        setOffres(allOffres);
        setFeaturedOffres(allOffres.slice(0, 6));
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffres();
    // Charger les notifications
    fetchNotifications();

    window.addEventListener('scroll', () => {
      setScrolled(window.scrollY > 50);
    });

    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('scroll', () => {});
      clearInterval(interval);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('mot_cle', searchTerm);
    if (selectedVille) params.append('ville', selectedVille);
    navigate(`/offres?${params.toString()}`);
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

  return (
    <div className="home">
      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="logo">
            <span>Stage<span>Flow</span></span>
          </Link>
          <div className="nav-links">
            <Link to="/" className="active">Accueil</Link>
            <Link to="/offres">Offres</Link>
            {user && <Link to={getDashboardLink()}>Tableau de bord</Link>}
            <a href="#secteurs">Secteurs</a>
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

      {/* HERO SECTION (REDESIGNED LIKE OFFRESLIST) */}
      <section className="hero-offres">
        <div className="hero-offres-bg-image"></div>
        <div className="hero-offres-overlay"></div>
        <div className="hero-offres-container">
          <div className="hero-offres-content">
            <div className="hero-offres-badge">
              <span className="badge-dot"></span>
              Plateforme de stages #1
            </div>
            <h1 className="hero-offres-title">
              Le stage qui
              <span className="hero-offres-highlight"> façonnera</span>
              <br />
              votre avenir
            </h1>
            <p className="hero-offres-desc">
              Rejoignez la première plateforme intelligente qui connecte les talents aux entreprises.
              Des milliers d'offres, des recommandations personnalisées, un suivi en temps réel.
            </p>
            <div className="hero-offres-buttons">
              <Link to="/register" className="btn-offres-primary">
                Commencer gratuitement
                <i className="fas fa-arrow-right"></i>
              </Link>
              <Link to="/offres" className="btn-offres-secondary">
                Explorer les offres
              </Link>
            </div>
            <div className="hero-offres-stats">
              <div className="stat-offres">
                <span className="stat-number-offres">5K+</span>
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
              <i className="fas fa-robot"></i>
              <span>IA Match</span>
            </div>
            <div className="illustration-offres-circle"></div>
            <div className="illustration-offres-circle-2"></div>
          </div>
        </div>
      </section>

      {/* SEARCH SECTION */}
      <div className="search-section">
        <div className="search-wrapper">
          <form onSubmit={handleSearch} className="search-card">
            <div className="search-item">
              <label>MOT CLÉ</label>
              <input 
                type="text" 
                placeholder="Titre, compétence, mot-clé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="search-item">
              <label>VILLE</label>
              <input 
                type="text" 
                placeholder="Ville, région..."
                value={selectedVille}
                onChange={(e) => setSelectedVille(e.target.value)}
              />
            </div>
            <button type="submit" className="search-btn">
              <i className="fas fa-search"></i> Rechercher
            </button>
          </form>
          <div className="search-tags">
            <span>Recherches populaires :</span>
            <button onClick={() => setSearchTerm('Stage PFE')}>Stage PFE</button>
            <button onClick={() => setSearchTerm('Alternance')}>Alternance</button>
            <button onClick={() => setSelectedVille('Casablanca')}>Casablanca</button>
            <button onClick={() => setSelectedVille('Rabat')}>Rabat</button>
            <button onClick={() => setSelectedVille('Marrakech')}>Marrakech</button>
            <button onClick={() => setSearchTerm('Informatique')}>Informatique</button>
          </div>
        </div>
      </div>

      {/* OFFRES À LA UNE - DESIGN PREMIUM */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-badge">StageFlow Recommande</span>
              <h2>Offres à la une</h2>
              <p>Les meilleures opportunités sélectionnées pour vous</p>
            </div>
            <Link to="/offres" className="see-all">
              Voir toutes les offres
              <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          {loading ? (
            <div className="loading-skeleton-premium">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton-card-premium"></div>
              ))}
            </div>
          ) : (
            <div className="offres-grid-premium">
              {featuredOffres.map((offre, index) => (
                <Link to={`/offres/${offre.idOffre}`} key={offre.idOffre} className="offre-card-premium" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="card-premium-badge">
                    <span className="badge-type">{offre.typeStage || 'Stage'}</span>
                    <span className="badge-featured">
                      <i className="fas fa-fire"></i> À la une
                    </span>
                  </div>
                  <div className="card-premium-header">
                    <div className="company-premium-logo">
                      <div className="company-initials">
                        {offre.entreprise?.nom?.charAt(0) || 'E'}
                      </div>
                    </div>
                    <div className="company-premium-info">
                      <h3 className="offre-premium-title">{offre.titre}</h3>
                      <div className="company-premium-name">
                        <i className="fas fa-building"></i>
                        <span>{offre.entreprise?.nom || 'Entreprise'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-premium-details">
                    <div className="detail-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{offre.ville}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-clock"></i>
                      <span>{offre.duree} mois</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-calendar-alt"></i>
                      <span>{new Date(offre.datePublication).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="card-premium-footer">
                    <div className="competences-premium">
                      {offre.competences?.slice(0, 3).map(comp => (
                        <span key={comp.idCompetence} className="competence-tag-premium">{comp.nom}</span>
                      ))}
                      {offre.competences?.length > 3 && (
                        <span className="competence-tag-more">+{offre.competences.length - 3}</span>
                      )}
                    </div>
                    <div className="card-premium-action">
                      <span>Postuler</span>
                      <i className="fas fa-arrow-right"></i>
                    </div>
                  </div>
                  <div className="card-premium-hover-effect"></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTEURS D'ACTIVITÉ */}
      <section className="section sectors-section" id="secteurs">
        <div className="sectors-bg"></div>
        <div className="sectors-overlay"></div>
        <div className="container">
          <div className="section-header center">
            <span className="section-badge">Par secteur</span>
            <h2>Explorez par domaine</h2>
            <p>Trouvez le stage qui correspond à votre spécialité</p>
          </div>
          <div className="sectors-grid">
            <div className="sector-card">
              <div className="sector-icon"><i className="fas fa-code"></i></div>
              <h4>Informatique & Digital</h4>
              <p>Développement, Data, IA, Cybersécurité</p>
              <span>450 offres</span>
            </div>
            <div className="sector-card">
              <div className="sector-icon"><i className="fas fa-chart-line"></i></div>
              <h4>Marketing & Communication</h4>
              <p>Digital, Social Media, Branding</p>
              <span>320 offres</span>
            </div>
            <div className="sector-card">
              <div className="sector-icon"><i className="fas fa-chart-bar"></i></div>
              <h4>Finance & Comptabilité</h4>
              <p>Audit, Gestion, Contrôle de gestion</p>
              <span>280 offres</span>
            </div>
            <div className="sector-card">
              <div className="sector-icon"><i className="fas fa-industry"></i></div>
              <h4>Industrie & Production</h4>
              <p>Logistique, Supply Chain, Qualité</p>
              <span>350 offres</span>
            </div>
            <div className="sector-card">
              <div className="sector-icon"><i className="fas fa-users"></i></div>
              <h4>RH & Management</h4>
              <p>Recrutement, Administration, Gestion</p>
              <span>210 offres</span>
            </div>
            <div className="sector-card">
              <div className="sector-icon"><i className="fas fa-microscope"></i></div>
              <h4>R&D & Innovation</h4>
              <p>Recherche, Développement, Labos</p>
              <span>180 offres</span>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="section steps-section">
        <div className="container">
          <div className="section-header center">
            <span className="section-badge">Processus simple</span>
            <h2>Comment ça marche ?</h2>
            <p>3 étapes pour décrocher le stage de vos rêves</p>
          </div>
          <div className="steps-grid-premium">
            <div className="step-card" style={{ backgroundImage: "url('images/e1.png')" }}>
              <div className="step-card-overlay"></div>
              <div className="step-card-content">
                <div className="step-number">1</div>
                <div className="step-icon"><i className="fas fa-user-plus"></i></div>
                <h3>Créez votre profil</h3>
                <p>Inscrivez-vous et complétez votre CV. Notre IA analyse votre profil pour vous proposer les meilleures offres.</p>
              </div>
            </div>
            <div className="step-card" style={{ backgroundImage: "url('images/e2.png')" }}>
              <div className="step-card-overlay"></div>
              <div className="step-card-content">
                <div className="step-number">2</div>
                <div className="step-icon"><i className="fas fa-robot"></i></div>
                <h3>Recommandations IA</h3>
                <p>Recevez des offres personnalisées basées sur vos compétences, votre formation et vos intérêts.</p>
              </div>
            </div>
            <div className="step-card" style={{ backgroundImage: "url('images/e3.png')" }}>
              <div className="step-card-overlay"></div>
              <div className="step-card-content">
                <div className="step-number">3</div>
                <div className="step-icon"><i className="fas fa-rocket"></i></div>
                <h3>Postulez et réussissez</h3>
                <p>Envoyez votre candidature en un clic et suivez son évolution en temps réel.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION SÉCURITÉ & CONFIANCE */}
      <div className="container" style={{ paddingTop: '14px' }}>
        <div className="section-header-center">
          <h2 className="section-title-center">Sécurité & Confiance</h2>
          <p className="section-subtitle-center">Engagés pour votre sécurité et la fiabilité de nos recrutements</p>
        </div>

        <div className="horizontal-security-container">
          <div className="horizontal-security-left">
            <div className="image-frame-small">
              <img src="/images/ho2.png" alt="Sécurité" className="security-small-image" />
            </div>
          </div>
          <div className="horizontal-security-right">
            <div className="security-text-content-small">
              <h3 className="security-main-title">VOTRE SÉCURITÉ EST NOTRE PRIORITÉ</h3>
              <p className="security-desc">Nous mettons tout en œuvre pour garantir des recrutements sûrs et transparents.</p>
              <div className="security-points-center">
                <div className="security-point-center">
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Entreprises vérifiées</strong>
                    <span>Certification qualité</span>
                  </div>
                </div>
                <div className="security-point-center">
                  <i className="fas fa-shield-alt"></i>
                  <div>
                    <strong>Données protégées</strong>
                    <span>Conformité RGPD</span>
                  </div>
                </div>
                <div className="security-point-center">
                  <i className="fas fa-headset"></i>
                  <div>
                    <strong>Support dédié</strong>
                    <span>Assistance 24/7</span>
                  </div>
                </div>
              </div>
              <a href="#" className="security-link-center">En savoir plus →</a>
            </div>
          </div>
        </div>
      </div>
     {/* ========== NOS ENTREPRISES PARTENAIRES ========== */}
<section className="partners-premium">
  <div className="container">
    <div className="partners-header">
      <span className="section-tag">Ils nous font confiance</span>
      <h2>Nos entreprises partenaires</h2>
      <p>Plus de 1 200 entreprises nous font confiance pour recruter leurs stagiaires</p>
    </div>
    <div className="partners-grid">
      <div className="partner-card"><div className="partner-logo-wrapper"><i className="fas fa-university"></i></div><span className="partner-name">UCA</span><span className="partner-desc">Université Cadi Ayyad</span></div>
      <div className="partner-card"><div className="partner-logo-wrapper"><i className="fas fa-building"></i></div><span className="partner-name">BMCE Bank</span><span className="partner-desc">Banque Marocaine</span></div>
      <div className="partner-card"><div className="partner-logo-wrapper"><i className="fas fa-chart-line"></i></div><span className="partner-name">InWI</span><span className="partner-desc">Innovation & Tech</span></div>
      <div className="partner-card"><div className="partner-logo-wrapper"><i className="fas fa-industry"></i></div><span className="partner-name">OCP</span><span className="partner-desc">Groupe OCP</span></div>
      <div className="partner-card"><div className="partner-logo-wrapper"><i className="fas fa-phone-alt"></i></div><span className="partner-name">Orange</span><span className="partner-desc">Télécommunications</span></div>
      <div className="partner-card"><div className="partner-logo-wrapper"><i className="fas fa-broadcast-tower"></i></div><span className="partner-name">Maroc Telecom</span><span className="partner-desc">Leader Telecom</span></div>
      <div className="partner-card"><div className="partner-logo-wrapper"><i className="fas fa-chart-bar"></i></div><span className="partner-name">Deloitte</span><span className="partner-desc">Consulting & Audit</span></div>
      <div className="partner-card"><div className="partner-logo-wrapper"><i className="fas fa-hard-hat"></i></div><span className="partner-name">Groupe TBK</span><span className="partner-desc">BTP & Construction</span></div>
    </div>
  </div>
</section>

{/* ========== CE QU'ILS DISENT DE NOUS ========== */}
<section className="testimonials-premium">
  <div className="container">
    <div className="testimonials-header">
      <span className="section-tag">Témoignages</span>
      <h2>Ce qu'ils disent de nous</h2>
      <p>Plus de 50 000 étudiants et 1 200 entreprises nous font confiance</p>
    </div>
    <div className="testimonials-grid">
      <div className="testimonial-premium">
        <div className="testimonial-rating"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
        <div className="testimonial-quote"><i className="fas fa-quote-left"></i></div>
        <p className="testimonial-text">"Grâce à StageFlow, j'ai trouvé mon stage de fin d'études en seulement 2 semaines. L'algorithme de matching est incroyablement précis !"</p>
        <div className="testimonial-author"><img src="/images/t1.png" alt="Fatima Zahra" className="author-photo" /><div className="author-info"><h4>Fatima Zahra</h4><span>Étudiante en Data Science</span><div className="author-verified"><i className="fas fa-check-circle"></i> Candidature validée</div></div></div>
      </div>
      <div className="testimonial-premium">
        <div className="testimonial-rating"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
        <div className="testimonial-quote"><i className="fas fa-quote-left"></i></div>
        <p className="testimonial-text">"Nous avons recruté 15 stagiaires via StageFlow. La qualité des profils et la simplicité d'utilisation nous ont conquis."</p>
        <div className="testimonial-author"><img src="/images/t2.png" alt="Reda Laassel" className="author-photo" /><div className="author-info"><h4>Reda Laassel</h4><span>DRH - InWI</span><div className="author-verified"><i className="fas fa-check-circle"></i> Entreprise vérifiée</div></div></div>
      </div>
      <div className="testimonial-premium">
        <div className="testimonial-rating"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
        <div className="testimonial-quote"><i className="fas fa-quote-left"></i></div>
        <p className="testimonial-text">"Une plateforme qui a changé ma vie professionnelle. Le suivi et les recommandations IA sont un vrai plus."</p>
        <div className="testimonial-author"><img src="/images/t3.png" alt="Omar Chafik" className="author-photo" /><div className="author-info"><h4>Omar Chafik</h4><span>Ingénieur logiciel</span><div className="author-verified"><i className="fas fa-check-circle"></i> Placement réussi</div></div></div>
      </div>
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

      <style jsx>{`
        /* ========== STYLES GLOBAUX ========== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .home {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #faf7f2;
          color: #1a1a1a;
          overflow-x: hidden;
        }

        /* ========== NAVBAR (identique à l'original) ========== */
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
        .nav-actions { display: flex; align-items: center; gap: 12px; }
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

        /* ========== USER MENU ========== */
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

        /* ========== HERO SECTION ========== */
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
          background-image: url('/images/home.png');
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
        .hero-offres-content {
          flex: 1;
        }
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
        .btn-offres-secondary:hover {
          background: white;
          color: #8B5A2B;
        }
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
        .floating-offres-card i {
          font-size: 18px;
          color: #8B5A2B;
        }
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

        /* ========== SEARCH SECTION ========== */
        .search-section {
          padding: 40px 32px 60px;
          margin-top: -80px;
          position: relative;
          z-index: 10;
        }
        .search-wrapper {
          max-width: 1280px;
          margin: 0 auto;
        }
        .search-card {
          background: white;
          border-radius: 60px;
          padding: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          max-width: 1000px;
          margin: 0 auto;
          box-shadow: 0 25px 40px rgba(0, 0, 0, 0.15);
        }
        .search-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 12px 20px;
          background: #f8faf8;
          border-radius: 50px;
          transition: all 0.2s;
          min-width: 150px;
        }
        .search-item:focus-within {
          background: white;
          box-shadow: 0 0 0 2px #8B5A2B;
        }
        .search-item label {
          font-size: 11px;
          font-weight: 600;
          color: #8B5A2B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .search-item input {
          border: none;
          background: transparent;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          width: 100%;
          outline: none;
          color: #1a1a1a;
        }
        .search-btn {
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          padding: 0 40px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
          min-width: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .search-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 15px rgba(93, 58, 26, 0.4);
        }
        .search-tags {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
          justify-content: center;
        }
        .search-tags span {
          font-size: 13px;
          color: #6c757d;
        }
        .search-tags button {
          background: #f0f2f5;
          border: none;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .search-tags button:hover {
          background: #8B5A2B;
          color: white;
        }

        /* ========== OFFRES À LA UNE ========== */
        .section { padding: 80px 32px; }
        .container { max-width: 1280px; margin: 0 auto; }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 48px;
        }
        .section-header.center { text-align: center; flex-direction: column; align-items: center; }
        .section-badge {
          display: inline-block;
          background: rgba(139,90,43,0.1);
          color: #8B5A2B;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 16px;
        }
        .section-header h2 {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #1a1a1a;
        }
        .section-header p { color: #6c757d; font-size: 16px; }
        .see-all {
          color: #8B5A2B;
          text-decoration: none;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .see-all:hover { gap: 12px; }

        .offres-grid-premium {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        .offre-card-premium {
          background: white;
          border-radius: 24px;
          padding: 24px;
          text-decoration: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          animation: fadeInUp 0.6s ease forwards;
          opacity: 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .offre-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.12);
          border-color: transparent;
        }
        .card-premium-badge {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .badge-type {
          background: #efe6d8;
          color: #8B5A2B;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .badge-featured {
          background: linear-gradient(135deg, #ffd966, #ffb347);
          color: #5D3A1A;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .badge-featured i { font-size: 10px; }
        .card-premium-header {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .company-premium-logo {
          width: 55px;
          height: 55px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .company-initials {
          font-size: 24px;
          font-weight: 800;
          color: white;
        }
        .company-premium-info { flex: 1; }
        .offre-premium-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 6px;
          line-height: 1.3;
        }
        .company-premium-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6c757d;
        }
        .company-premium-name i { font-size: 12px; }
        .card-premium-details {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          padding: 12px 0;
          border-top: 1px solid #eef2f0;
          border-bottom: 1px solid #eef2f0;
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6c757d;
        }
        .detail-item i {
          font-size: 12px;
          color: #8B5A2B;
          width: 14px;
        }
        .card-premium-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
        }
        .competences-premium {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .competence-tag-premium {
          background: #f0f2f5;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 15px;
          color: #4a5568;
          transition: all 0.2s;
        }
        .competence-tag-premium:hover {
          background: #8B5A2B;
          color: white;
        }
        .competence-tag-more {
          background: #e8ecef;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 15px;
          color: #6c757d;
          font-weight: 600;
        }
        .card-premium-action {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s;
          cursor: pointer;
        }
        .offre-card-premium:hover .card-premium-action {
          gap: 12px;
          box-shadow: 0 4px 12px rgba(93, 58, 26, 0.3);
        }
        .card-premium-hover-effect {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #5D3A1A, #8B5A2B, #ffd966);
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }
        .offre-card-premium:hover .card-premium-hover-effect {
          transform: scaleX(1);
        }

        /* Loading Skeleton Premium */
        .loading-skeleton-premium {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        .skeleton-card-premium {
          height: 280px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 24px;
        }
        @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ========== SECTEURS ========== */
        .sectors-section {
          position: relative;
          padding: 80px 32px;
          overflow: hidden;
          min-height: 700px;
        }
        .sectors-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('images/home1.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }
        .sectors-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.5));
          z-index: 1;
        }
        .sectors-section .container { position: relative; z-index: 2; }
        .sectors-section .section-header.center { text-align: center; margin-bottom: 90px; }
        .sectors-section .section-badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          color: #ffd966;
        }
        .sectors-section .section-header h2 { color: white; }
        .sectors-section .section-header p { color: rgba(255,255,255,0.85); }
        .sectors-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 24px;
        }
        .sector-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          padding: 24px 20px;
          text-align: center;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
        }
        .sector-card:hover {
          transform: translateY(-6px);
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.2);
        }
        .sector-icon {
          width: 70px;
          height: 70px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          transition: transform 0.3s;
        }
        .sector-card:hover .sector-icon { transform: scale(1.05); }
        .sector-icon i { font-size: 32px; color: #ffd966; }
        .sector-card h4 { font-size: 16px; font-weight: 700; margin-bottom: 10px; color: white; }
        .sector-card p { font-size: 12px; color: rgba(255,255,255,0.8); margin-bottom: 12px; }
        .sector-card span {
          display: inline-block;
          font-size: 13px;
          font-weight: 700;
          color: #ffd966;
          background: rgba(0,0,0,0.3);
          padding: 4px 12px;
          border-radius: 30px;
        }

        /* ========== STEPS ========== */
        .steps-section {
          padding: 80px 32px;
          background: #f8f9fa;
        }
        .steps-grid-premium {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin-top: 40px;
        }
        .step-card {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          min-height: 380px;
          background-size: cover;
          background-position: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }
        .step-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 30px rgba(0, 0, 0, 0.2);
        }
        .step-card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.5), rgba(139, 90, 43, 0.5));
          z-index: 1;
        }
        .step-card-content {
          position: relative;
          z-index: 2;
          padding: 32px;
          text-align: center;
          color: white;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .step-number {
          width: 48px;
          height: 48px;
          background: white;
          color: #8B5A2B;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 20px;
          margin: 0 auto 20px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .step-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          border-radius: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .step-icon i { font-size: 36px; color: #ffd966; }
        .step-card-content h3 { font-size: 22px; font-weight: 700; margin-bottom: 16px; }
        .step-card-content p { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.9); }

        /* ========== SÉCURITÉ & CONFIANCE ========== */
        .section-header-center {
          text-align: center;
          margin-bottom: 48px;
        }
        .section-title-center {
          font-size: 36px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
          position: relative;
          display: inline-block;
        }
        .section-title-center::after {
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
        .section-subtitle-center {
          color: #6c757d;
          font-size: 16px;
          margin-top: 20px;
        }
        .horizontal-security-container {
          display: flex;
          gap: 40px;
          align-items: stretch;
          margin-top: 20px;
          margin-bottom: 40px;
        }
        .horizontal-security-left { flex: 1; width: 50%; }
        .image-frame-small {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.7) 100%);
          border-radius: 24px;
          padding: 8px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        .security-small-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 18px;
          min-height: 280px;
          max-height: 320px;
        }
        .horizontal-security-right { flex: 1; width: 50%; }
        .security-text-content-small {
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
        .security-main-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.3px;
          color: #ffd966;
        }
        .security-desc {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .security-points-center {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .security-point-center {
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
        .security-point-center:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-5px);
        }
        .security-point-center i {
          font-size: 28px;
          color: #ffd966;
        }
        .security-point-center strong {
          font-size: 14px;
          font-weight: 700;
          color: white;
        }
        .security-point-center span {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
        }
        .security-link-center {
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
        .security-link-center:hover {
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

/* ========== RESPONSIVE PARTNERS & TESTIMONIALS ========== */
@media (max-width: 1000px) {
  .partners-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .partners-header h2,
  .testimonials-header h2 {
    font-size: 36px;
  }
  .testimonials-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}
@media (max-width: 700px) {
  .partners-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .partners-header h2,
  .testimonials-header h2 {
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
  .testimonials-grid {
    grid-template-columns: 1fr;
  }
  .testimonial-premium {
    padding: 24px;
  }
}
@media (max-width: 480px) {
  .partners-grid {
    grid-template-columns: 1fr;
  }
}
        /* ========== RESPONSIVE ========== */
        @media (max-width: 1000px) {
          .nav-links { display: none; }
          .offres-grid-premium { grid-template-columns: repeat(2, 1fr); }
          .sectors-grid { grid-template-columns: repeat(3, 1fr); }
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .loading-skeleton-premium { grid-template-columns: repeat(2, 1fr); }
          .horizontal-security-container { flex-direction: column; }
          .horizontal-security-left, .horizontal-security-right { width: 100%; }
          .security-points-center { flex-direction: column; gap: 12px; }
          .security-point-center { flex-direction: row; justify-content: center; gap: 16px; padding: 14px 20px; }
        }
        @media (max-width: 700px) {
          .offres-grid-premium { grid-template-columns: 1fr; }
          .sectors-grid { grid-template-columns: repeat(2, 1fr); }
          .footer-grid { grid-template-columns: 1fr; }
          .loading-skeleton-premium { grid-template-columns: 1fr; }
          .hero-offres-title { font-size: 32px; }
          .hero-offres-illustration { display: none; }
          .card-premium-details { gap: 12px; }
          .card-premium-footer { flex-direction: column; gap: 15px; align-items: flex-start; }
          .steps-grid-premium { grid-template-columns: 1fr; gap: 24px; }
          .step-card { min-height: 320px; }
          .section-title-center { font-size: 28px; }
          .security-small-image { min-height: 200px; }
        }
        @media (max-width: 480px) {
          .sectors-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}