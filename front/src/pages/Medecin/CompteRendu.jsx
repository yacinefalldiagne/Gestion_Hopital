import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CompteRendu() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        // Configurer axios pour inclure le token dans les en-têtes
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('authToken='))
          ?.split('=')[1];

        if (!token) {
          throw new Error('Utilisateur non authentifié');
        }

        const response = await axios.get('http://localhost:5000/api/reports/doctor', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setConsultations(response.data);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des comptes rendus.');
        setLoading(false);
        console.error('Erreur:', err);
      }
    };

    fetchConsultations();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-6 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h1 className="text-2xl font-bold">Comptes rendus de tous les patients</h1>
          </div>
          <p className="text-sm font-medium">Consultez tous vos comptes rendus</p>
        </div>

        {/* Corps */}
        <div className="p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center">{error}</div>
          ) : consultations.length === 0 ? (
            <p className="text-gray-600 text-center">Aucun compte rendu disponible pour le moment.</p>
          ) : (
            <div className="space-y-6">
              {consultations.map((consultation) => (
                <div
                  key={consultation._id}
                  className="border border-gray-200 rounded-lg p-6 bg-white hover:bg-yellow-50 transition duration-300"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Consultation du {new Date(consultation.consultationDate).toLocaleDateString()}
                    </h2>
                    <span className="text-sm text-blue-600 font-medium">
                      Patient: {consultation.patient?.name || 'Patient inconnu'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Patient :</p>
                      <p className="text-gray-600">{consultation.patient?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Diagnostic :</p>
                      <p className="text-gray-600">{consultation.diagnosis || 'Non spécifié'}</p>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-sm font-medium text-gray-700">Notes :</p>
                      <p className="text-gray-600">{consultation.notes || 'Aucune'}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200"
                      onClick={() => alert(`Afficher les détails de la consultation ${consultation._id}`)}
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompteRendu;