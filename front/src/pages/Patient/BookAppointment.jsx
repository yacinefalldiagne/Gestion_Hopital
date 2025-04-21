import React, { useState } from 'react';

const BookAppointment = () => {
  const [formData, setFormData] = useState({
    doctor: '',
    date: '',
    time: '',
    reason: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Liste simulée de médecins (en attendant le backend)
  const doctors = [
    { id: '1', name: 'Dr. Martin' },
    { id: '2', name: 'Dr. Sophie' },
    { id: '3', name: 'Dr. Dupont' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation simple
    if (!formData.doctor || !formData.date || !formData.time || !formData.reason) {
      setErrorMessage('Veuillez remplir tous les champs.');
      setSuccessMessage('');
      return;
    }

    // Simuler l'envoi au backend
    console.log('Données du rendez-vous:', formData);
    setSuccessMessage('Rendez-vous pris avec succès ! (Simulation)');
    setErrorMessage('');

    // Réinitialiser le formulaire
    setFormData({
      doctor: '',
      date: '',
      time: '',
      reason: '',
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Prendre rendez-vous</h1>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        {/* Sélection du médecin */}
        <div className="mb-4">
          <label htmlFor="doctor" className="block text-gray-700 font-semibold mb-2">
            Médecin
          </label>
          <select
            id="doctor"
            name="doctor"
            value={formData.doctor}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Sélectionnez un médecin</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sélection de la date */}
        <div className="mb-4">
          <label htmlFor="date" className="block text-gray-700 font-semibold mb-2">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]} // Désactive les dates passées
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Sélection de l'heure */}
        <div className="mb-4">
          <label htmlFor="time" className="block text-gray-700 font-semibold mb-2">
            Heure
          </label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Motif du rendez-vous */}
        <div className="mb-4">
          <label htmlFor="reason" className="block text-gray-700 font-semibold mb-2">
            Motif
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Décrivez le motif de votre rendez-vous"
            required
          />
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Prendre rendez-vous
        </button>
      </form>
    </div>
  );
};

export default BookAppointment;