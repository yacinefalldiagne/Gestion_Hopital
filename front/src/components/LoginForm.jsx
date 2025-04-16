import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Public.module.css';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loginUser = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      const { token, role } = response.data;

      // Stocker le token dans localStorage
      localStorage.setItem('token', token);

      // Rediriger en fonction du rôle
      if (role === 'patient') {
        navigate('/patient');
      } else if (role === 'medecin') {
        navigate('/medecin');
      } else if (role === 'secretaire') {
        navigate('/secretaire');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la connexion');
    }
  };

  return (
    <div className={`${styles.formBox} ${styles.login}`}>
      <form onSubmit={loginUser}>
        <h1>Connexion</h1>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.inputBox}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <i className="bx bxs-envelope"></i>
        </div>
        <div className={styles.inputBox}>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <i className="bx bxs-lock-alt"></i>
        </div>
        <button type="submit" className={styles.btn}>
          Se connecter
        </button>
      </form>
    </div>
  );
}

export default LoginForm;