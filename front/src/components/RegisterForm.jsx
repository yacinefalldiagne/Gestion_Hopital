import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../assets/Public.module.css';

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

        const { role: userRole } = response.data; // Pas besoin de token ici

        // Supprimez cette ligne
        // localStorage.setItem('token', token);

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
    <form onSubmit={registerUser} className={styles.form}>
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
      <p>ou inscrivez-vous avec les plateformes sociales</p>
      <div className={styles.socialIcons}>
        <a href="#"><i className="bx bxl-google"></i></a>
        <a href="#"><i className="bx bxl-facebook"></i></a>
        <a href="#"><i className="bx bxl-github"></i></a>
        <a href="#"><i className="bx bxl-linkedin"></i></a>
      </div>
    </form>
  );
}

export default RegisterForm;