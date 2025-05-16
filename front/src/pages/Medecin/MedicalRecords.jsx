import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft, FaFileMedical, FaFolderOpen } from 'react-icons/fa';

function MedicalRecords() {
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const [dossier, setDossier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Récupérer les données du patient et du dossier
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                // Récupérer les détails du patient
                const patientResponse = await axios.get(
                    `http://localhost:5000/api/patients/details?userId=${patientId}`,
                    { withCredentials: true }
                );
                setPatient(patientResponse.data);

                // Récupérer le dossier médical
                const dossierResponse = await axios.get(
                    `http://localhost:5000/api/dossiers?patientId=${patientId}`,
                    { withCredentials: true }
                );
                setDossier(dossierResponse.data[0] || null);

            } catch (err) {
                console.error('Erreur lors de la récupération des données:', err);
                setError(err.response?.data?.message || 'Erreur lors de la récupération des données');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [patientId]);

    // Créer un nouveau dossier
    const handleCreateDossier = async () => {
        try {
            setLoading(true);
            const res = await axios.post(
                'http://localhost:5000/api/dossiers',
                { patientId, numero: `DOS-${patientId}-${Date.now()}`, noteMedecin: '' },
                { withCredentials: true }
            );
            setDossier(res.data);
            toast.success('Dossier médical créé avec succès');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la création du dossier';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="flex items-center justify-center min-h-screen text-red-600 text-lg">
                {error || 'Aucun patient trouvé'}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <ToastContainer />
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link to={`/medecin/patient/${patientId}`} className="text-gray-600 hover:text-gray-800 transition-colors">
                            <FaArrowLeft className="text-2xl" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Dossier Médical - {patient.prenom} {patient.nom}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dossier Section */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <FaFileMedical className="mr-2 text-blue-600" />
                            Dossier Médical
                        </h2>
                        {!dossier && (
                            <button
                                onClick={handleCreateDossier}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                disabled={loading}
                            >
                                <FaFolderOpen />
                                <span>Créer un Dossier Médical</span>
                            </button>
                        )}
                    </div>
                    {dossier ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Numéro de Dossier</p>
                                <p className="text-gray-900 font-medium">{dossier.numero}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Notes du Médecin</p>
                                <p className="text-gray-900 font-medium">{dossier.noteMedecin || 'Aucune'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Consultations</p>
                                <p className="text-gray-900 font-medium">{dossier.consultations?.length || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Prescriptions</p>
                                <p className="text-gray-900 font-medium">{dossier.prescriptions?.length || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Résultats de Laboratoire</p>
                                <p className="text-gray-900 font-medium">{dossier.labResults?.length || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Documents Associés</p>
                                <p className="text-gray-900 font-medium">{dossier.documentsAssocies?.length || 0}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Aucun dossier médical trouvé. Créez un dossier pour commencer.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MedicalRecords;
