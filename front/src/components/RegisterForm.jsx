import React from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from 'axios';

function RegisterForm() {

  const navigate = useNavigate();

  const [data, setData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    role: 'patient'
  });

  const registerUser = async (e) => {
    e.preventDefault();
    const { firstname, lastname, email, password, role } = data;

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`,
        { firstname, lastname, email, password, role },
        { withCredentials: true }
      );

      if (response.data.error) {
        console.error(response.data.error);
      } else {
        setData({ firstname: '', lastname: '', email: '', password: '', role: 'patient' });

        // Redirection en fonction du rôle
        if (response.data.user?.role === "secretaire") {
          navigate('/secretaire');
        } else {
          navigate('/patient'); // Par défaut, rediriger les autres utilisateurs ici
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      // toast.error("Une erreur s'est produite. Veuillez réessayer.");
    }
  };

  return (
    <div className="form-box register">
      <form onSubmit={registerUser}>
        <h1>Registration</h1>
        <div className="input-box">
          <input type="text" placeholder="Prénom" required
            value={data.firstname}
            onChange={(e) => setData({ ...data, firstname: e.target.value })}
          />
          <i className='bx bxs-user'></i>
        </div>
        <div className="input-box">
          <input type="text" placeholder="Nom" required
            value={data.lastname}
            onChange={(e) => setData({ ...data, lastname: e.target.value })}
          />
          <i className='bx bxs-user'></i>
        </div>
        <div className="input-box">
          <input type="email" placeholder="Email" required
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <i className='bx bxs-envelope'></i>
        </div>
        <div className="input-box">
          <input type="password" placeholder="Mot de passe" required
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
          <i className='bx bxs-lock-alt'></i>
        </div>
        <button type="submit" className="btn">S'inscrire</button>
        <p>or Register with Social Platforms</p>
        <div className="social-icons">
          <a href="#"><i className='bx bxl-google'></i></a>
          <a href="#"><i className='bx bxl-facebook'></i></a>
          <a href="#"><i className='bx bxl-github'></i></a>
          <a href="#"><i className='bx bxl-linkedin'></i></a>
        </div>
      </form>
    </div>
  );
}

export default RegisterForm;