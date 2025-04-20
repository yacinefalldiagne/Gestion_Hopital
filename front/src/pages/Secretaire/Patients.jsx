import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaEye, FaSearch, FaSort } from "react-icons/fa";
import axios from "axios";

function Patients() {
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/patients', {
                    withCredentials: true,
                });
                console.log("Raw patients response:", response.data); // Log to diagnose
                const transformedPatients = response.data.map(patient => ({
                    id: patient.id || patient._id || 'unknown',
                    name: patient.name || 'Nom inconnu',
                    age: calculateAge(patient.dateNaissance),
                    lastAppointment: patient.lastAppointment || 'Aucun rendez-vous',
                    phone: patient.phone || 'Non fourni',
                    email: patient.email || 'Non fourni',
                    groupeSanguin: patient.groupeSanguin || 'Non spécifié',
                }));
                console.log("Transformed patients:", transformedPatients); // Log to diagnose
                setPatients(transformedPatients);
            } catch (err) {
                setError(err.response?.data?.message || 'Erreur lors de la récupération des patients');
                console.error("Fetch patients error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, []);

    const calculateAge = (birthDate) => {
        if (!birthDate) {
            return null; // Handle missing birthDate
        }
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) {
            return null; // Handle invalid date
        }
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age >= 0 ? age : 0; // Handle future dates
    };

    const filteredPatients = patients.filter((patient) =>
        (patient.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedPatients = [...filteredPatients].sort((a, b) => {
        if (sortBy === "name") {
            return (a.name || '').localeCompare(b.name || '');
        } else if (sortBy === "lastAppointment") {
            return new Date(b.lastAppointment || 0) - new Date(a.lastAppointment || 0);
        }
        return 0;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
        );
    }
    if (error) {
        return <div className="text-center text-red-600 text-lg">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header with stats */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Patients</h1>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600">Total Patients</p>
                        <p className="text-2xl font-semibold text-gray-800">{patients.length}</p>
                    </div>
                </div>

                {/* Search and sort */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full max-w-md">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un patient..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <FaSort className="text-gray-600" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        >
                            <option value="name">Trier par nom</option>
                            <option value="lastAppointment">Trier par dernier rendez-vous</option>
                        </select>
                    </div>
                </div>

                {/* Add patient button and patient grid */}
                <div className="flex flex-col space-y-6">
                    <Link
                        to="/secretaire/patient/add"
                        className="flex items-center space-x-2 w-fit text-white bg-blue-600 py-2 px-4 rounded-full hover:bg-blue-700 transition-colors shadow-md"
                    >
                        <FaPlus />
                        <span>Ajouter un patient</span>
                    </Link>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedPatients.length > 0 ? (
                            sortedPatients.map((patient) => (
                                <div
                                    key={patient.id}
                                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {patient.name || 'Nom inconnu'}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {patient.age != null ? `${patient.age} ans` : 'Âge inconnu'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Téléphone :</span> {patient.phone}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Groupe sanguin :</span> {patient.groupeSanguin}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Dernier rendez-vous :</span>{" "}
                                            {patient.lastAppointment}
                                        </p>
                                    </div>
                                    <div className="mt-4">
                                        <Link
                                            to={`/secretaire/patient/${patient.id}`}
                                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition"
                                        >
                                            <FaEye />
                                            <span>Voir détails</span>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-600 text-lg">
                                Aucun patient trouvé.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Patients;