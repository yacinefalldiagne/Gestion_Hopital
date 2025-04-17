import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Logout = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post(
                'http://localhost:5000/api/auth/logout',
                {},
                { withCredentials: true }
            );
            navigate('/login');
        } catch (err) {
            console.error('Erreur lors de la déconnexion:', err);
        }
    };

    return (
        <button onClick={handleLogout}>Se déconnecter</button>
    );
};

export default Logout;