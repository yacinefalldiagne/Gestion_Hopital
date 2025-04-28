import React, { useState, useEffect, useContext } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';

function Rendezvous() {
    const { user, loading: authLoading } = useContext(AuthContext);
    const daysOfWeek = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    const medecinId = user ? user._id : null; // ID du médecin connecté

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
                return 'bg-green-100 text-green-800';
            case 'Planifié':
                return 'bg-blue-100 text-blue-800';
            case 'Annulé':
                return 'bg-red-100 text-red-800';
            case 'Terminé':
                return 'bg-gray-100 text-gray-600';
            default:
                return 'bg-gray-200 text-gray-800';
        }
    };

    // Fetch appointments
    useEffect(() => {
        const fetchRendezvous = async () => {
            try {
                setLoading(true);
                // Correction de l'URL : Utilisation de l'endpoint correct
                const response = await axios.get(`http://localhost:5000/api/rendezvous/medecin/${medecinId}`, {
                    withCredentials: true,
                });
                setRendezvous(response.data);
                setError(null);
            } catch (err) {
                console.error('Erreur lors de fetchRendezvous:', err);
                setError('Erreur lors de la récupération des rendez-vous');
            } finally {
                setLoading(false);
            }
        };

        if (authLoading) {
            // Attendre que l'authentification soit terminée
            return;
        }
        if (!user || user.role !== 'medecin') {
            setLoading(false);
            setError('Vous devez être connecté en tant que médecin');
            return;
        }
        fetchRendezvous();
    }, [user, authLoading]);

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
        if (!selectedRdv || !newStatus || newStatus === selectedRdv.statut) {
            return;
        }

        try {
            const response = await axios.put(
                `http://localhost:5000/api/rendezvous/${selectedRdv.id}`,
                { statut: newStatus },
                { withCredentials: true }
            );

            // Update local state
            setRendezvous((prev) =>
                prev.map((rdv) => (rdv.id === selectedRdv.id ? { ...rdv, statut: newStatus } : rdv))
            );
            setSelectedRdv((prev) => ({ ...prev, statut: newStatus }));
            setStatusError(null);
        } catch (err) {
            console.error('Erreur lors de handleStatusChange:', err);
            setStatusError('Erreur lors de la mise à jour du statut');
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
    if (!user || user.role !== 'medecin') {
        return (
            <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    <p className="text-center text-red-600 font-semibold">Accès réservé aux médecins. Veuillez vous connecter.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="mt-6 flex justify-center space-x-6 text-sm">
                    {[
                        { status: 'En cours', color: 'bg-green-100' },
                        { status: 'Planifié', color: 'bg-blue-100' },
                        { status: 'Terminé', color: 'bg-gray-100' },
                        { status: 'Annulé', color: 'bg-red-100' },
                    ].map((item) => (
                        <div key={item.status} className="flex items-center">
                            <span className={`w-4 h-4 ${item.color} rounded mr-2`}></span>
                            {item.status}
                        </div>
                    ))}
                </div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <FaChevronLeft
                            className="text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={handlePrevMonth}
                        />
                        <span className="text-2xl font-bold text-gray-800 capitalize">
                            {currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                        </span>
                        <FaChevronRight
                            className="text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={handleNextMonth}
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Mois
                        </button>
                        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                            Semaine
                        </button>
                        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                            Jour
                        </button>
                    </div>
                </div>

                {/* Loading and Error States */}
                {loading && <p className="text-center text-gray-600">Chargement...</p>}
                {error && <p className="text-center text-red-600">{error}</p>}

                {/* Calendar Grid */}
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
                            <div key={day} className="h-40 bg-white p-2 text-sm relative overflow-y-auto">
                                <span className="absolute top-2 left-2 font-semibold text-gray-700">{day}</span>
                                {currentDayRendezvous.map((rdv, index) => (
                                    <div
                                        key={index}
                                        className={`mt-${index * 7 + 7} text-xs px-3 py-1.5 rounded-lg ${getAppointmentColor(
                                            rdv
                                        )} truncate hover:shadow-lg transition-all cursor-pointer`}
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
            </div>

            {/* Modal for Appointment Details */}
            {selectedRdv && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
                        <FaTimes
                            className="absolute top-4 right-4 text-gray-600 cursor-pointer hover:text-gray-800"
                            onClick={closeModal}
                        />
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Détails du rendez-vous</h2>
                        <div className="space-y-3 text-sm">
                            <p>
                                <span className="font-semibold">Titre :</span> {selectedRdv.titre}
                            </p>
                            <p>
                                <span className="font-semibold">Patient :</span> {selectedRdv.patient.prenom}{' '}
                                {selectedRdv.patient.nom}
                            </p>
                            <p>
                                <span className="font-semibold">Médecin :</span> {selectedRdv.medecin.prenom}{' '}
                                {selectedRdv.medecin.nom}
                            </p>
                            <p>
                                <span className="font-semibold">Date :</span>{' '}
                                {new Date(selectedRdv.dateRendezVous).toLocaleDateString('fr-FR')}
                            </p>
                            <p>
                                <span className="font-semibold">Heure :</span>{' '}
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
                            <div>
                                <span className="font-semibold">Statut :</span>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="ml-2 p-1 border rounded-lg"
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
                                    <span className="font-semibold">Description :</span> {selectedRdv.description}
                                </p>
                            )}
                            {statusError && <p className="text-red-600 text-xs">{statusError}</p>}
                        </div>
                        <div className="mt-6 flex space-x-2">
                            <button
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                onClick={handleStatusChange}
                                disabled={
                                    !newStatus ||
                                    newStatus === selectedRdv.statut ||
                                    ['Annulé', 'Terminé'].includes(selectedRdv.statut)
                                }
                            >
                                Enregistrer
                            </button>
                            <button
                                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                onClick={closeModal}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Rendezvous;