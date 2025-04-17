import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaCalendarAlt, FaUser, FaEnvelope, FaPhone, FaFileAlt, FaArrowLeft, FaImage } from "react-icons/fa";
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
                console.log("Détails du patient:", response.data); // Debug response
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

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>{error}</div>;
    if (!patient) return <div>Aucun patient trouvé</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* En-tête avec bouton de retour */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <Link to="/secretaire/patients" className="text-gray-600 hover:text-gray-800">
                        <FaArrowLeft className="text-2xl" />
                    </Link>
                    <div className="flex items-center space-x-4">
                        <img
                            src="https://randomuser.me/api/portraits/men/80.jpg"
                            alt="Patient"
                            className="w-12 h-12 rounded-full"
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{patient.name}</h1>
                            <p className="text-sm text-gray-600">Inscrit depuis : {patient.joinedSince}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Section gauche : Informations de base */}
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations de base</h2>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <FaUser className="text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-600">Sexe</p>
                                <p className="text-gray-800">{patient.gender}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <FaCalendarAlt className="text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-600">Date de naissance</p>
                                <p className="text-gray-800">{patient.birthday}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <FaPhone className="text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-600">Numéro de téléphone</p>
                                <p className="text-gray-800">{patient.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <FaEnvelope className="text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="text-gray-800">{patient.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section droite : Rendez-vous */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Rendez-vous</h2>
                    <div className="space-y-6">
                        {patient.appointments.length > 0 ? (
                            patient.appointments.map((appointment, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-4 h-4 rounded-full ${appointment.color || "bg-blue-500"}`}></div>
                                        {index < patient.appointments.length - 1 && (
                                            <div className="w-1 h-16 bg-gray-200"></div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">{appointment.date}</p>
                                        <p className="text-gray-800 font-medium">{appointment.title}</p>
                                        <p className="text-sm text-gray-600">{appointment.doctor}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600">Aucun rendez-vous trouvé.</p>
                        )}
                    </div>
                </div>

                {/* Section droite : Assurance */}
                <div className="bg-indigo-100 text-black p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Informations d'assurance</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm">Numéro</p>
                            <p className="text-lg font-medium">{patient.assurance.number}</p>
                        </div>
                        <div>
                            <p className="text-sm">Date d'expiration</p>
                            <p className="text-lg font-medium">{patient.assurance.expiry}</p>
                        </div>
                        <div>
                            <p className="text-sm">Statut</p>
                            <p className="text-lg font-medium">{patient.assurance.status}</p>
                        </div>
                    </div>
                </div>

                {/* Section pleine largeur : Imagerie médicale */}
                <div className="md:col-span-4 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Imagerie médicale</h2>
                    <div className="space-y-4">
                        {patient.medicalImages && patient.medicalImages.length > 0 ? (
                            patient.medicalImages.map((image, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <FaImage className="text-gray-500" />
                                        <div>
                                            <p className="text-gray-800">{image.name}</p>
                                            <p className="text-sm text-gray-600">
                                                Type : {image.type} | Taille : {image.size} | Date : {image.uploadDate}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={image.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        Visualiser
                                    </a>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600">Aucune image médicale trouvée.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PatientDetails;