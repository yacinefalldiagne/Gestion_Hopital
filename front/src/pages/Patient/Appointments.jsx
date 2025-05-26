import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { FaPlus, FaCalendarAlt } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Appointments = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    doctorId: '',
    date: '',
    timeSlot: '',
    titre: 'Consultation',
  });
  const [availableSlots, setAvailableSlots] = useState([]);

  // Fetch appointments
  const fetchAppointments = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/rendezvous/patient/${user._id}`,
          { withCredentials: true }
        );
        setAppointments(response.data);
        setError(null);
        return;
      } catch (err) {
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

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/medecins', {
        withCredentials: true,
      });
      const transformedDoctors = response.data.map((doctor) => ({
        id: doctor._id,
        name: `${doctor.prenom || ''} ${doctor.nom || ''}`.trim(),
      }));
      setDoctors(transformedDoctors);
    } catch (err) {
      setError('Erreur lors de la récupération des médecins');
    }
  };

  // Fetch available time slots (simulated for now)
  const fetchAvailableSlots = async (doctorId, date) => {
    // Dans un vrai système, ceci serait une requête API
    // Pour l'exemple, je simule des créneaux horaires disponibles
    const slots = [
      '09:00', '09:30', '10:00', '10:30', '11:00',
      '14:00', '14:30', '15:00', '15:30', '16:00',
    ];
    setAvailableSlots(slots);
  };

  useEffect(() => {
  console.log('AuthContext user:', user, 'authLoading:', authLoading);
  if (authLoading) return;
  if (!user || !user._id || user.role !== 'patient') {
    setLoading(false);
    setError('Accès réservé aux patients. Veuillez vous connecter avec un compte patient.');
    return;
  }
  console.log('Fetching appointments for user ID:', user._id);
  fetchAppointments();
  fetchDoctors();
}, [user, authLoading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAppointment((prev) => ({ ...prev, [name]: value }));
    if (name === 'doctorId' || name === 'date') {
      const doctorId = name === 'doctorId' ? value : newAppointment.doctorId;
      const date = name === 'date' ? value : newAppointment.date;
      if (doctorId && date) {
        fetchAvailableSlots(doctorId, date);
      }
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:5000/api/rendezvous',
        {
          patient: user._id,
          medecin: newAppointment.doctorId,
          dateRendezVous: newAppointment.date,
          heureDebut: `${newAppointment.date}T${newAppointment.timeSlot}:00Z`,
          heureFin: `${newAppointment.date}T${newAppointment.timeSlot.split(':')[0]}:${parseInt(newAppointment.timeSlot.split(':')[1]) + 30}:00Z`,
          titre: newAppointment.titre,
          statut: 'Planifié',
        },
        { withCredentials: true }
      );
      setAppointments((prev) => [response.data, ...prev]);
      setModalOpen(false);
      toast.success('Rendez-vous pris avec succès !', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      toast.error('Erreur lors de la prise de rendez-vous', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const getAppointmentColor = (statut) => {
    switch (statut) {
      case 'En cours':
        return 'bg-green-500 text-white';
      case 'Planifié':
        return 'bg-yellow-500 text-white';
      case 'Annulé':
        return 'bg-red-500 text-white';
      case 'Terminé':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-600">Chargement de l'utilisateur...</p>
      </div>
    );
  }

  if (!user || !user._id || user.role !== 'patient') {
    return (
      <div className="p-6">
        <p className="text-center text-red-600 font-semibold">
          Accès réservé aux patients. Veuillez vous connecter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Mes rendez-vous</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <FaPlus />
          <span>Prendre un rendez-vous</span>
        </button>
      </div>

      {/* Légende des statuts */}
      <div className="flex justify-center space-x-6 mb-6 text-sm">
        {[
          { status: 'En cours', color: 'bg-green-500' },
          { status: 'Planifié', color: 'bg-yellow-500' },
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

      {/* Liste des rendez-vous */}
      {!loading && !error && (
        <div className="space-y-4">
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <FaCalendarAlt className="text-green-600 text-2xl" />
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(appointment.dateRendezVous).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.heureDebut).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      Médecin : {`${appointment.medecin?.prenom || ''} ${appointment.medecin?.nom || ''}` || 'Médecin inconnu'}
                    </p>
                    <p className="text-sm text-gray-600">Motif : {appointment.titre || 'Non spécifié'}</p>
                  </div>
                </div>
                <span className={`inline-block py-1 px-3 rounded ${getAppointmentColor(appointment.statut)}`}>
                  {appointment.statut}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">Aucun rendez-vous trouvé.</p>
          )}
        </div>
      )}

      {/* Modal pour prendre un rendez-vous */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Prendre un rendez-vous</h2>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Médecin</label>
                <select
                  name="doctorId"
                  value={newAppointment.doctorId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Sélectionner un médecin</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newAppointment.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Créneau horaire</label>
                <select
                  name="timeSlot"
                  value={newAppointment.timeSlot}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Sélectionner un créneau</option>
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                <input
                  type="text"
                  name="titre"
                  value={newAppointment.titre}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Consultation générale"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;