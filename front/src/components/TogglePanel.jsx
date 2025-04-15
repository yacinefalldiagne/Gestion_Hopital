import React from 'react';
import { Link } from 'react-router-dom';

function TogglePanel({ onRegisterClick, onLoginClick }) {
  return (
    <div className="toggle-box">
      <div className="toggle-panel toggle-left">
        <h1>Bonjour, Bienvenue !</h1>
        <p>Vous n'avez pas de compte ?</p>
        <button className="btn register-btn" onClick={onRegisterClick}>
          S'inscrire
        </button>
        {/* Remplacement du texte par une icône de flèche */}
        <Link to="/landing" className="back-to-home">
          <i className="bx bx-arrow-back"></i>
        </Link>
      </div>
      <div className="toggle-panel toggle-right">
        <h1>Content de vous revoir </h1>
        <p>Vous avez déjà un compte ?</p>
        <button className="btn login-btn" onClick={onLoginClick}>
          Se connecter
        </button>
        {/* Remplacement du texte par une icône de flèche */}
        <Link to="/landing" className="back-to-home">
          <i className="bx bx-arrow-back"></i>
        </Link>
      </div>
    </div>
  );
}

export default TogglePanel;