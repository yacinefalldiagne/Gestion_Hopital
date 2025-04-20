import React from "react";
import { FaCalendarAlt, FaUser, FaFolder, FaChevronLeft, FaChevronRight, FaImage } from "react-icons/fa";
import { Link } from "react-router-dom";

function Secretaire() {
    // Données simulées pour les rendez-vous
    const appointments = [
        { id: 1, patient: "Jean Dupont", time: "10:00", doctor: "Dr. Sathish" },
        { id: 2, patient: "Marie Claire", time: "11:30", doctor: "Dr. Mohan" },
    ];

    // Données simulées pour la traçabilité des patients
    const patientTraceability = [
        { id: 1, patient: "Jean Dupont", action: "Dossier créé", date: "15 Avr 2025" },
        { id: 2, patient: "Marie Claire", action: "Rendez-vous planifié", date: "16 Avr 2025" },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Tableau de bord - Secrétaire Médicale</h1>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col items-center p-6 bg-blue-100 rounded-lg shadow-sm">
                    <FaCalendarAlt className="text-3xl text-blue-600 mb-2" />
                    <h2 className="text-3xl font-bold text-gray-900">5</h2>
                    <p className="text-gray-600">Rendez-vous aujourd'hui</p>
                </div>
                <div className="flex flex-col items-center p-6 bg-pink-100 rounded-lg shadow-sm">
                    <FaUser className="text-3xl text-pink-600 mb-2" />
                    <h2 className="text-3xl font-bold text-gray-900">200</h2>
                    <p className="text-gray-600">Patients actifs</p>
                </div>
                <div className="flex flex-col items-center p-6 bg-green-100 rounded-lg shadow-sm">
                    <FaFolder className="text-3xl text-green-600 mb-2" />
                    <h2 className="text-3xl font-bold text-gray-900">10</h2>
                    <p className="text-gray-600">Dossiers en attente</p>
                </div>
                <div className="flex flex-col items-center p-6 bg-yellow-100 rounded-lg shadow-sm">
                    <FaImage className="text-3xl text-yellow-600 mb-2" />
                    <h2 className="text-3xl font-bold text-gray-900">25</h2>
                    <p className="text-gray-600">Images DICOM à organiser</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Calendrier des rendez-vous */}
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Rendez-vous planifiés</h2>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-600">Mer, 16 Avr 2025</span>
                        <div className="flex space-x-2">
                            <button className="text-gray-600 hover:text-gray-800"><FaChevronLeft /></button>
                            <button className="text-gray-600 hover:text-gray-800"><FaChevronRight /></button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {appointments.map((appointment) => (
                            <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">

                                    <div>
                                        <p className="font-medium text-gray-800">{appointment.patient}</p>
                                        <p className="text-sm text-gray-600">Avec {appointment.doctor}</p>
                                        <p className="text-sm text-gray-500">{appointment.time}</p>
                                    </div>
                                </div>
                                <Link to="/secretaire/schedule" className="text-blue-600 hover:underline text-sm">
                                    Modifier
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Traçabilité des patients */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Traçabilité des patients</h2>
                    <div className="space-y-4">
                        {patientTraceability.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-800">{entry.patient}</p>
                                    <p className="text-sm text-gray-600">{entry.action}</p>
                                    <p className="text-sm text-gray-500">{entry.date}</p>
                                </div>
                            </div>
                        ))}
                        <Link to="/secretaire/traceability" className="block mt-4 text-blue-600 hover:underline text-sm text-center">
                            Voir plus
                        </Link>
                    </div>
                </div>

                {/* Tâches rapides */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Tâches rapides</h2>
                    <div className="space-y-4">
                        <Link to="/secretaire/dossier" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
                            <p className="font-medium text-gray-800">Gérer dossier</p>
                        </Link>
                        <Link to="/secretaire/patient" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
                            <p className="font-medium text-gray-800">Gérer patient</p>
                        </Link>
                        <Link to="/secretaire/dicom" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
                            <p className="font-medium text-gray-800">Organiser image DICOM</p>
                        </Link>
                        <Link to="/secretaire/schedule" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
                            <p className="font-medium text-gray-800">Planifier examen</p>
                        </Link>
                        <Link to="/secretaire/delete-dossier" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
                            <p className="font-medium text-gray-800">Supprimer dossier</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Secretaire;