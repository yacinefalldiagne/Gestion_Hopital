import React from 'react';

const Appointments = () => {
  // Données simulées pour les rendez-vous
  const appointments = [
    {
      _id: '1',
      date: '2025-04-22T10:00:00Z',
      doctor: { name: 'Dr. Martin' },
      reason: 'Consultation générale',
      status: 'confirmed',
    },
    {
      _id: '2',
      date: '2025-04-25T14:30:00Z',
      doctor: { name: 'Dr. Sophie' },
      reason: 'Suivi médical',
      status: 'pending',
    },
    {
      _id: '3',
      date: '2025-04-28T09:00:00Z',
      doctor: { name: 'Dr. Dupont' },
      reason: 'Examen annuel',
      status: 'cancelled',
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mes rendez-vous</h1>
      {appointments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Heure</th>
                <th className="py-2 px-4 border-b text-left">Médecin</th>
                <th className="py-2 px-4 border-b text-left">Motif</th>
                <th className="py-2 px-4 border-b text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">
                    {new Date(appointment.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {new Date(appointment.date).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {appointment.doctor?.name || 'Médecin inconnu'}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {appointment.reason || 'Non spécifié'}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`inline-block py-1 px-2 rounded text-white ${
                        appointment.status === 'confirmed'
                          ? 'bg-green-500'
                          : appointment.status === 'pending'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {appointment.status === 'confirmed'
                        ? 'Confirmé'
                        : appointment.status === 'pending'
                        ? 'En attente'
                        : 'Annulé'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Aucun rendez-vous trouvé.</p>
      )}
    </div>
  );
};

export default Appointments;