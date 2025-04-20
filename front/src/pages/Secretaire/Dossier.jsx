import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaPlus, FaFileAlt } from "react-icons/fa";
import { toast } from "react-toastify";

function Dossier() {
    const [dossiers, setDossiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDossier, setCurrentDossier] = useState({
        numero: "",
        patientId: "",
        noteMedecin: "",
        documentsAssocies: [],
    });
    const [patients, setPatients] = useState([]);
    const [file, setFile] = useState(null);

    // Fetch patients for the dropdown
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/patients", {
                    withCredentials: true,
                });
                setPatients(response.data);
            } catch (err) {
                console.error("Erreur lors de la récupération des patients:", err);
            }
        };
        fetchPatients();
    }, []);

    // Fetch dossiers
    useEffect(() => {
        const fetchDossiers = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/dossiers", {
                    withCredentials: true,
                });
                setDossiers(response.data);
            } catch (err) {
                setError(err.response?.data?.message || "Erreur lors de la récupération des dossiers");
            } finally {
                setLoading(false);
            }
        };
        fetchDossiers();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentDossier((prev) => ({ ...prev, [name]: value }));
    };

    // Handle file input
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    // Open modal for adding or editing
    const openModal = (dossier = null) => {
        if (dossier) {
            setIsEditing(true);
            setCurrentDossier({
                id: dossier._id,
                numero: dossier.numero,
                patientId: dossier.patient._id,
                noteMedecin: dossier.noteMedecin,
                documentsAssocies: dossier.documentsAssocies,
            });
        } else {
            setIsEditing(false);
            setCurrentDossier({
                numero: "",
                patientId: "",
                noteMedecin: "",
                documentsAssocies: [],
            });
            setFile(null);
        }
        setModalOpen(true);
    };

    // Submit form (add or edit dossier)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("numero", currentDossier.numero);
        formData.append("patientId", currentDossier.patientId);
        formData.append("noteMedecin", currentDossier.noteMedecin);
        if (file) {
            formData.append("document", file);
        }

        try {
            if (isEditing) {
                await axios.put(`http://localhost:5000/api/dossiers/${currentDossier.id}`, formData, {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Dossier modifié avec succès");
            } else {
                await axios.post("http://localhost:5000/api/dossiers", formData, {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Dossier ajouté avec succès");
            }
            setModalOpen(false);
            setFile(null);
            const response = await axios.get("http://localhost:5000/api/dossiers", { withCredentials: true });
            setDossiers(response.data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement du dossier");
        }
    };

    // Delete dossier
    const handleDelete = async (id) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce dossier ?")) {
            try {
                await axios.delete(`http://localhost:5000/api/dossiers/${id}`, { withCredentials: true });
                setDossiers(dossiers.filter((dossier) => dossier._id !== id));
                toast.success("Dossier supprimé avec succès");
            } catch (err) {
                toast.error(err.response?.data?.message || "Erreur lors de la suppression du dossier");
            }
        }
    };

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
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Liste des dossiers médicaux</h1>
            <button
                onClick={() => openModal()}
                className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
                <FaPlus className="mr-2" /> Ajouter un dossier
            </button>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="py-3 px-4 text-left text-gray-600 font-semibold">Numéro</th>
                            <th className="py-3 px-4 text-left text-gray-600 font-semibold">Patient</th>
                            <th className="py-3 px-4 text-left text-gray-600 font-semibold">Date de création</th>
                            <th className="py-3 px-4 text-left text-gray-600 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dossiers.length > 0 ? (
                            dossiers.map((dossier) => (
                                <tr key={dossier._id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 text-gray-800">{dossier.numero}</td>
                                    <td className="py-3 px-4 text-gray-800">{dossier.patient.name}</td>
                                    <td className="py-3 px-4 text-gray-600">
                                        {new Date(dossier.dateCreation).toLocaleDateString("fr-FR")}
                                    </td>


                                    <td className="py-3 px-4 flex space-x-2">
                                        <button
                                            onClick={() => openModal(dossier)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <FaEdit />
                                        </button>

                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="py-3 px-4 text-gray-600 text-center">
                                    Aucun dossier trouvé
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            {isEditing ? "Modifier le dossier" : "Ajouter un dossier"}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm text-gray-600 mb-1">Numéro du dossier</label>
                                <input
                                    type="text"
                                    name="numero"
                                    value={currentDossier.numero}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm text-gray-600 mb-1">Patient</label>
                                <select
                                    name="patientId"
                                    value={currentDossier.patientId}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Sélectionner un patient</option>
                                    {patients.map((patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm text-gray-600 mb-1">Note du médecin</label>
                                <textarea
                                    name="noteMedecin"
                                    value={currentDossier.noteMedecin}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="4"
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm text-gray-600 mb-1">Document associé</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {isEditing ? "Modifier" : "Ajouter"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dossier;