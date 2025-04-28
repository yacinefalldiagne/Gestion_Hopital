import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';

const Appointments = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour récupérer les rendez-vous avec réessai
  const fetchAppointments = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        setLoading(true);
        console.log(`Tentative ${i + 1} de fetchAppointments pour user._id:`, user._id); // Débogage
        const response = await axios.get(
          `http://localhost:5000/api/rendezvous/patient/${user._id}`,
          { withCredentials: true }
        );
        console.log('Réponse de fetchAppointments:', response.data); // Débogage
        setAppointments(response.data);
        setError(null);
        return;
      } catch (err) {
        console.error(`Erreur lors de fetchAppointments (tentative ${i + 1}):`, err);
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          setError('Impossible de récupérer les rendez-vous après plusieurs tentatives');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Appeler la fonction au montage du composant
  useEffect(() => {
    console.log('Appointments useEffect:', { user, authLoading }); // Débogage
    if (authLoading) {
      // Attendre que l'authentification soit terminée
      return;
    }
    if (!user || !user._id || user.role !== 'patient') {
      setLoading(false);
      setError('Accès réservé aux patients. Veuillez vous connecter.');
      console.warn('Utilisateur invalide ou non-patient:', user); // Débogage
      return;
    }
    fetchAppointments();
  }, [user, authLoading]);

  // Déterminer la couleur en fonction du statut
  const getAppointmentColor = (statut) => {
    switch (statut) {
      case 'En cours':
        return 'bg-green-500 text-white';
      case 'Planifié':
        return 'bg-blue-500 text-white';
      case 'Annulé':
        return 'bg-red-500 text-white';
      case 'Terminé':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Afficher un écran de chargement pendant que l'authentification est en cours
  if (authLoading) {
    return (
      <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <p className="text-center text-gray-600">Chargement de l'utilisateur...</p>
        </div>
      </div>
    );
  }

  // Vérification du rôle dans le rendu
  if (!user || !user._id || user.role !== 'patient') {
    return (
      <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <p className="text-center text-red-600 font-semibold">
            Accès réservé aux patients. Veuillez vous connecter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Mes rendez-vous</h1>

        {/* Légende des statuts */}
        <div className="flex justify-center space-x-6 mb-6 text-sm">
          {[
            { status: 'En cours', color: 'bg-green-500' },
            { status: 'Planifié', color: 'bg-blue-500' },
            { status: 'Terminé', color: 'bg-gray-500' },
            { status: 'Annulé', color: 'bg-red-500' },
          ].map((item) => (
            <div key={item.status} className="flex items-center">
              <span className={`w-4 h-4 ${item.color} rounded mr-2`}></span>
              {item.status}
            </div>
          ))}
        </div>

        {/* États de chargement et d'erreur */}
        {loading && <p className="text-center text-gray-600">Chargement...</p>}
        {error && <p className="text-center text-red-600">{error}</p>}

        {/* Tableau des rendez-vous */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            {appointments.length > 0 ? (
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Heure</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Médecin</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Motif</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 border-b text-sm">
                        {new Date(appointment.dateRendezVous).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 border-b text-sm">
                        {new Date(appointment.heureDebut).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 border-b text-sm">
                        {`${appointment.medecin?.prenom || ''} ${appointment.medecin?.nom || ''}` || 'Médecin inconnu'}
                      </td>
                      <td className="py-3 px-4 border-b text-sm">
                        {appointment.titre || 'Non spécifié'}
                      </td>
                      <td className="py-3 px-4 border-b text-sm">
                        <span
                          className={`inline-block py-1 px-2 rounded ${getAppointmentColor(appointment.statut)}`}
                        >
                          {appointment.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-600">Aucun rendez-vous trouvé.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;