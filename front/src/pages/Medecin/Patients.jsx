import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaEdit, FaFileMedical, FaEye } from "react-icons/fa";

function Patients() {
    const [dossiers, setDossiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const userRole = localStorage.getItem("userRole") || "medecin"; // Récupérer le rôle depuis localStorage

    // Récupérer les dossiers au chargement du composant
    useEffect(() => {
        const fetchDossiers = async () => {
            try {
                setLoading(true);
                const response = await axios.get("http://localhost:5000/api/dossiers", {
                    withCredentials: true,
                });
                setDossiers(response.data);
                setError("");
            } catch (err) {
                console.error("Erreur lors de la récupération des dossiers:", err);
                setError(
                    err.response?.data?.message ||
                    "Erreur lors de la récupération des dossiers. Veuillez réessayer."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDossiers();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* En-tête */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Liste des Dossiers Médicaux</h1>
                    <p className="text-gray-600 mt-2">
                        Consultez et modifiez les dossiers médicaux des patients.
                    </p>
                </div>

                {/* Messages d'erreur ou de chargement */}
                {loading && (
                    <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-6">
                        Chargement des dossiers...
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>
                )}

                {/* Liste des dossiers */}
                {!loading && dossiers.length === 0 && !error && (
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                        <p className="text-gray-600">Aucun dossier médical trouvé.</p>
                    </div>
                )}

                {!loading && dossiers.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dossiers.map((dossier) => (
                            <div
                                key={dossier._id}
                                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                {/* Icône et numéro de dossier */}
                                <div className="flex items-center space-x-3 mb-4">
                                    <FaFileMedical className="text-blue-600 text-2xl" />
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Dossier {dossier.numero}
                                    </h2>
                                </div>

                                {/* Informations du dossier */}
                                <div className="space-y-2">
                                    <p className="text-gray-700">
                                        <span className="font-medium">Patient :</span>{" "}
                                        {dossier.patient?.name || "Inconnu"}
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-medium">Note du médecin :</span>{" "}
                                        {dossier.noteMedecin?.substring(0, 100) +
                                            (dossier.noteMedecin?.length > 100 ? "..." : "")}
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-medium">Consultations :</span>{" "}
                                        {dossier.consultations?.length || 0}
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-medium">Prescriptions :</span>{" "}
                                        {dossier.prescriptions?.length || 0}
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-medium">Résultats de labo :</span>{" "}
                                        {dossier.labResults?.length || 0}
                                    </p>
                                </div>

                                {/* Bouton de modification */}
                                <div className="mt-4 flex justify-end space-x-3">
                                    <Link
                                        to={`/medecin/patient/${dossier.patient?.userId}`}
                                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <FaEye />
                                        <span>Consulter</span>
                                    </Link>
                                    <Link
                                        to={`/medecin/dossier-medical/${dossier.patient?.userId}`}
                                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <FaEdit />
                                        <span>Modifier</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Patients;