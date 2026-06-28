import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 🔥 login() va maintenant lancer une erreur si elle échoue
      const loggedUser = await login(email, password);
      
      // Si on arrive ici, la connexion a réussi
      if (loggedUser && loggedUser.role) {
        // Redirection basée sur le rôle
        if (loggedUser.role === 'admin') {
          toast.success('Bienvenue administrateur !');
          navigate('/dashboard-admin');
        } else if (loggedUser.role === 'recruteur') {
          toast.success('Bienvenue recruteur !');
          navigate('/dashboard-recruteur');
        } else if (loggedUser.role === 'etudiant') {
          toast.success('Bienvenue étudiant !');
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }
      
    } catch (error) {
      // 🔥 L'ERREUR EST CAPTURÉE ICI
      console.error('🔴 Erreur de connexion:', error);
      
      // Le toast est déjà affiché dans AuthContext, mais on peut en ajouter un autre
      // toast.error(error.response?.data?.message || 'Erreur de connexion');
      
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
            <h2>Bienvenue</h2>
            <p>Entrez vos identifiants pour accéder à votre espace.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Adresse email</label>
              <div className="input-wrapper">
                <i className="fas fa-envelope input-icon"></i>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-row">
                <label htmlFor="password">Mot de passe</label>
                <a href="#" className="forgot-link">Mot de passe oublié ?</a>
              </div>
              <div className="password-input">
                <div className="input-wrapper">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="*********"
                    required
                  />
                </div>
                <i
                  className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-password`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>
            </div>

            <div className="checkbox-group">
              <input type="checkbox" name="remember" id="remember" />
              <label htmlFor="remember">Rester connecté</label>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              <i className="fas fa-arrow-right-to-bracket"></i>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <p className="register-link">
              Nouveau ici ?
              <Link to="/register">Créer un compte</Link>
            </p>
          </form>
        </div>

        <div className="hero-side">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <div className="hero-quote">
              "Le stage est le pont entre l'école et la vie professionnelle"
            </div>
            <div className="hero-description">
              Trouvez le stage qui correspond à vos compétences et construisez votre avenir.
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Offres disponibles</span>
              </div>
              <div className="stat">
                <span className="stat-number">200+</span>
                <span className="stat-label">Entreprises partenaires</span>
              </div>
              <div className="stat">
                <span className="stat-number">98%</span>
                <span className="stat-label">Satisfaction</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

        .form-group input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          background: #fafbfc;
        }

        .form-group input:focus {
          outline: none;
          border-color: #8B5A2B;
          box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
          background: white;
        }

        .password-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .forgot-link {
          font-size: 12px;
          color: #8B5A2B;
          text-decoration: none;
          font-weight: 500;
        }
        .forgot-link:hover {
          text-decoration: underline;
        }

        .password-input {
          position: relative;
        }
        .password-input input {
          padding-right: 46px;
        }
        .toggle-password {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          color: #9ca3af;
          font-size: 16px;
          transition: color 0.2s;
          z-index: 2;
          background: transparent;
        }
        .toggle-password:hover {
          color: #8B5A2B;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .checkbox-group input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #8B5A2B;
        }
        .checkbox-group label {
          font-size: 13px;
          color: #374151;
          cursor: pointer;
          margin: 0;
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
          background-image: url('/images/login.png');
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

        @media (max-width: 900px) {
          .login-container { flex-direction: column; max-width: 550px; width: 100%; }
          .form-side { width: 100%; padding: 32px 28px; }
          .hero-side { width: 100%; min-height: 400px; }
          .hero-content { padding: 40px 30px; }
          .hero-quote { font-size: 22px; }
          .hero-description { font-size: 14px; }
          .hero-stats { gap: 20px; }
          .stat-number { font-size: 24px; }
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
          .stat-label { font-size: 10px; }
        }
      `}</style>
    </div>
  );
}