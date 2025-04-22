import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const PrivateRoute = ({ children, allowedRoles }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          withCredentials: true, // Ensure cookies are sent
        });
        setUser(response.data);
      } catch (error) {
        console.error('Erreur lors de la vérification de l’utilisateur:', error);
        // If 401, clear any stored state and redirect to login
        if (error.response?.status === 401) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />; // Redirect to an unauthorized page or login
  }

  return children;
};

export default PrivateRoute;