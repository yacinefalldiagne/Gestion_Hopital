import React, { useState } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaTimes, FaCalendarAlt } from "react-icons/fa";

function AppointmentSecretaire() {
    // Données simulées pour les rendez-vous
    const [appointments, setAppointments] = useState([
        {
            id: 1,
            patient: "Jean Dupont",
            doctor: "Dr. Marie Leclerc",
            date: "20 Avr 2025",
            time: "09:00",
            type: "Consultation",
            status: "Confirmed",
        },
        {
            id: 2,
            patient: "Marie Claire",
            doctor: "Dr. Paul Durand",
            date: "21 Avr 2025",
            time: "14:30",
            type: "Suivi",
            status: "Pending",
        },
        {
            id: 3,
            patient: "Paul Martin",
            doctor: "Dr. Sophie Bernard",
            date: "22 Avr 2025",
            time: "11:00",
            type: "Chirurgie",
            status: "Confirmed",
        },
    ]);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [newAppointment, setNewAppointment] = useState({
        patient: "",
        doctor: "",
        date: "",
        time: "",
        type: "",
    });

    // Filtrer les rendez-vous
    const filteredAppointments = appointments.filter((appointment) => {
        const matchesSearch = appointment.patient.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = filterDate ? appointment.date === filterDate : true;
        return matchesSearch && matchesDate;
    });

    // Gérer les changements dans le formulaire
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewAppointment((prev) => ({ ...prev, [name]: value }));
    };

    // Ajouter un nouveau rendez-vous
    const handleAddAppointment = (e) => {
        e.preventDefault();
        const newId = appointments.length ? appointments[appointments.length - 1].id + 1 : 1;
        const addedAppointment = {
            id: newId,
            patient: newAppointment.patient,
            doctor: newAppointment.doctor,
            date: newAppointment.date,
            time: newAppointment.time,
            type: newAppointment.type,
            status: "Pending",
        };
        setAppointments((prev) => [...prev, addedAppointment]);
        setNewAppointment({ patient: "", doctor: "", date: "", time: "", type: "" });
        setShowModal(false);
    };

    // Supprimer un rendez-vous
    const handleDelete = (id) => {
        setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
    };

    // Statistiques rapides
    const todayAppointments = appointments.filter(
        (appointment) => appointment.date === "20 Avr 2025"
    ).length;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* En-tête avec statistiques */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestion des rendez-vous</h1>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Rendez-vous aujourd'hui</p>
                    <p className="text-2xl font-semibold text-gray-800">{todayAppointments}</p>
                </div>
            </div>

            {/* Barre de recherche et filtre par date */}
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
                    <FaCalendarAlt className="text-gray-600" />
                    <input
                        type="text"
                        placeholder="Filtrer par date (ex: 20 Avr 2025)"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Bouton Ajouter un rendez-vous et liste des rendez-vous */}
            <div className="flex flex-col space-y-6">
                {/* Bouton Ajouter un rendez-vous */}
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 w-fit text-white bg-blue-600 py-2 px-4 rounded-full hover:bg-blue-700 transition-colors shadow-md"
                >
                    <FaPlus />
                    <span>Ajouter un rendez-vous</span>
                </button>

                {/* Modale pour ajouter un rendez-vous */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Ajouter un rendez-vous</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-gray-800">
                                    <FaTimes />
                                </button>
                            </div>
                            <form onSubmit={handleAddAppointment} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Patient</label>
                                    <input
                                        type="text"
                                        name="patient"
                                        value={newAppointment.patient}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nom du patient"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Médecin</label>
                                    <input
                                        type="text"
                                        name="doctor"
                                        value={newAppointment.doctor}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nom du médecin"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Date</label>
                                    <input
                                        type="text"
                                        name="date"
                                        value={newAppointment.date}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="ex: 20 Avr 2025"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Heure</label>
                                    <input
                                        type="text"
                                        name="time"
                                        value={newAppointment.time}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="ex: 09:00"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Type de rendez-vous</label>
                                    <input
                                        type="text"
                                        name="type"
                                        value={newAppointment.type}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="ex: Consultation"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Liste des rendez-vous */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Liste des rendez-vous</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Patient</th>
                                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Médecin</th>
                                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Date</th>
                                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Heure</th>
                                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Type</th>
                                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Statut</th>
                                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.length > 0 ? (
                                    filteredAppointments.map((appointment) => (
                                        <tr key={appointment.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-800">{appointment.patient}</td>
                                            <td className="py-3 px-4 text-gray-800">{appointment.doctor}</td>
                                            <td className="py-3 px-4 text-gray-600">{appointment.date}</td>
                                            <td className="py-3 px-4 text-gray-600">{appointment.time}</td>
                                            <td className="py-3 px-4 text-gray-600">{appointment.type}</td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`text-sm font-medium px-3 py-1 rounded ${appointment.status === "Confirmed"
                                                        ? "bg-green-100 text-green-600"
                                                        : "bg-yellow-100 text-yellow-600"
                                                        }`}
                                                >
                                                    {appointment.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 flex space-x-2">
                                                <button className="text-blue-600 hover:text-blue-800">
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(appointment.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="py-3 px-4 text-center text-gray-600">
                                            Aucun rendez-vous trouvé.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AppointmentSecretaire;