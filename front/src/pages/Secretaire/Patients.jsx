import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaEye, FaSearch, FaSort } from "react-icons/fa";

function Patients() {
    // Données simulées pour les patients
    const [patients, setPatients] = useState([
        { id: 1, name: "Jean Dupont", age: 45, lastAppointment: "15 Avr 2025", phone: "+33 6 12 34 56 78", email: "jean.dupont@email.com" },
        { id: 2, name: "Marie Claire", age: 32, lastAppointment: "10 Avr 2025", phone: "+33 6 98 76 54 32", email: "marie.claire@email.com" },
        { id: 3, name: "Paul Martin", age: 60, lastAppointment: "5 Avr 2025", phone: "+33 6 45 67 89 01", email: "paul.martin@email.com" },
        { id: 4, name: "Sophie Durand", age: 28, lastAppointment: "1 Avr 2025", phone: "+33 6 23 45 67 89", email: "sophie.durand@email.com" },
    ]);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");

    // Filtrer les patients en fonction de la recherche
    const filteredPatients = patients.filter((patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Trier les patients
    const sortedPatients = [...filteredPatients].sort((a, b) => {
        if (sortBy === "name") {
            return a.name.localeCompare(b.name);
        } else if (sortBy === "lastAppointment") {
            return new Date(b.lastAppointment) - new Date(a.lastAppointment);
        }
        return 0;
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* En-tête avec statistiques */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Patients</h1>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Total Patients</p>
                    <p className="text-2xl font-semibold text-gray-800">{patients.length}</p>
                </div>
            </div>

            {/* Barre de recherche et tri */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-full max-w-md">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un patient..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <FaSort className="text-gray-600" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="name">Trier par nom</option>
                        <option value="lastAppointment">Trier par dernier rendez-vous</option>
                    </select>
                </div>
            </div>

            {/* Bouton Ajouter un nouveau patient et grille des patients */}
            <div className="flex flex-col space-y-6">
                {/* Bouton Ajouter un nouveau patient */}
                <Link
                    to="/secretaire/patient/add"
                    className="flex items-center space-x-2 w-fit text-white bg-blue-600 py-2 px-4 rounded-full hover:bg-blue-700 transition-colors shadow-md"
                >
                    <FaPlus />
                    <span>Ajouter un patient</span>
                </Link>

                {/* Grille des patients */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedPatients.length > 0 ? (
                        sortedPatients.map((patient) => (
                            <div
                                key={patient.id}
                                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-center space-x-4 mb-4">
                                    <img
                                        src="https://via.placeholder.com/50"
                                        alt="Patient"
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{patient.name}</h3>
                                        <p className="text-sm text-gray-600">{patient.age} ans</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Téléphone :</span> {patient.phone}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Dernier rendez-vous :</span>{" "}
                                        {patient.lastAppointment}
                                    </p>
                                </div>
                                <div className="mt-4">
                                    <Link
                                        to={`/secretaire/patient/${patient.id}`}
                                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                                    >
                                        <FaEye />
                                        <span>Voir détails</span>
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-600">
                            Aucun patient trouvé.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Patients;