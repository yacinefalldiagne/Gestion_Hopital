import axios from 'axios';
import { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext({});

function UserContextProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async (retries = 3, delay = 1000) => {
            for (let i = 0; i < retries; i++) {
                try {
                    console.log(`Tentative ${i + 1} de fetchUser`); // Débogage
                    const response = await axios.get('http://localhost:5000/api/auth/profile', {
                        withCredentials: true,
                    });
                    console.log('User profile response:', response.data); // Débogage
                    if (response.data && response.data._id && response.data.role) {
                        setUser(response.data);
                        setLoading(false);
                        return;
                    } else {
                        console.error('Données utilisateur invalides:', response.data);
                    }
                } catch (error) {
                    console.error(`Erreur lors de la vérification de l’utilisateur (tentative ${i + 1}):`, error);
                    if (error.response?.status === 401 && i < retries - 1) {
                        // Attendre avant de réessayer en cas de 401
                        await new Promise((resolve) => setTimeout(resolve, delay));
                    } else {
                        setUser(null);
                        setLoading(false);
                        return;
                    }
                }
            }
            console.error('Échec de fetchUser après toutes les tentatives');
            setUser(null);
            setLoading(false);
        };

        fetchUser();
    }, []);

    const logout = async () => {
        try {
            await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
            setUser(null);
            setLoading(false);
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default UserContextProvider;