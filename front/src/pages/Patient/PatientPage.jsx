import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PatientPage = () => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Vous devez être connecté pour accéder aux détails du patient.');
        }
        const res = await axios.get(`http://localhost:5000/api/patients/${patientId}`, {
          headers: { 'x-auth-token': token },
        });
        setPatient(res.data);
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la récupération du patient';
        console.error('Erreur:', errorMessage);
        setError(errorMessage);
      }
    };
    fetchPatient();
  }, [patientId]);

  if (!patient) {
    return <div className="text-center mt-10">Chargement...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 bg-white rounded-xl shadow-md mx-10">
      <h2 className="text-2xl font-semibold mb-6">Détails du Patient</h2>
      {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
      <div className="w-full max-w-2xl bg-gray-100 p-4 rounded-lg">
        <p><strong>Nom :</strong> {patient.name}</p>
        <p><strong>Date de naissance :</strong> {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
        <p><strong>Genre :</strong> {patient.gender}</p>
        <p><strong>Créé le :</strong> {new Date(patient.createdAt).toLocaleString()}</p>
      </div>
      <div className="mt-6">
        <Link
          to={`/medecin/patient/${patientId}/reports`}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Voir les Rapports
        </Link>
      </div>
    </div>
  );
};

export default PatientPage;