import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./index.css";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import TogglePanel from "./components/TogglePanel";
import Dashboard from "./pages/Patient/PatientDashboard";

function App() {
  const [isActive, setIsActive] = useState(false);

  const handleRegisterClick = () => {
    setIsActive(true);
  };

  const handleLoginClick = () => {
    setIsActive(false);
  };

  return (
    <div className="app-container">
      <Routes>
        <Route
          path="/"
          element={
            <div className={`container ${isActive ? "active" : ""}`}>
              <LoginForm />
              <RegisterForm />
              <TogglePanel
                onRegisterClick={handleRegisterClick}
                onLoginClick={handleLoginClick}
              />
            </div>
          }
        />
        <Route path="/patient" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

export default App;
