import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 3000); // Redirige après 3 secondes
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h2>Accès non autorisé</h2>
            <p>Vous allez être redirigé vers la page de connexion...</p>
        </div>
    );
};

export default Unauthorized;