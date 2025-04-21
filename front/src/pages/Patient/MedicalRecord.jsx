import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MedicalRecord = () => {
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMedicalRecord = async () => {
      try {
        const token = localStorage.getItem('token'); // Récupère le token JWT
        const response = await axios.get('http://localhost:5000/api/patients/medical-record', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMedicalRecord(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la récupération du dossier médical');
        setLoading(false);
      }
    };

    fetchMedicalRecord();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>Erreur : {error}</div>;
  }

  if (!medicalRecord) {
    return <div>Aucun dossier médical trouvé.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mon dossier médical</h1>

      {/* Informations du patient */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Informations du patient</h2>
        <p>Nom : {medicalRecord.patientId?.name || 'Non disponible'}</p>
      </div>

      {/* Antécédents médicaux */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Antécédents médicaux</h2>
        <p>{medicalRecord.history || 'Aucun antécédent médical'}</p>
      </div>

      {/* Diagnostics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Diagnostics</h2>
        {medicalRecord.diagnoses && medicalRecord.diagnoses.length > 0 ? (
          <ul className="list-disc pl-5">
            {medicalRecord.diagnoses.map((diagnosis, index) => (
              <li key={index}>
                {diagnosis.condition} - Diagnostiqué le {new Date(diagnosis.date).toLocaleDateString('fr-FR')}
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucun diagnostic</p>
        )}
      </div>

      {/* Traitements */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Traitements</h2>
        {medicalRecord.treatments && medicalRecord.treatments.length > 0 ? (
          <ul className="list-disc pl-5">
            {medicalRecord.treatments.map((treatment, index) => (
              <li key={index}>
                {treatment.medication} ({treatment.dosage}) - Du{' '}
                {new Date(treatment.startDate).toLocaleDateString('fr-FR')} à{' '}
                {treatment.endDate ? new Date(treatment.endDate).toLocaleDateString('fr-FR') : 'en cours'}
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucun traitement</p>
        )}
      </div>

      {/* Rapports */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Rapports</h2>
        {medicalRecord.reports && medicalRecord.reports.length > 0 ? (
          <ul className="list-disc pl-5">
            {medicalRecord.reports.map((report, index) => (
              <li key={index}>
                Rapport par {report.doctorId?.name || 'Médecin inconnu'} -{' '}
                {new Date(report.createdAt).toLocaleDateString('fr-FR')} : {report.content}
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucun rapport</p>
        )}
      </div>
    </div>
  );
};

export default MedicalRecord;