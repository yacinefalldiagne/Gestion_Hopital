import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Public.module.css';

function TogglePanel({ onRegisterClick, onLoginClick }) {
  return (
    <div className={styles.toggleBox}>
      <div className={`${styles.togglePanel} ${styles.togglePanelLeft}`}>
        <h1>Bonjour, Bienvenue !</h1>
        <p>Vous n'avez pas de compte ?</p>
        <button className={styles.btn} onClick={onRegisterClick}>
          S'inscrire
        </button>
        <Link to="/landing" className={styles.backToHome}>
          <i className="bx bx-arrow-back"></i>
        </Link>
      </div>
      <div className={`${styles.togglePanel} ${styles.togglePanelRight}`}>
        <h1>Content de vous revoir</h1>
        <p>Vous avez déjà un compte ?</p>
        <button className={styles.btn} onClick={onLoginClick}>
          Se connecter
        </button>
        <Link to="/landing" className={styles.backToHome}>
          <i className="bx bx-arrow-back"></i>
        </Link>
      </div>
    </div>
  );
}

export default TogglePanel;