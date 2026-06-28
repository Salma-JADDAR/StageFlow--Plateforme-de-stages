import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';
import axios from 'axios';

export default function Register() {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'etudiant',
    entreprise_id: '',
    poste: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entreprises, setEntreprises] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // État pour le nouveau formulaire d'entreprise avec upload de logo
  const [newEntreprise, setNewEntreprise] = useState({
    nom: '', emailContact: '', telephone: '', ville: '', 
    adresse: '', siteWeb: '', description: '', logoUrl: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [creatingEntreprise, setCreatingEntreprise] = useState(false);
  
  const logoInputRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEntreprises = async () => {
      try {
        const res = await api.get('/entreprises');
        setEntreprises(res.data);
      } catch (error) {
        console.error("Erreur chargement entreprises", error);
      }
    };
    fetchEntreprises();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Gestion du logo
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return null;
    const formData = new FormData();
    formData.append('logo', logoFile);
    try {
        const res = await api.post('/upload/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.url;
    } catch (err) {
        console.error('Erreur upload logo:', err.response?.data || err.message);
        toast.error('Erreur upload logo');
        return null;
    }
  };

  const handleCreateEntreprise = async (e) => {
    e.preventDefault();
    setCreatingEntreprise(true);
    
    let logoUrl = newEntreprise.logoUrl;
    if (logoFile) {
      const uploaded = await handleLogoUpload();
      if (uploaded) logoUrl = uploaded;
    }
    
    try {
      const res = await api.post('/entreprises', { ...newEntreprise, logo: logoUrl });
      setEntreprises([...entreprises, res.data]);
      setForm({ ...form, entreprise_id: res.data.idEntreprise });
      setShowModal(false);
      toast.success('Entreprise ajoutée');
      setNewEntreprise({ 
        nom: '', emailContact: '', telephone: '', ville: '', 
        adresse: '', siteWeb: '', description: '', logoUrl: '' 
      });
      setLogoFile(null);
      setLogoPreview(null);
    } catch (err) {
      toast.error('Erreur création entreprise');
    } finally {
      setCreatingEntreprise(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    const submitData = {
      nom: form.nom,
      prenom: form.prenom,
      email: form.email,
      password: form.password,
      password_confirmation: form.password_confirmation,
      role: form.role
    };
    if (form.role === 'recruteur') {
      if (!form.entreprise_id) {
        toast.error('Veuillez sélectionner une entreprise');
        return;
      }
      submitData.entreprise_id = form.entreprise_id;
      submitData.poste = form.poste;
    }
    setLoading(true);
    try {
      const response = await api.post('/register', submitData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Inscription réussie !');
      
      // 🔥 REDIRECTION SELON LE RÔLE
      const userRole = response.data.user.role;
      
      if (userRole === 'etudiant') {
        // 🔥 Rediriger vers la page de complétion de profil
        navigate('/complete-profile');
      } else if (userRole === 'recruteur') {
        navigate('/dashboard-recruteur');
      } else if (userRole === 'admin') {
        navigate('/dashboard-admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="form-side">
          <div className="logo">
            <h1>StageFlow</h1>
            <span>PLATEFORME DE STAGES</span>
          </div>

          <div className="form-header">
            <h2>Inscription</h2>
            <p>Créez votre compte et commencez votre parcours.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Champs du formulaire */}
            <div className="row-group">
              <div className="form-group">
                <label htmlFor="nom">Nom</label>
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input type="text" id="nom" name="nom" value={form.nom} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="prenom">Prénom</label>
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input type="text" id="prenom" name="prenom" value={form.prenom} onChange={handleChange} required />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Adresse email</label>
              <div className="input-wrapper">
                <i className="fas fa-envelope input-icon"></i>
                <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="row-group">
              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <div className="password-input">
                  <div className="input-wrapper">
                    <i className="fas fa-lock input-icon"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="password_confirmation">Confirmer</label>
                <div className="password-input">
                  <div className="input-wrapper">
                    <i className="fas fa-lock input-icon"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password_confirmation"
                      name="password_confirmation"
                      value={form.password_confirmation}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="password-hint" onClick={() => setShowPassword(!showPassword)}>
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              <span>{showPassword ? 'Masquer' : 'Afficher'} les mots de passe</span>
            </div>

            <div className="form-group">
              <label htmlFor="role">Vous êtes ?</label>
              <div className="input-wrapper">
                <i className="fas fa-user-tag input-icon"></i>
                <select id="role" name="role" value={form.role} onChange={handleChange} className="select-input">
                  <option value="etudiant">Étudiant</option>
                  <option value="recruteur">Recruteur</option>
                </select>
              </div>
            </div>

            {form.role === 'recruteur' && (
              <>
                <div className="form-group">
                  <label htmlFor="entreprise_id">Entreprise</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                      id="entreprise_id"
                      name="entreprise_id"
                      value={form.entreprise_id}
                      onChange={handleChange}
                      className="select-input"
                      style={{ flex: 1 }}
                      required
                    >
                      <option value="">Sélectionnez une entreprise</option>
                      {entreprises.map(ent => (
                        <option key={ent.idEntreprise} value={ent.idEntreprise}>
                          {ent.nom} - {ent.ville}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowModal(true)} className="btn-add-company">
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="poste">Votre poste</label>
                  <div className="input-wrapper">
                    <i className="fas fa-briefcase input-icon"></i>
                    <input type="text" id="poste" name="poste" value={form.poste} onChange={handleChange} required />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn-login" disabled={loading}>
              <i className="fas fa-user-plus"></i>
              {loading ? 'Inscription...' : 'Créer mon compte'}
            </button>

            <p className="register-link">
              Déjà membre ? <Link to="/login">Connectez-vous</Link>
            </p>
          </form>
        </div>

        <div className="hero-side">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <div className="hero-quote">"Construisez votre avenir dès aujourd'hui"</div>
            <div className="hero-description">
              Rejoignez des milliers d'étudiants et d'entreprises sur la première plateforme de stages intelligente.
            </div>
            <div className="hero-stats">
              <div className="stat"><span className="stat-number">500+</span><span className="stat-label">Offres disponibles</span></div>
              <div className="stat"><span className="stat-number">200+</span><span className="stat-label">Entreprises partenaires</span></div>
              <div className="stat"><span className="stat-number">98%</span><span className="stat-label">Satisfaction</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL AJOUT ENTREPRISE - Avec upload de logo en cercle */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-bg"></div>
            <div className="modal-header">
              <h3>Ajouter une entreprise</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateEntreprise}>
              {/* Upload du logo - en cercle */}
              <div className="form-group">
                <label>Logo de l'entreprise</label>
                <div className="logo-upload">
                  <div className="logo-preview">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Aperçu logo" />
                    ) : (
                      <i className="fas fa-building"></i>
                    )}
                  </div>
                  <div className="logo-actions">
                    <button type="button" className="btn-outline" onClick={() => logoInputRef.current.click()}>
                      <i className="fas fa-upload"></i> Choisir un logo
                    </button>
                    {logoPreview && (
                      <button type="button" className="btn-outline danger" onClick={() => { setLogoFile(null); setLogoPreview(null); }}>
                        <i className="fas fa-trash-alt"></i> Supprimer
                      </button>
                    )}
                    <input type="file" ref={logoInputRef} accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                  </div>
                  <small>JPEG, PNG jusqu'à 2 Mo</small>
                </div>
              </div>

              <div className="row-group">
                <div className="form-group">
                  <label>Nom *</label>
                  <input type="text" value={newEntreprise.nom} onChange={e => setNewEntreprise({...newEntreprise, nom: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Email contact *</label>
                  <input type="email" value={newEntreprise.emailContact} onChange={e => setNewEntreprise({...newEntreprise, emailContact: e.target.value})} required />
                </div>
              </div>
              <div className="row-group">
                <div className="form-group">
                  <label>Téléphone *</label>
                  <input type="text" value={newEntreprise.telephone} onChange={e => setNewEntreprise({...newEntreprise, telephone: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Ville</label>
                  <input type="text" value={newEntreprise.ville} onChange={e => setNewEntreprise({...newEntreprise, ville: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Adresse</label>
                <input type="text" value={newEntreprise.adresse} onChange={e => setNewEntreprise({...newEntreprise, adresse: e.target.value})} />
              </div>
              <div className="row-group">
                <div className="form-group">
                  <label>Site web</label>
                  <input type="url" value={newEntreprise.siteWeb} onChange={e => setNewEntreprise({...newEntreprise, siteWeb: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" value={newEntreprise.description} onChange={e => setNewEntreprise({...newEntreprise, description: e.target.value})}></textarea>
              </div>
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" disabled={creatingEntreprise}>{creatingEntreprise ? 'Création...' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-page {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #faf7f2 0%, #efe6d8 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-container {
          max-width: 1200px;
          width: 90%;
          background: white;
          border-radius: 32px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          display: flex;
          flex-wrap: wrap;
        }

        .form-side {
          flex: 1;
          width: 45%;
          padding: 48px 48px;
          background: white;
        }

        .logo {
          text-align: center;
          margin-bottom: 36px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e8ecef;
        }
        .logo h1 {
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          letter-spacing: -0.5px;
          display: inline-block;
          position: relative;
        }
        .logo h1::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 3px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          border-radius: 2px;
        }
        .logo span {
          display: block;
          font-size: 10px;
          font-weight: 600;
          color: #8B5A2B;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 12px;
        }

        .form-header h2 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
          text-align: center;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .form-header p {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 32px;
          text-align: center;
        }

        .form-group { margin-bottom: 24px; }
        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .input-wrapper { position: relative; }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-size: 16px;
        }

        .form-group input,
        .select-input,
        .modal-content input,
        .modal-content select,
        .modal-content textarea {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          background: #fafbfc;
        }

        .form-group input:focus,
        .select-input:focus,
        .modal-content input:focus,
        .modal-content textarea:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
          background: white;
        }

        .select-input {
          appearance: none;
          cursor: pointer;
        }

        textarea {
          resize: vertical;
          padding-top: 12px;
        }

        .row-group {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        .row-group .form-group {
          flex: 1;
          margin-bottom: 0;
        }

        .password-input {
          position: relative;
        }
        .password-input input {
          padding-right: 46px;
        }

        .password-hint {
          text-align: right;
          margin: 16px 0 28px;
          cursor: pointer;
          font-size: 12px;
          color: #8B5A2B;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 6px;
        }
        .password-hint i {
          font-size: 14px;
        }
        .password-hint:hover {
          text-decoration: underline;
        }

        .btn-login {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #5D3A1A, #8B5A2B);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(93, 58, 26, 0.3);
        }
        .btn-login:disabled {
          opacity: 0.6;
          transform: none;
        }

        .register-link {
          text-align: center;
          margin-top: 28px;
          font-size: 13px;
          color: #6b7280;
        }
        .register-link a {
          color: #8B5A2B;
          text-decoration: none;
          font-weight: 700;
          transition: color 0.2s;
          margin-left: 5px;
        }
        .register-link a:hover {
          color: #5D3A1A;
          text-decoration: underline;
        }

        .hero-side {
          flex: 1;
          width: 55%;
          position: relative;
          background-image: url('/images/registre.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          min-height: 600px;
        }
        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(93, 58, 26, 0.85) 0%, rgba(139, 90, 43, 0) 100%);
        }
        .hero-content {
          position: relative;
          z-index: 2;
          color: white;
          padding: 50px 40px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .hero-quote {
          font-size: 40px;
          font-weight: 700;
          line-height: 1.3;
          color: white;
          margin-bottom: 20px;
          text-align: center;
        }
        .hero-quote::before {
          content: "«";
          font-size: 40px;
          opacity: 0.5;
          margin-right: 5px;
        }
        .hero-quote::after {
          content: "»";
          font-size: 40px;
          opacity: 0.5;
          margin-left: 5px;
          vertical-align: top;
        }
        .hero-description {
          font-size: 18px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.9);
          max-width: 90%;
          text-align: center;
          margin: 0 auto 30px auto;
        }
        .hero-stats {
          display: flex;
          gap: 30px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-number {
          font-size: 32px;
          font-weight: 800;
          color: #ffd966;
        }
        .stat-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 5px;
        }

        .btn-add-company {
          background: #8B5A2B;
          color: white;
          border: none;
          border-radius: 12px;
          width: 42px;
          height: 42px;
          cursor: pointer;
          font-size: 18px;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-add-company:hover {
          background: #5D3A1A;
          transform: scale(1.02);
        }

        /* Styles pour l'upload du logo en cercle */
        .logo-upload {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .logo-preview {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 3px solid #e2e8f0;
        }
        .logo-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .logo-preview i {
          font-size: 60px;
          color: #cbd5e1;
        }
        .logo-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .btn-outline {
          background: transparent;
          border: 1.5px solid #8B5A2B;
          color: #8B5A2B;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-outline:hover {
          background: #8B5A2B;
          color: white;
        }
        .btn-outline.danger {
          border-color: #dc2626;
          color: #dc2626;
        }
        .btn-outline.danger:hover {
          background: #dc2626;
          color: white;
        }
        .logo-upload small {
          font-size: 11px;
          color: #64748b;
        }

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
          z-index: 1000;
        }
        .modal-content {
          position: relative;
          background: transparent;
          max-width: 600px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
          border-radius: 24px;
          padding: 0;
          box-shadow: 0 20px 35px rgba(0,0,0,0);
        }
        .modal-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/entreprise.png');
          background-size: cover;
          background-position: center;
          border-radius: 24px;
          filter: brightness(0.3);
          z-index: 0;
        }
        .modal-header, .modal-content form, .modal-buttons {
          position: relative;
          z-index: 2;
          backdrop-filter: blur(5px);
          border-radius: 24px 24px 0 0;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        .modal-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: white;
          text-align: center;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: white;
        }
        .modal-content form {
          padding: 24px;
        }
        .modal-content .form-group label {
          color: white;
        }
        .modal-content input, .modal-content select, .modal-content textarea {
          background: rgba(255,255,255,0.9);
          border-color: rgba(255,255,255,0.5);
        }
        .modal-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px 24px;
          border-radius: 0 0 24px 24px;
        }
        .modal-buttons button {
          padding: 8px 20px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }
        .modal-buttons button[type="button"] {
          background: rgba(255,255,255,0.8);
          color: #374151;
        }
        .modal-buttons button[type="submit"] {
          background: #8B5A2B;
          color: white;
        }
        .modal-buttons button:disabled {
          opacity: 0.6;
        }

        @media (max-width: 900px) {
          .login-container { flex-direction: column; max-width: 550px; width: 100%; }
          .form-side { width: 100%; padding: 32px 28px; }
          .hero-side { width: 100%; min-height: 400px; }
          .hero-quote { font-size: 22px; }
          .hero-description { font-size: 14px; }
          .hero-stats { gap: 20px; }
          .stat-number { font-size: 24px; }
          .row-group { flex-direction: column; gap: 20px; }
        }

        @media (max-width: 600px) {
          .login-page { padding: 12px; }
          .form-side { padding: 24px 20px; }
          .form-header h2 { font-size: 24px; }
          .hero-side { min-height: 350px; }
          .hero-content { padding: 30px 20px; }
          .hero-quote { font-size: 18px; }
          .hero-description { font-size: 13px; }
          .stat-number { font-size: 20px; }
        }

        @media (max-width: 480px) {
          .form-side { padding: 20px 16px; }
          .form-header h2 { font-size: 22px; }
          .hero-side { min-height: 300px; }
          .hero-content { padding: 25px 16px; }
          .hero-quote { font-size: 16px; }
          .hero-description { font-size: 12px; }
          .btn-login { font-size: 14px; padding: 12px; }
          .stat-number { font-size: 18px; }
          .logo-preview { width: 80px; height: 80px; }
          .logo-preview i { font-size: 40px; }
        }
      `}</style>
    </div>
  );
}