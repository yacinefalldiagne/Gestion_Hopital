import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaCalendarAlt, FaUser, FaEnvelope, FaPhone, FaFileAlt, FaArrowLeft, FaFolderPlus, FaFolderOpen } from "react-icons/fa";
import axios from "axios";

function PatientDetails() {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/patients/details?userId=${id}`, {
                    withCredentials: true,
                });
                console.log("Patient details response:", response.data); // Log to diagnose
                setPatient(response.data);
            } catch (err) {
                console.error("Erreur lors de la récupération des détails:", err);
                setError(err.response?.data?.message || "Erreur lors de la récupération des détails du patient");
            } finally {
                setLoading(false);
            }
        };

        fetchPatientDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
        );
    }
    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-600 text-lg">{error}</div>;
    }
    if (!patient) {
        return <div className="flex items-center justify-center min-h-screen text-gray-600 text-lg">Aucun patient trouvé</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link to="/secretaire/patients" className="text-gray-600 hover:text-gray-800 transition-colors">
                            <FaArrowLeft className="text-2xl" />
                        </Link>
                        <div className="flex items-center space-x-4">
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
                                    <p className="text-sm text-gray-500">Sexe</p>
                                    <p className="text-gray-900 font-medium">{patient.sexe || 'Non spécifié'}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaCalendarAlt className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Date de naissance</p>
                                    <p className="text-gray-900 font-medium">{patient.dateNaissance || 'Non spécifié'}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaPhone className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Numéro de téléphone</p>
                                    <p className="text-gray-900 font-medium">{patient.phone || 'Non fourni'}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaEnvelope className="text-gray-400" />
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
                                        {patient.allergies?.length > 0 ? patient.allergies.join(", ") : "Aucune"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaUser className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Antécédents médicaux</p>
                                    <p className="text-gray-900 font-medium">{patient.antecedent || "Aucun"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Insurance, Membership, and Appointments */}
                <div className="space-y-6">
                    {/* Insurance Card */}
                    <div className="bg-indigo-50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations d'assurance</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Numéro</p>
                                <p className="text-lg font-medium text-gray-900">{patient.assurance?.number || 'Non fourni'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Date d'expiration</p>
                                <p className="text-lg font-medium text-gray-900">{patient.assurance?.expiry || 'Non spécifié'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Statut</p>
                                <p className="text-lg font-medium text-gray-900">{patient.assurance?.status || 'Inconnu'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Membership Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations d'adhésion</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Date de début</p>
                                <p className="text-lg font-medium text-gray-900">{patient.membership?.startDate || 'Non spécifié'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Jours restants</p>
                                <p className="text-lg font-medium text-gray-900">{patient.membership?.daysRemaining || 'Non spécifié'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Appointments Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Rendez-vous</h2>
                        <div className="space-y-6">
                            {patient.appointments?.length > 0 ? (
                                patient.appointments.map((appointment, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-4 h-4 rounded-full ${appointment.color || "bg-blue-500"}`}></div>
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
                </div>

                {/* Full Width Sections */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Medical Record Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Dossier Médical</h2>
                            <Link
                                to={patient.dossiers?.length > 0
                                    ? `/secretaire/patients/${id}/dossier-medical`
                                    : {
                                        pathname: `/secretaire/patients/${id}/dossier/add`,
                                        state: { patientName: `${patient.prenom} ${patient.nom}` }
                                    }}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {patient.dossiers?.length > 0 ? (
                                    <>
                                        <FaFolderOpen />
                                        <span>Afficher le dossier médical</span>
                                    </>
                                ) : (
                                    <>
                                        <FaFolderPlus />
                                        <span>Ajouter un dossier médical</span>
                                    </>
                                )}
                            </Link>
                        </div>
                    </div>

                    {/* Attachments Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Pièces jointes</h2>
                        <div className="space-y-4">
                            {patient.documents?.length > 0 ? (
                                patient.documents.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <FaFileAlt className="text-gray-400" />
                                            <div>
                                                <p className="text-gray-900 font-medium">{doc.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    Type : {doc.type} | Taille : {doc.size} | Date : {doc.uploadDate}
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Visualiser
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">Aucune pièce jointe trouvée.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PatientDetails;