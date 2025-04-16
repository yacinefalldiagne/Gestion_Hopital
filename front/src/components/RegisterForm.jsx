import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Public.module.css';

function RegisterForm() {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const registerUser = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        prenom,
        nom,
        email,
        password,
        role,
      });

      const { token, role: userRole } = response.data;

      // Stocker le token dans localStorage
      localStorage.setItem('token', token);

      // Rediriger en fonction du rôle
      if (userRole === 'patient') {
        navigate('/patient');
      } else if (userRole === 'medecin') {
        navigate('/medecin');
      } else if (userRole === 'secretaire') {
        navigate('/secretaire');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l’inscription');
    }
  };

  return (
    <div className={`${styles.formBox} ${styles.register}`}>
      <form onSubmit={registerUser}>
        <h1>Inscription</h1>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.inputBox}>
          <input
            type="text"
            placeholder="Prénom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            required
          />
          <i className="bx bxs-user"></i>
        </div>
        <div className={styles.inputBox}>
          <input
            type="text"
            placeholder="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
          <i className="bx bxs-user"></i>
        </div>
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
        <div className={styles.inputBox}>
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="patient">Patient</option>
            <option value="medecin">Médecin</option>
            <option value="secretaire">Secrétaire</option>
          </select>
        </div>
        <button type="submit" className={styles.btn}>
          S'inscrire
        </button>
      </form>
    </div>
  );
}

export default RegisterForm;