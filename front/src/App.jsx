import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './index.css';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import TogglePanel from './components/TogglePanel';
import Dashboard from './pages/Patient/PatientDashboard';
import MedecinDashboard from './pages/Medecin/MedecinDashboard';
import Secretaire from './pages/Secretaire/SecretaireDashboard';
import LandingPage from './pages/LandingPage';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Rediriger vers /landing si l'utilisateur arrive sur /
    if (location.pathname === '/') {
      navigate('/landing');
    }

    // Gérer l'état isActive pour le toggle
    if (location.pathname === '/register') {
      setIsActive(true);
    } else if (location.pathname === '/login') {
      setIsActive(false);
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

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <div className={`container ${isActive ? 'active' : ''}`}>
              <LoginForm />
              <RegisterForm />
              <TogglePanel
                onRegisterClick={handleRegisterClick}
                onLoginClick={handleLoginClick}
              />
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className={`container ${isActive ? 'active' : ''}`}>
              <LoginForm />
              <RegisterForm />
              <TogglePanel
                onRegisterClick={handleRegisterClick}
                onLoginClick={handleLoginClick}
              />
            </div>
          }
        />
        <Route
          path="/patient"
          element={
            <PrivateRoute allowedRoles={['patient']}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/medecin"
          element={
            <PrivateRoute allowedRoles={['medecin']}>
              <MedecinDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/secretaire"
          element={
            <PrivateRoute allowedRoles={['secretaire']}>
              <Secretaire />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;