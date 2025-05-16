import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft, FaUser, FaFileMedical, FaNotesMedical, FaEye } from 'react-icons/fa';

function PatientDetailsMedecin() {
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const [dossier, setDossier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Récupérer les données du patient et du dossier
    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                setLoading(true);
                setError('');

                // Récupérer les détails du patient
                const patientResponse = await axios.get(
                    `http://localhost:5000/api/patients/details?userId=${patientId}`,
                    { withCredentials: true }
                );
                console.log('Patient details response:', patientResponse.data);
                setPatient(patientResponse.data);

                // Récupérer le dossier médical
                const dossierResponse = await axios.get(
                    `http://localhost:5000/api/dossiers?patientId=${patientId}`,
                    { withCredentials: true }
                );
                setDossier(dossierResponse.data[0] || null);

            } catch (err) {
                console.error('Erreur lors de la récupération des détails:', err);
                setError(err.response?.data?.message || 'Erreur lors de la récupération des détails du patient');
            } finally {
                setLoading(false);
            }
        };

        fetchPatientDetails();
    }, [patientId]);

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
                        <Link to="/medecin/patients" className="text-gray-600 hover:text-gray-800 transition-colors">
                            <FaArrowLeft className="text-2xl" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {patient.prenom} {patient.nom}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Inscrit depuis : {patient.membership?.startDate || 'Non spécifié'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Basic and Medical Information */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Information Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations personnelles</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3">
                                <FaUser className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Nom</p>
                                    <p className="text-gray-900 font-medium">{patient.nom}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaUser className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Prénom</p>
                                    <p className="text-gray-900 font-medium">{patient.prenom}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaUser className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Sexe</p>
                                    <p className="text-gray-900 font-medium">{patient.sexe || 'Non spécifié'}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaUser className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Date de naissance</p>
                                    <p className="text-gray-900 font-medium">
                                        {patient.dateNaissance
                                            ? new Date(patient.dateNaissance).toLocaleDateString('fr-FR')
                                            : 'Non spécifié'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaUser className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Numéro de téléphone</p>
                                    <p className="text-gray-900 font-medium">{patient.phone || 'Non fourni'}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaUser className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="text-gray-900 font-medium">{patient.email || 'Non fourni'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medical Information Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations médicales</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3">
                                <FaUser className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Groupe sanguin</p>
                                    <p className="text-gray-900 font-medium">{patient.groupeSanguin || 'Non spécifié'}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaUser className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Allergies</p>
                                    <p className="text-gray-900 font-medium">
                                        {patient.allergies?.length > 0 ? patient.allergies.join(', ') : 'Aucune'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaUser className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Antécédents médicaux</p>
                                    <p className="text-gray-900 font-medium">{patient.antecedent || 'Aucun'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Appointments and Navigation */}
                <div className="space-y-6">
                    {/* Appointments Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Rendez-vous</h2>
                        <div className="space-y-6">
                            {patient.appointments?.length > 0 ? (
                                patient.appointments.map((appointment, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-4 h-4 rounded-full ${appointment.color || 'bg-blue-500'}`}></div>
                                            {index < patient.appointments.length - 1 && (
                                                <div className="w-1 h-16 bg-gray-200"></div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">{appointment.date}</p>
                                            <p className="text-gray-900 font-medium">{appointment.title}</p>
                                            <p className="text-sm text-gray-500">{appointment.doctor}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">Aucun rendez-vous trouvé.</p>
                            )}
                        </div>
                    </div>

                    {/* Navigation Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Gestion du Patient</h2>
                        <div className="space-y-4">
                            <Link
                                to={`/medecin/patient/${patientId}/reports`}
                                className="flex items-center space-x-3 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <FaNotesMedical className="text-xl" />
                                <span>Gérer les Rapports Médicaux</span>
                            </Link>
                            <Link
                                to={`/medecin/patient/${patientId}/record`}
                                className="flex items-center space-x-3 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <FaFileMedical className="text-xl" />
                                <span>{dossier ? 'Voir le Dossier Médical' : 'Créer un Dossier Médical'}</span>
                            </Link>
                            <Link
                                to={`/medecin/patient/${patientId}/dicom`}
                                className="flex items-center space-x-3 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <FaEye className="text-xl" />
                                <span>Gérer les Images DICOM</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PatientDetailsMedecin;
