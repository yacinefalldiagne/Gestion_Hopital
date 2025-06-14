import React, { useState, useEffect, useContext } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Outlet,
} from "react-router-dom";
import { ThemeContext } from "./components/ThemeContext";
import styles from "./assets/Public.module.css";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Patient from "./pages/Patient/PatientDashboard";
import MedecinDashboard from "./pages/Medecin/MedecinDashboard";
import Secretaire from "./pages/Secretaire/SecretaireDashboard";
import LandingPage from "./pages/LandingPage";
import Patients from "./pages/Secretaire/Patients";
import AppointmentSecretaire from "./pages/Secretaire/Appointment";
import PatientDetails from "./pages/Secretaire/PatientDetails";
import AddPatient from "./pages/Secretaire/AddPatient";
import Dossier from "./pages/Secretaire/Dossier";
import AddDossier from "./pages/Secretaire/AddDossier";
import PatientsMedecin from "./pages/Medecin/Patients";
import EditPatient from "./pages/Medecin/EditPatient";
import Dicom from "./pages/Medecin/ImageDicom";
import Medecins from "./pages/Secretaire/Medecins";
import MedicalRecord from "./pages/Patient/MedicalRecord";
import BookAppointment from "./pages/Patient/BookAppointment";
import DownloadReport from "./pages/Patient/DownloadReport";
import ReportPage from "./pages/Medecin/ReportPage";
import Rendezvous from "./pages/Medecin/Rendezvous";
import PatientDetailsMedecin from "./pages/Medecin/PatientDetails";
import MedicalRecords from "./pages/Medecin/MedicalRecords";
import MedicalReports from "./pages/Medecin/MedicalReport";
import DicomImages from "./pages/Medecin/DicomImages";
import TeleMedecine from "./pages/Medecin/TeleMedecine";
import CompteRendu from "./pages/Medecin/CompteRendu";
import Unauthorized from './components/Unauthorized'; // adapte le chemin si nécessaire
import MedecinNonDicom from './pages/Medecin/NonDicomImage';

 
function App() {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [userRole, setUserRole] = useState(
    localStorage.getItem("userRole") || null
  );

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/landing");
    }
    if (location.pathname === "/register") {
      setIsActive(true);
    } else if (location.pathname === "/login") {
      setIsActive(false);
    }

    // Mettre à jour userRole en fonction du chemin
    if (location.pathname.startsWith("/patient")) {
      setUserRole("patient");
    } else if (location.pathname.startsWith("/medecin")) {
      setUserRole("medecin");
    } else if (location.pathname.startsWith("/secretaire")) {
      setUserRole("secretaire");
    } else {
      setUserRole(null);
    }
    localStorage.setItem("userRole", userRole); // Synchroniser avec localStorage
  }, [location.pathname, navigate]);

  const handleRegisterClick = () => {
    setIsActive(true);
    navigate("/register");
  };

  const handleLoginClick = () => {
    setIsActive(false);
    navigate("/login");
  };

  const AuthFormContainer = () => (
    <div className={styles.wrapper}>
      <div
        className={`${styles.container} ${isActive ? styles.containerActive : ""
          }`}
      >
        <div className={`${styles.formBox} ${styles.formBoxLogin}`}>
          <LoginForm />
        </div>
        <div className={`${styles.formBox} ${styles.formBoxRegister}`}>
          <RegisterForm />
        </div>
        <div className={styles.toggleBox}>
          <div className={`${styles.togglePanel} ${styles.togglePanelLeft}`}>
            <a href="/landing" className={styles.backToHome}>
              <i className="bx bx-arrow-back"></i>
            </a>
            <h1>Bonjour, Bienvenue !</h1>
            <p>Vous n'avez pas de compte ?</p>
            <button className={styles.btn} onClick={handleRegisterClick}>
              S'inscrire
            </button>
          </div>
          <div className={`${styles.togglePanel} ${styles.togglePanelRight}`}>
            <a href="/landing" className={styles.backToHome}>
              <i className="bx bx-arrow-back"></i>
            </a>
            <h1>Bon retour !</h1>
            <p>Vous avez déjà un compte ?</p>
            <button className={styles.btn} onClick={handleLoginClick}>
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "dark bg-gray-900" : "bg-gray-100"
        } transition-all duration-300`}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<AuthFormContainer />} />
        <Route path="/register" element={<AuthFormContainer />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<Layout userRole={userRole} />}>
          <Route
            path="/patient"
            element={
              <PrivateRoute allowedRoles={["patient"]}>
                <Outlet />
              </PrivateRoute>
            }
          >
            <Route index element={<Patient />} />
            <Route path="medical-record" element={<MedicalRecord />} />
            <Route path="book-appointment" element={<BookAppointment />} />
            <Route path="download-report" element={<DownloadReport />} />
          </Route>

          <Route
            path="/medecin"
            element={
              <PrivateRoute allowedRoles={["medecin"]}>
                <Outlet />
              </PrivateRoute>
            }
          >
            <Route index element={<MedecinDashboard />} />
            <Route path="patients" element={<PatientsMedecin />} />
            <Route path="dossier-medical/:id" element={<EditPatient />} />
            <Route path="dicom" element={<Dicom />} />
            <Route path="non-dicom" element={<MedecinNonDicom />} />{" "}
            {/* Correction ici */}
            <Route path="report" element={<ReportPage />} />
            <Route path="rendezvous" element={<Rendezvous />} />
            <Route
              path="patient/:patientId"
              element={<PatientDetailsMedecin />}
            />
            <Route
              path="patient/:patientId/reports"
              element={<MedicalReports />}
            />
            <Route
              path="patient/:patientId/record"
              element={<MedicalRecords />}
            />
            <Route path="patient/:patientId/dicom" element={<DicomImages />} />
            <Route path="tele" element={<TeleMedecine />} />
            <Route path="history" element={<CompteRendu />} />
          </Route>

          <Route
            path="/secretaire"
            element={
              <PrivateRoute allowedRoles={["secretaire"]}>
                <Outlet />
              </PrivateRoute>
            }
          >
            <Route index element={<Secretaire />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patient/:id" element={<PatientDetails />} />
            <Route path="schedule" element={<AppointmentSecretaire />} />
            <Route path="patient/add" element={<AddPatient />} />
            <Route path="dossier/:id" element={<Dossier />} />{" "}
            {/* Supprimez le doublon ci-dessous si inutile */}
            <Route path="patients/:id/dossier/add" element={<AddDossier />} />
            <Route path="medecins" element={<Medecins />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
