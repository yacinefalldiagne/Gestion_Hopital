import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import styles from './components/Public.module.css';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import TogglePanel from './components/TogglePanel';
import Patient from './pages/Patient/PatientDashboard';
import MedecinDashboard from './pages/Medecin/MedecinDashboard';
import Secretaire from './pages/Secretaire/SecretaireDashboard';
import LandingPage from './pages/LandingPage';
import Patients from './pages/Secretaire/Patients';
import AppointmentSecretaire from './pages/Secretaire/Appointment';
import PatientDetails from './pages/Secretaire/PatientDetails';
import AddPatient from './pages/Secretaire/AddPatient';
import Dossier from './pages/Secretaire/Dossier';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/landing');
    }
    if (location.pathname === '/register') {
      setIsActive(true);
    } else if (location.pathname === '/login') {
      setIsActive(false);
    }

    if (location.pathname.startsWith('/patient')) {
      setUserRole('patient');
    } else if (location.pathname.startsWith('/medecin')) {
      setUserRole('medecin');
    } else if (location.pathname.startsWith('/secretaire')) {
      setUserRole('secretaire');
    } else {
      setUserRole(null);
    }
  }, [location.pathname, navigate]);

  const handleRegisterClick = () => {
    setIsActive(true);
    navigate('/register');
  };

  const handleLoginClick = () => {
    setIsActive(false);
    navigate('/login');
  };

  const AuthFormContainer = () => (
    <div className={styles.wrapper}>
      <div className={`${styles.container} ${isActive ? styles.containerActive : ''}`}>
        <LoginForm />
        <RegisterForm />
        <TogglePanel
          onRegisterClick={handleRegisterClick}
          onLoginClick={handleLoginClick}
        />
      </div>
    </div>
  );

  return (
    <div className={styles.appContainer}>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<AuthFormContainer />} />
        <Route path="/register" element={<AuthFormContainer />} />

        {/* Routes privées avec Layout */}
        <Route element={<Layout userRole={userRole} />}>
          {/* Route patient */}
          <Route path="/patient" element={
            <PrivateRoute allowedRoles={['patient']}>
              <Patient />
            </PrivateRoute>
          } />

          {/* Route médecin */}
          <Route path="/medecin" element={
            <PrivateRoute allowedRoles={['medecin']}>
              <MedecinDashboard />
            </PrivateRoute>
          } />

          {/* Route secrétaire avec sous-routes */}
          <Route path="/secretaire" element={
            <PrivateRoute allowedRoles={['secretaire']}>
              <Outlet />
            </PrivateRoute>
          }>
            {/* Page d'accueil secrétaire */}
            <Route index element={<Secretaire />} />
            {/* Sous-route pour les patients */}
            <Route path="patients" element={<Patients />} />
            {/* Sous-route pour les détails d'un patient */}
            <Route path="patient/:id" element={<PatientDetails />} />
            {/* Sous-route pour les rendez-vous */}
            <Route path="schedule" element={<AppointmentSecretaire />} />
            <Route path="patient/add" element={<AddPatient />} />
            <Route path="dossier/:id" element={<Dossier />} />
            <Route path="dossier" element={<Dossier />} />
            {/* Autres sous-routes pour la secrétaire */}

          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;