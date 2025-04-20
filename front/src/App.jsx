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
import AddDossier from './pages/Secretaire/AddDossier';
import PatientsMedecin from "./pages/Medecin/Patients";
import EditPatient from "./pages/Medecin/EditPatient";
import Dicom from "./pages/Medecin/ImageDicom";
import Medecins from "./pages/Secretaire/Medecins";

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
          {/* Patient */}
          <Route path="/patient" element={
            <PrivateRoute allowedRoles={['patient']}>
              <Patient />
            </PrivateRoute>
          } />

          {/* Médecin avec sous-routes */}
          <Route path="/medecin" element={
            <PrivateRoute allowedRoles={['medecin']}>
              <Outlet />
            </PrivateRoute>
          }>
            <Route index element={<MedecinDashboard />} />
            <Route path="patients" element={<PatientsMedecin />} />
            <Route path="dossier-medical/:id" element={<EditPatient />} />
            <Route path="dicom" element={<Dicom />} />

          </Route>

          {/* Secrétaire avec sous-routes */}
          <Route path="/secretaire" element={
            <PrivateRoute allowedRoles={['secretaire']}>
              <Outlet />
            </PrivateRoute>
          }>
            <Route index element={<Secretaire />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patient/:id" element={<PatientDetails />} />
            <Route path="schedule" element={<AppointmentSecretaire />} />
            <Route path="patient/add" element={<AddPatient />} />
            <Route path="dossier/:id" element={<Dossier />} />
            <Route path="dossier" element={<Dossier />} />
            <Route path="patients/:id/dossier/add" element={<AddDossier />} />
            <Route path="medecins" element={<Medecins />} />
            {/* Autres sous-routes pour la secrétaire */}

          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
