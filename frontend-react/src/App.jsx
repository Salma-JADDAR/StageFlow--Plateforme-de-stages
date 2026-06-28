import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';
import GuestLayout from './layouts/GuestLayout';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import CompleteProfile from './pages/CompleteProfile';
import DashboardEtudiant from './pages/DashboardEtudiant';
import DashboardRecruteur from './pages/DashboardRecruteur';
import DashboardAdmin from './pages/DashboardAdmin';
import OffresList from './pages/OffresList';
import OffreDetail from './pages/OffreDetail';
import MesCandidatures from './pages/MesCandidatures';
import Recommendations from './pages/Recommendations';
import GestionOffres from './pages/GestionOffres';
import GestionCandidatures from './pages/GestionCandidatures';
import GestionUtilisateurs from './pages/GestionUtilisateurs';
import Profile from './pages/Profile';
import Formations from './pages/Formations';
import Competences from './pages/Competences';
import Notifications from './pages/Notifications';
import CandidaturesRecues from './pages/CandidaturesRecues';
import EntrepriseProfile from './pages/EntrepriseProfile';
import MonCV from './pages/MonCV';
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes publiques SANS AUTHENTIFICATION */}
          <Route element={<GuestLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/offres" element={<OffresList />} />
            <Route path="/offres/:id" element={<OffreDetail />} />
          </Route>

          {/* Routes protégées (nécessite authentification) */}
          <Route element={<PrivateRoute />}>
            <Route path="/complete-profile" element={<CompleteProfile />} />

            <Route element={<MainLayout />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />

              {/* Routes étudiant */}
              <Route element={<RoleRoute allowedRoles={['etudiant']} />}>
                <Route path="/dashboard" element={<DashboardEtudiant />} />
                <Route path="/mes-candidatures" element={<MesCandidatures />} />
                <Route path="/recommandations" element={<Recommendations />} />
                <Route path="/formations" element={<Formations />} />
                <Route path="/competences" element={<Competences />} />
                 <Route path="/mon-cv" element={<MonCV />} /> 
              </Route>

              {/* Routes recruteur */}
              <Route element={<RoleRoute allowedRoles={['recruteur']} />}>
                <Route path="/dashboard-recruteur" element={<DashboardRecruteur />} />
                <Route path="/gestion-offres" element={<GestionOffres />} />
                <Route path="/gestion-candidatures" element={<GestionCandidatures />} />
                {/* ⭐ AJOUT DE LA ROUTE CANDIDATURES REÇUES ⭐ */}
                <Route path="/candidatures-reçues" element={<CandidaturesRecues />} />
                 <Route path="/entreprise-profile" element={<EntrepriseProfile />} /> 
              </Route>

              {/* Routes admin */}
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/dashboard-admin" element={<DashboardAdmin />} />
                <Route path="/gestion-utilisateurs" element={<GestionUtilisateurs />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;