import React, { useState, useEffect } from "react";
import { FaPlus, FaEye, FaSearch, FaSort, FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaCalendarAlt } from "react-icons/fa";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Medecins() {
    const [medecins, setMedecins] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedMedecin, setSelectedMedecin] = useState(null);
    const [step, setStep] = useState(1);
    const [userId, setUserId] = useState(null);
    const [newMedecin, setNewMedecin] = useState({
        prenom: "",
        nom: "",
        email: "",
        password: "",
        role: "medecin",
        numeroTelephone: "",
        specialite: [],
        horaires: [{ jour: "Lundi", heureDebut: "", heureFin: "" }],
        statut: "Actif",
    });
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState("");

    useEffect(() => {
        const fetchMedecins = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/medecins", {
                    withCredentials: true,
                });
                const transformedMedecins = response.data.map((medecin) => ({
                    id: medecin.id,
                    name: medecin.name,
                    specialite: medecin.specialite,
                    lastAppointment: medecin.lastAppointment,
                    phone: medecin.phone,
                    email: medecin.email,
                    statut: medecin.statut,
                }));
                setMedecins(transformedMedecins);
            } catch (err) {
                setError(err.response?.data?.message || "Erreur lors de la récupération des médecins");
            } finally {
                setLoading(false);
            }
        };
        fetchMedecins();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMedecin((prev) => ({ ...prev, [name]: value }));
    };

    const handleSpecialiteChange = (e) => {
        const specialites = e.target.value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item);
        setNewMedecin((prev) => ({ ...prev, specialite: specialites }));
    };

    const handleHoraireChange = (index, field, value) => {
        const updatedHoraires = [...newMedecin.horaires];
        updatedHoraires[index][field] = value;
        setNewMedecin((prev) => ({ ...prev, horaires: updatedHoraires }));
    };

    const addHoraire = () => {
        setNewMedecin((prev) => ({
            ...prev,
            horaires: [...prev.horaires, { jour: "Lundi", heureDebut: "", heureFin: "" }],
        }));
    };

    const removeHoraire = (index) => {
        setNewMedecin((prev) => ({
            ...prev,
            horaires: prev.horaires.filter((_, i) => i !== index),
        }));
    };

    const handleRegisterUser = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalError("");

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/register",
                {
                    prenom: newMedecin.prenom,
                    nom: newMedecin.nom,
                    email: newMedecin.email,
                    password: newMedecin.password,
                    role: newMedecin.role,
                },
                { withCredentials: true }
            );

            const userId = response.data.userId || response.data.id || (response.data.user && response.data.user.id);
            if (!userId) {
                throw new Error("userId non reçu dans la réponse de /api/auth/register");
            }

            setUserId(userId);
            toast.success("Utilisateur enregistré avec succès !");
            setStep(2);
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Erreur lors de l'enregistrement de l'utilisateur";
            setModalError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setModalLoading(false);
        }
    };

    const handleSubmitMedecin = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalError("");

        try {
            const medecinData = {
                userId,
                nom: newMedecin.nom,
                prenom: newMedecin.prenom,
                numeroTelephone: newMedecin.numeroTelephone,
                email: newMedecin.email,
                specialite: newMedecin.specialite,
                horaires: new cv(newMedecin.horaires),
                statut: newMedecin.statut,
            };

            await axios.post("http://localhost:5000/api/medecins", medecinData, {
                withCredentials: true,
            });
            toast.success("Médecin ajouté avec succès !");
            setTimeout(() => {
                setShowAddModal(false);
                window.location.reload();
            }, 3000);
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout du médecin";
            setModalError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setModalLoading(false);
        }
    };

    const handleViewDetails = async (id) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/medecins/details?userId=${id}`, {
                withCredentials: true,
            });
            setSelectedMedecin(response.data);
            setShowDetailsModal(true);
        } catch (err) {
            toast.error(err.response?.data?.message || "Erreur lors de la récupération des détails du médecin");
        }
    };

    const filteredMedecins = medecins.filter((medecin) =>
        medecin.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedMedecins = [...filteredMedecins].sort((a, b) => {
        if (sortBy === "name") {
            return a.name.localeCompare(b.name);
        } else if (sortBy === "lastAppointment") {
            return new Date(b.lastAppointment) - new Date(a.lastAppointment);
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
            <ToastContainer />
            {/* En-tête */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Médecins</h1>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Total Médecins</p>
                    <p className="text-2xl font-semibold text-gray-800">{medecins.length}</p>
                </div>
            </div>

            {/* Barre de recherche et tri */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-full max-w-md">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un médecin..."
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

            {/* Bouton Ajouter et grille des médecins */}
            <div className="flex flex-col space-y-6">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2 w-fit text-white bg-blue-600 py-2 px-4 rounded-full hover:bg-blue-700 transition-colors shadow-md"
                >
                    <FaPlus />
                    <span>Ajouter un médecin</span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedMedecins.length > 0 ? (
                        sortedMedecins.map((medecin) => (
                            <div
                                key={medecin.id}
                                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-center space-x-4 mb-4">

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{medecin.name}</h3>
                                        <p className="text-sm text-gray-600">{medecin.specialite}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Téléphone :</span> {medecin.phone}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Dernier rendez-vous :</span>{" "}
                                        {medecin.lastAppointment}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Statut :</span> {medecin.statut}
                                    </p>
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={() => handleViewDetails(medecin.id)}
                                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                                    >
                                        <FaEye />
                                        <span>Voir détails</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-600">
                            Aucun médecin trouvé.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal pour ajouter un médecin */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Ajouter un nouveau médecin</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-600 hover:text-gray-800"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-center space-x-4">
                                {[
                                    { id: 1, title: "Inscription de l'utilisateur" },
                                    { id: 2, title: "Informations du médecin" },
                                ].map((s, index) => (
                                    <div key={s.id} className="flex items-center">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s.id ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
                                                }`}
                                        >
                                            {s.id}
                                        </div>
                                        <div className="ml-2">
                                            <p
                                                className={`text-sm font-medium ${step >= s.id ? "text-blue-600" : "text-gray-600"
                                                    }`}
                                            >
                                                {s.title}
                                            </p>
                                        </div>
                                        {index < 1 && (
                                            <div
                                                className={`flex-1 h-1 mx-4 ${step > s.id ? "bg-blue-600" : "bg-gray-300"
                                                    }`}
                                            ></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {modalError && <div className="text-red-600 mb-4">{modalError}</div>}

                        {step === 1 && (
                            <form onSubmit={handleRegisterUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Prénom</label>
                                    <input
                                        type="text"
                                        name="prenom"
                                        value={newMedecin.prenom}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Prénom"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Nom</label>
                                    <input
                                        type="text"
                                        name="nom"
                                        value={newMedecin.nom}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nom"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={newMedecin.email}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Email"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Mot de passe</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={newMedecin.password}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Mot de passe"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={modalLoading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                                    >
                                        {modalLoading ? "Enregistrement..." : "Suivant"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleSubmitMedecin} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
                                    <input
                                        type="text"
                                        name="numeroTelephone"
                                        value={newMedecin.numeroTelephone}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Numéro de téléphone"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Spécialités (séparées par des virgules)
                                    </label>
                                    <input
                                        type="text"
                                        name="specialite"
                                        value={newMedecin.specialite.join(", ")}
                                        onChange={handleSpecialiteChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: Cardiologie, Pédiatrie"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Statut</label>
                                    <select
                                        name="statut"
                                        value={newMedecin.statut}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="Actif">Actif</option>
                                        <option value="Inactif">Inactif</option>
                                        <option value="En congé">En congé</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Horaires</label>
                                    {newMedecin.horaires.map((horaire, index) => (
                                        <div key={index} className="flex space-x-2 mb-2">
                                            <select
                                                value={horaire.jour}
                                                onChange={(e) => handleHoraireChange(index, "jour", e.target.value)}
                                                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {[
                                                    "Lundi",
                                                    "Mardi",
                                                    "Mercredi",
                                                    "Jeudi",
                                                    "Vendredi",
                                                    "Samedi",
                                                    "Dimanche",
                                                ].map((jour) => (
                                                    <option key={jour} value={jour}>
                                                        {jour}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="time"
                                                value={horaire.heureDebut}
                                                onChange={(e) => handleHoraireChange(index, "heureDebut", e.target.value)}
                                                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            <input
                                                type="time"
                                                value={horaire.heureFin}
                                                onChange={(e) => handleHoraireChange(index, "heureFin", e.target.value)}
                                                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeHoraire(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addHoraire}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        + Ajouter un horaire
                                    </button>
                                </div>
                                <div className="flex justify-between space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                                    >
                                        Retour
                                    </button>
                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={modalLoading}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                                        >
                                            {modalLoading ? "Ajout en cours..." : "Ajouter"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Modal pour voir les détails du médecin */}
            {showDetailsModal && selectedMedecin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">{selectedMedecin.name}</h2>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-600 hover:text-gray-800"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Informations personnelles */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <FaUser className="text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Nom</p>
                                            <p className="text-gray-900 font-medium">{selectedMedecin.nom}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <FaUser className="text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Prénom</p>
                                            <p className="text-gray-900 font-medium">{selectedMedecin.prenom}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <FaEnvelope className="text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="text-gray-900 font-medium">{selectedMedecin.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <FaPhone className="text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Téléphone</p>
                                            <p className="text-gray-900 font-medium">{selectedMedecin.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <FaUser className="text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Spécialités</p>
                                            <p className="text-gray-900 font-medium">
                                                {selectedMedecin.specialite.join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <FaUser className="text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Statut</p>
                                            <p className="text-gray-900 font-medium">{selectedMedecin.statut}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Horaires et rendez-vous */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Horaires</h3>
                                    <div className="space-y-4">
                                        {selectedMedecin.horaires.length > 0 ? (
                                            selectedMedecin.horaires.map((horaire, index) => (
                                                <div key={index} className="flex items-center space-x-3">
                                                    <FaCalendarAlt className="text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-500">{horaire.jour}</p>
                                                        <p className="text-gray-900 font-medium">
                                                            {horaire.heureDebut} - {horaire.heureFin}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500">Aucun horaire défini.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendez-vous</h3>
                                    <div className="space-y-6">
                                        {selectedMedecin.appointments.length > 0 ? (
                                            selectedMedecin.appointments.map((appointment, index) => (
                                                <div key={index} className="flex items-start space-x-3">
                                                    <div className="flex flex-col items-center">
                                                        <div
                                                            className={`w-4 h-4 rounded-full ${appointment.color || "bg-blue-500"
                                                                }`}
                                                        ></div>
                                                        {index < selectedMedecin.appointments.length - 1 && (
                                                            <div className="w-1 h-16 bg-gray-200"></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">{appointment.date}</p>
                                                        <p className="text-gray-900 font-medium">{appointment.title}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500">Aucun rendez-vous trouvé.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Medecins;