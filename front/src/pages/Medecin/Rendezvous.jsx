import React, { useState, useEffect, useContext } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';

function Rendezvous() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const daysOfWeek = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
  const medecinId = user ? user._id : null;

  // State management
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3));
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const [statusError, setStatusError] = useState(null);

  // Calculate days in month and first day
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Determine appointment color based on status
  const getAppointmentColor = (rdv) => {
    switch (rdv.statut) {
      case 'En cours':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Planifié':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Annulé':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Terminé':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      default:
        return 'bg-gray-200 text-gray-800 border-gray-400';
    }
  };

  // Fetch appointments
  useEffect(() => {
    const fetchRendezvous = async () => {
      try {
        setLoading(true);
        console.log('Fetching rendez-vous pour medecinId:', medecinId);
        const response = await axios.get(`http://localhost:5000/api/rendezvous/medecin/${medecinId}`, {
          withCredentials: true,
        });
        console.log('Rendez-vous reçus:', response.data);
        setRendezvous(response.data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de fetchRendezvous:', err.response?.data || err);
        setError(err.response?.data?.message || 'Erreur lors de la récupération des rendez-vous');
      } finally {
        setLoading(false);
      }
    };

    if (authLoading || !medecinId) {
      console.warn('Auth en cours ou medecinId manquant:', { authLoading, medecinId });
      setLoading(false);
      setError('Vous devez être connecté en tant que médecin');
      return;
    }
    fetchRendezvous();
  }, [user, authLoading, medecinId]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Filter appointments for the current month
  const monthlyRendezvous = Array.isArray(rendezvous)
    ? rendezvous.filter((rdv) => {
        const rdvDate = new Date(rdv.dateRendezVous);
        return rdvDate.getFullYear() === currentDate.getFullYear() && rdvDate.getMonth() === currentDate.getMonth();
      })
    : [];

  // Handle appointment click
  const handleRdvClick = (rdv) => {
    setSelectedRdv(rdv);
    setNewStatus(rdv.statut);
    setStatusError(null);
  };

  // Close modal
  const closeModal = () => {
    setSelectedRdv(null);
    setNewStatus(null);
    setStatusError(null);
  };

  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedRdv || !newStatus || newStatus === selectedRdv.statut) return;

    try {
      console.log('Mise à jour du statut pour rendez-vous:', selectedRdv.id, 'Nouveau statut:', newStatus);
      const response = await axios.put(
        `http://localhost:5000/api/rendezvous/${selectedRdv.id}`,
        { statut: newStatus },
        { withCredentials: true }
      );
      setRendezvous((prev) =>
        prev.map((rdv) => (rdv.id === selectedRdv.id ? { ...rdv, statut: newStatus } : rdv))
      );
      setSelectedRdv((prev) => ({ ...prev, statut: newStatus }));
      setStatusError(null);
      console.log('Statut mis à jour:', response.data);
    } catch (err) {
      console.error('Erreur lors de handleStatusChange:', err.response?.data || err);
      setStatusError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  // Loading and role check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-green-50 to-yellow-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'medecin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-green-50 to-yellow-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-red-600 font-semibold text-lg">Accès réservé aux médecins. Veuillez vous connecter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-green-50 to-yellow-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-8 px-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FaCalendarAlt className="h-10 w-10" />
            <h1 className="text-3xl font-extrabold tracking-tight">Calendrier des Rendez-vous</h1>
          </div>
          <p className="text-sm font-medium">Gérez vos rendez-vous médicaux</p>
        </div>

        {/* Content */}
        <div className="p-10">
          {/* Status Legend */}
          <div className="flex justify-center space-x-6 mb-8">
            {[
              { status: 'En cours', color: 'bg-green-100 text-green-800 border-green-300' },
              { status: 'Planifié', color: 'bg-blue-100 text-blue-800 border-blue-300' },
              { status: 'Terminé', color: 'bg-gray-100 text-gray-600 border-gray-300' },
              { status: 'Annulé', color: 'bg-red-100 text-red-800 border-red-300' },
            ].map((item) => (
              <div key={item.status} className="flex items-center text-sm font-medium">
                <span className={`w-4 h-4 ${item.color} rounded-full border mr-2`}></span>
                {item.status}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition duration-200"
                aria-label="Mois précédent"
              >
                <FaChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-2xl font-semibold text-gray-800 capitalize">
                {currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition duration-200"
                aria-label="Mois suivant"
              >
                <FaChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium">
                Mois
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 font-medium">
                Semaine
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 font-medium">
                Jour
              </button>
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
          )}
          {error && (
            <div className="text-red-600 text-center font-medium bg-red-50 p-4 rounded-lg">{error}</div>
          )}

          {/* Calendar Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-gray-700 bg-gray-100 py-3"
                >
                  {day}
                </div>
              ))}
              {Array(firstDayOfMonth)
                .fill(null)
                .map((_, index) => (
                  <div key={`empty-${index}`} className="h-40 bg-white"></div>
                ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const currentDayRendezvous = monthlyRendezvous.filter(
                  (rdv) => new Date(rdv.dateRendezVous).getDate() === day
                );
                return (
                  <div key={day} className="h-40 bg-white p-3 relative overflow-y-auto hover:bg-yellow-50 transition duration-200">
                    <span className="absolute top-2 left-3 font-semibold text-gray-700">{day}</span>
                    {currentDayRendezvous.map((rdv, index) => (
                      <div
                        key={index}
                        className={`mt-${index * 7 + 7} text-xs px-3 py-1.5 rounded-lg border ${getAppointmentColor(
                          rdv
                        )} truncate hover:shadow-md hover:scale-105 transform transition-all cursor-pointer`}
                        style={{ maxWidth: '95%' }}
                        onClick={() => handleRdvClick(rdv)}
                      >
                        <span className="font-medium">
                          {new Date(rdv.heureDebut).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>{' '}
                        - {rdv.patient.prenom} {rdv.patient.nom}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal for Appointment Details */}
        {selectedRdv && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg relative shadow-2xl transform transition-all animate-slideUp">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition duration-200"
                aria-label="Fermer la modale"
              >
                <FaTimes className="h-5 w-5" />
              </button>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-6">Détails du rendez-vous</h2>
              <div className="space-y-4 text-sm">
                <p>
                  <span className="font-semibold text-gray-700">Titre :</span> {selectedRdv.titre}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Patient :</span> {selectedRdv.patient.prenom}{' '}
                  {selectedRdv.patient.nom}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Médecin :</span> {selectedRdv.medecin.prenom}{' '}
                  {selectedRdv.medecin.nom}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Date :</span>{' '}
                  {new Date(selectedRdv.dateRendezVous).toLocaleDateString('fr-FR')}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Heure :</span>{' '}
                  {new Date(selectedRdv.heureDebut).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(selectedRdv.heureFin).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <div className="flex items-center">
                  <span className="font-semibold text-gray-700">Statut :</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="ml-3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    disabled={['Annulé', 'Terminé'].includes(selectedRdv.statut)}
                  >
                    {['En cours', 'Planifié', 'Annulé', 'Terminé'].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedRdv.description && (
                  <p>
                    <span className="font-semibold text-gray-700">Description :</span> {selectedRdv.description}
                  </p>
                )}
                {statusError && (
                  <p className="text-red-600 text-xs bg-red-50 p-2 rounded">{statusError}</p>
                )}
              </div>
              <div className="mt-8 flex space-x-4">
                <button
                  onClick={handleStatusChange}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 disabled:bg-gray-400 font-medium"
                  disabled={
                    !newStatus ||
                    newStatus === selectedRdv.statut ||
                    ['Annulé', 'Terminé'].includes(selectedRdv.statut)
                  }
                >
                  Enregistrer
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Tailwind Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Rendezvous;