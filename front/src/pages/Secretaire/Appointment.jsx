import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

function Appointment() {
    const [rendezvous, setRendezvous] = useState([]);
    const [patients, setPatients] = useState([]);
    const [medecins, setMedecins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [patientsLoading, setPatientsLoading] = useState(true);
    const [medecinsLoading, setMedecinsLoading] = useState(true);
    const [error, setError] = useState("");
    const [patientsError, setPatientsError] = useState("");
    const [medecinsError, setMedecinsError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRendezvous, setCurrentRendezvous] = useState({
        id: "",
        dateRendezVous: "",
        heureDebut: "",
        heureFin: "",
        titre: "",
        description: "",
        statut: "Planifié",
        patient: "",
        medecin: "",
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDate, setFilterDate] = useState("");

    // Fetch patients for the dropdown
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/patients", {
                    withCredentials: true,
                });
                const transformedPatients = response.data.map((patient) => ({
                    id: patient.id || patient._id,
                    name: patient.name || `${patient.prenom || ""} ${patient.nom || ""}`.trim(),
                }));
                setPatients(transformedPatients);
                if (!transformedPatients.length) {
                    setPatientsError("Aucun patient trouvé");
                }
            } catch (err) {
                const errorMessage = err.response?.data?.message || "Erreur lors de la récupération des patients";
                setPatientsError(errorMessage);
                console.error("Erreur lors de la récupération des patients:", err);
            } finally {
                setPatientsLoading(false);
            }
        };
        fetchPatients();
    }, []);

    // Fetch doctors for the dropdown
    useEffect(() => {
        const fetchMedecins = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/medecins", {
                    withCredentials: true,
                });
                const transformedMedecins = response.data.map((medecin) => ({
                    id: medecin.id || medecin._id,
                    name: medecin.name || `${medecin.prenom || ""} ${medecin.nom || ""}`.trim(),
                }));
                setMedecins(transformedMedecins);
                if (!transformedMedecins.length) {
                    setMedecinsError("Aucun médecin trouvé");
                }
            } catch (err) {
                const errorMessage = err.response?.data?.message || "Erreur lors de la récupération des médecins";
                setMedecinsError(errorMessage);
                console.error("Erreur lors de la récupération des médecins:", err);
            } finally {
                setMedecinsLoading(false);
            }
        };
        fetchMedecins();
    }, []);

    // Fetch rendezvous
    useEffect(() => {
        const fetchRendezvous = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/rendezvous", {
                    withCredentials: true,
                });
                setRendezvous(response.data);
            } catch (err) {
                setError(err.response?.data?.message || "Erreur lors de la récupération des rendez-vous");
            } finally {
                setLoading(false);
            }
        };
        fetchRendezvous();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentRendezvous((prev) => ({ ...prev, [name]: value }));
    };

    // Open modal for adding or editing
    const openModal = (rdv = null) => {
        if (patientsLoading || medecinsLoading) {
            toast.warn("Veuillez attendre le chargement des patients et médecins");
            return;
        }
        if (!patients.length || !medecins.length) {
            toast.warn("Aucun patient ou médecin disponible");
            return;
        }
        if (rdv) {
            setIsEditing(true);
            setCurrentRendezvous({
                id: rdv.id,
                dateRendezVous: new Date(rdv.dateRendezVous).toISOString().split("T")[0],
                heureDebut: new Date(rdv.heureDebut).toISOString().slice(11, 16),
                heureFin: new Date(rdv.heureFin).toISOString().slice(11, 16),
                titre: rdv.titre,
                description: rdv.description,
                statut: rdv.statut,
                patient: rdv.patient._id,
                medecin: rdv.medecin._id,
            });
        } else {
            setIsEditing(false);
            setCurrentRendezvous({
                id: "",
                dateRendezVous: "",
                heureDebut: "",
                heureFin: "",
                titre: "",
                description: "",
                statut: "Planifié",
                patient: "",
                medecin: "",
            });
        }
        setModalOpen(true);
    };

    // Submit form (add or edit rendezvous)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentRendezvous.patient) {
            toast.error("Veuillez sélectionner un patient");
            return;
        }
        if (!currentRendezvous.medecin) {
            toast.error("Veuillez sélectionner un médecin");
            return;
        }
        try {
            const formattedRendezvous = {
                ...currentRendezvous,
                heureDebut: `${currentRendezvous.dateRendezVous}T${currentRendezvous.heureDebut}:00Z`,
                heureFin: `${currentRendezvous.dateRendezVous}T${currentRendezvous.heureFin}:00Z`,
            };

            if (isEditing) {
                const response = await axios.put(
                    `http://localhost:5000/api/rendezvous/${currentRendezvous.id}`,
                    formattedRendezvous,
                    { withCredentials: true }
                );
                setRendezvous((prev) =>
                    prev.map((rdv) => (rdv.id === currentRendezvous.id ? response.data.rendezvous : rdv))
                );
                toast.success("Rendez-vous modifié avec succès");
            } else {
                const response = await axios.post("http://localhost:5000/api/rendezvous", formattedRendezvous, {
                    withCredentials: true,
                });
                setRendezvous((prev) => [response.data.rendezvous, ...prev]);
                toast.success("Rendez-vous ajouté avec succès");
            }
            setModalOpen(false);
            const response = await axios.get("http://localhost:5000/api/rendezvous", { withCredentials: true });
            setRendezvous(response.data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement du rendez-vous");
            console.error("Erreur lors de l'enregistrement:", err.response?.data);
        }
    };

    // Delete rendezvous
    const handleDelete = async (id) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce rendez-vous ?")) {
            try {
                await axios.delete(`http://localhost:5000/api/rendezvous/${id}`, { withCredentials: true });
                setRendezvous(rendezvous.filter((rdv) => rdv.id !== id));
                toast.success("Rendez-vous supprimé avec succès");
            } catch (err) {
                toast.error(err.response?.data?.message || "Erreur lors de la suppression du rendez-vous");
            }
        }
    };

    // Filter and sort rendezvous
    const filteredRendezvous = rendezvous
        .filter((rdv) => {
            const patientName = `${rdv.patient?.prenom} ${rdv.patient?.nom}`.toLowerCase();
            const matchesSearch = patientName.includes(searchTerm.toLowerCase());
            const matchesDate = filterDate
                ? new Date(rdv.dateRendezVous).toISOString().split("T")[0] === filterDate
                : true;
            return matchesSearch && matchesDate;
        })
        .sort((a, b) => new Date(b.dateRendezVous) - new Date(a.dateRendezVous));

    if (loading || patientsLoading || medecinsLoading)
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
        );
    if (error)
        return <div className="flex justify-center items-center h-screen text-red-600 text-lg">{error}</div>;
    if (patientsError && !patients.length)
        return (
            <div className="flex justify-center items-center h-screen text-red-600 text-lg">
                {patientsError}
            </div>
        );
    if (medecinsError && !medecins.length)
        return (
            <div className="flex justify-center items-center h-screen text-red-600 text-lg">
                {medecinsError}
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Gestion des Rendez-vous</h1>
                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="relative w-full sm:w-64">
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
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            />
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition transform hover:scale-105"
                        >
                            <FaPlus className="mr-2" /> Nouveau Rendez-vous
                        </button>
                    </div>
                </div>

                {/* Appointment Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRendezvous.length > 0 ? (
                        filteredRendezvous.map((rdv) => (
                            <div
                                key={rdv.id}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition transform hover:-translate-y-1"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{rdv.titre}</h3>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Patient:</span> {rdv.patient?.prenom}{" "}
                                            {rdv.patient?.nom}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Médecin:</span> {rdv.medecin?.prenom}{" "}
                                            {rdv.medecin?.nom}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-sm font-medium px-3 py-1 rounded ${rdv.statut === "Planifié"
                                            ? "bg-yellow-100 text-yellow-600"
                                            : rdv.statut === "En cours"
                                                ? "bg-blue-100 text-blue-600"
                                                : rdv.statut === "Terminé"
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-red-100 text-red-600"
                                            }`}
                                    >
                                        {rdv.statut}
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Date:</span>{" "}
                                        {new Date(rdv.dateRendezVous).toLocaleDateString("fr-FR")}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Heure:</span>{" "}
                                        {new Date(rdv.heureDebut).toLocaleTimeString("fr-FR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}{" "}
                                        -{" "}
                                        {new Date(rdv.heureFin).toLocaleTimeString("fr-FR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <div className="mt-4 flex justify-end space-x-3">
                                    <button
                                        onClick={() => openModal(rdv)}
                                        className="text-blue-600 hover:text-blue-800 transition"
                                    >
                                        <FaEdit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rdv.id)}
                                        className="text-red-600 hover:text-red-800 transition"
                                    >
                                        <FaTrash size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10">
                            <p className="text-gray-600 text-lg">Aucun rendez-vous trouvé</p>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {modalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                                    {isEditing ? "Modifier le rendez-vous" : "Ajouter un rendez-vous"}
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                                        <select
                                            name="patient"
                                            value={currentRendezvous.patient}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                            required
                                        >
                                            <option value="">Sélectionner un patient</option>
                                            {patients.length === 0 && !patientsLoading ? (
                                                <option disabled>Aucun patient disponible</option>
                                            ) : (
                                                patients.map((patient) => (
                                                    <option key={patient.id} value={patient.id}>
                                                        {patient.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Médecin</label>
                                        <select
                                            name="medecin"
                                            value={currentRendezvous.medecin}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                            required
                                        >
                                            <option value="">Sélectionner un médecin</option>
                                            {medecins.length === 0 && !medecinsLoading ? (
                                                <option disabled>Aucun médecin disponible</option>
                                            ) : (
                                                medecins.map((medecin) => (
                                                    <option key={medecin.id} value={medecin.id}>
                                                        {medecin.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                                        <input
                                            type="text"
                                            name="titre"
                                            value={currentRendezvous.titre}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                            placeholder="Ex: Consultation générale"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            name="dateRendezVous"
                                            value={currentRendezvous.dateRendezVous}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Heure de début
                                            </label>
                                            <input
                                                type="time"
                                                name="heureDebut"
                                                value={currentRendezvous.heureDebut}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Heure de fin
                                            </label>
                                            <input
                                                type="time"
                                                name="heureFin"
                                                value={currentRendezvous.heureFin}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            name="description"
                                            value={currentRendezvous.description}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                            rows="3"
                                            placeholder="Détails du rendez-vous"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                                        <select
                                            name="statut"
                                            value={currentRendezvous.statut}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                            required
                                        >
                                            <option value="Planifié">Planifié</option>
                                            <option value="En cours">En cours</option>
                                            <option value="Terminé">Terminé</option>
                                            <option value="Annulé">Annulé</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setModalOpen(false)}
                                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
                                            {isEditing ? "Modifier" : "Ajouter"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Appointment;