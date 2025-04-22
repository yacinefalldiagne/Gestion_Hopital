import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaFileMedical, FaPaperclip, FaSave, FaTrash, FaPlus, FaEye } from "react-icons/fa";
import { CloudUpload } from 'lucide-react';

function EditPatient() {
    const { id } = useParams();
    const navigate = useNavigate();
    const userRole = localStorage.getItem("userRole") || "medecin";
    const [activeSection, setActiveSection] = useState("general");
    const [patient, setPatient] = useState({
        prenom: "",
        nom: "",
        dateNaissance: "",
        email: "",
        telephone: "",
    });
    const [dossiers, setDossiers] = useState([]);
    const [newFiles, setNewFiles] = useState({}); // { dossierId: [File, File, ...] }
    const [dragOver, setDragOver] = useState({}); // { dossierId: boolean }
    const [uploading, setUploading] = useState({}); // { dossierId: boolean }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        console.log("ID extrait de l'URL :", id);
        const fetchPatientData = async () => {
            try {
                setLoading(true);
                if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
                    throw new Error("Identifiant utilisateur invalide");
                }
                const patientResponse = await axios.get(
                    `http://localhost:5000/api/patients/details?userId=${id}`,
                    { withCredentials: true }
                );
                console.log("Réponse de l'API patient :", patientResponse.data);
                const patientData = patientResponse.data;
                setPatient({
                    prenom: patientData.prenom || "",
                    nom: patientData.nom || "",
                    dateNaissance: patientData.dateNaissance
                        ? new Date(patientData.dateNaissance).toISOString().split("T")[0]
                        : "",
                    email: patientData.email || "",
                    telephone: patientData.phone || "",
                });

                console.log("Dossiers fetched for patient:", patientData.dossiers);
                setDossiers(patientData.dossiers || []);
                setLoading(false);
            } catch (err) {
                console.error("Erreur lors de la récupération des données :", err);
                const errorMessage =
                    err.response?.status === 404
                        ? "Patient non trouvé. Veuillez vérifier l'identifiant ou créer un nouveau patient."
                        : err.message || "Erreur lors de la récupération des données du patient";
                setError(errorMessage);
                setLoading(false);
            }
        };

        fetchPatientData();
    }, [id]);

    const handlePatientChange = (e) => {
        const { name, value } = e.target;
        setPatient((prev) => ({ ...prev, [name]: value }));
    };

    const handleDossierChange = (dossierId, field, value) => {
        setDossiers((prev) =>
            prev.map((dossier) =>
                dossier._id === dossierId ? { ...dossier, [field]: value } : dossier
            )
        );
    };

    const handleArrayChange = (dossierId, arrayName, index, field, value) => {
        setDossiers((prev) =>
            prev.map((dossier) =>
                dossier._id === dossierId
                    ? {
                        ...dossier,
                        [arrayName]: dossier[arrayName].map((item, i) =>
                            i === index ? { ...item, [field]: value } : item
                        ),
                    }
                    : dossier
            )
        );
    };

    const addArrayItem = (dossierId, arrayName) => {
        setDossiers((prev) =>
            prev.map((dossier) =>
                dossier._id === dossierId
                    ? {
                        ...dossier,
                        [arrayName]: [...dossier[arrayName], { description: "", date: "" }],
                    }
                    : dossier
            )
        );
    };

    const removeArrayItem = (dossierId, arrayName, index) => {
        setDossiers((prev) =>
            prev.map((dossier) =>
                dossier._id === dossierId
                    ? {
                        ...dossier,
                        [arrayName]: dossier[arrayName].filter((_, i) => i !== index),
                    }
                    : dossier
            )
        );
    };

    const handleFileChange = (dossierId, e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // Limite à 10 Mo
        if (validFiles.length < files.length) {
            setError("Certains fichiers sont trop volumineux (max 10 Mo)");
        }
        setNewFiles((prev) => ({ ...prev, [dossierId]: validFiles }));
    };

    const handleDrop = (dossierId, e) => {
        e.preventDefault();
        setDragOver((prev) => ({ ...prev, [dossierId]: false }));
        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // Limite à 10 Mo
        if (validFiles.length < files.length) {
            setError("Certains fichiers sont trop volumineux (max 10 Mo)");
        }
        setNewFiles((prev) => ({ ...prev, [dossierId]: validFiles }));
    };

    const handleFileSubmit = async (dossierId) => {
        try {
            const files = newFiles[dossierId];
            if (!files || files.length === 0) {
                setError("Aucun fichier sélectionné");
                return;
            }

            setUploading((prev) => ({ ...prev, [dossierId]: true }));

            const formData = new FormData();
            files.forEach(file => formData.append("documents", file));

            const response = await axios.put(`http://localhost:5000/api/dossiers/${dossierId}`, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Mettre à jour l'état local pour ajouter les nouveaux fichiers
            setDossiers((prev) =>
                prev.map((dossier) =>
                    dossier._id === dossierId
                        ? {
                            ...dossier,
                            documentsAssocies: [
                                ...dossier.documentsAssocies,
                                ...(response.data.newDocumentPaths || []),
                            ],
                        }
                        : dossier
                )
            );

            setSuccess(`Fichiers ajoutés au dossier ${dossiers.find((d) => d._id === dossierId).numero} avec succès`);
            setError("");
            setNewFiles((prev) => ({ ...prev, [dossierId]: [] }));
        } catch (err) {
            setError(
                err.response?.data?.message || "Erreur lors de l'ajout des fichiers"
            );
            setSuccess("");
        } finally {
            setUploading((prev) => ({ ...prev, [dossierId]: false }));
        }
    };

    const handleDeleteDocument = async (dossierId, documentPath) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce document ?")) {
            try {
                await axios.delete(
                    `http://localhost:5000/api/dossiers/document/${dossierId}/${encodeURIComponent(
                        documentPath
                    )}`,
                    { withCredentials: true }
                );
                setDossiers((prev) =>
                    prev.map((dossier) =>
                        dossier._id === dossierId
                            ? {
                                ...dossier,
                                documentsAssocies: dossier.documentsAssocies.filter(
                                    (doc) => doc !== documentPath
                                ),
                            }
                            : dossier
                    )
                );
                setSuccess("Document supprimé avec succès");
                setError("");
            } catch (err) {
                setError(
                    err.response?.data?.message || "Erreur lors de la suppression du document"
                );
                setSuccess("");
            }
        }
    };

    const validatePatientForm = () => {
        if (!patient.prenom || !patient.nom) {
            setError("Le prénom et le nom sont obligatoires");
            return false;
        }
        return true;
    };

    const handlePatientSubmit = async (e) => {
        e.preventDefault();
        if (!validatePatientForm()) return;

        try {
            await axios.put(`http://localhost:5000/api/patients/${id}`, patient, {
                withCredentials: true,
            });
            setSuccess("Informations du patient mises à jour avec succès");
            setError("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Erreur lors de la mise à jour des informations du patient"
            );
            setSuccess("");
        }
    };

    const handleDossierSubmit = async (dossierId) => {
        try {
            const dossier = dossiers.find((d) => d._id === dossierId);
            const data = new FormData();
            data.append("noteMedecin", dossier.noteMedecin || "");
            data.append("consultations", JSON.stringify(dossier.consultations || []));
            data.append("prescriptions", JSON.stringify(dossier.prescriptions || []));
            data.append("labResults", JSON.stringify(dossier.labResults || []));

            if (newFiles[dossierId] && newFiles[dossierId].length > 0) {
                newFiles[dossierId].forEach(file => data.append("documents", file));
            }

            const response = await axios.put(`http://localhost:5000/api/dossiers/${dossierId}`, data, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });

            setDossiers((prev) =>
                prev.map((dossier) =>
                    dossier._id === dossierId
                        ? {
                            ...dossier,
                            documentsAssocies: [
                                ...dossier.documentsAssocies,
                                ...(response.data.newDocumentPaths || []),
                            ],
                        }
                        : dossier
                )
            );

            setSuccess(`Dossier ${dossier.numero} mis à jour avec succès`);
            setError("");
            setNewFiles((prev) => ({ ...prev, [dossierId]: [] }));
        } catch (err) {
            setError(
                err.response?.data?.message || "Erreur lors de la mise à jour du dossier"
            );
            setSuccess("");
        }
    };

    const sections = [
        { id: "general", title: "Informations générales", icon: <FaUser /> },
        { id: "dossiers", title: "Dossier Patient", icon: <FaFileMedical /> },
        { id: "attachments", title: "Pièces jointes", icon: <FaPaperclip /> },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6">
                    <p className="text-gray-600">Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Modifier Patient : {patient.prenom} {patient.nom}
                    </h1>
                    <button
                        onClick={() => navigate(`/${userRole}/patients`)}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        Retour
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
                        {success}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:space-x-6">
                        <div className="w-full sm:w-1/4 mb-6 sm:mb-0">
                            <ul className="space-y-4">
                                {sections.map((section) => (
                                    <li
                                        key={section.id}
                                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${activeSection === section.id
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        onClick={() => setActiveSection(section.id)}
                                    >
                                        <span>{section.icon}</span>
                                        <span className="font-medium">{section.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="w-full sm:w-3/4">
                            {activeSection === "general" && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Informations générales
                                    </h2>
                                    <form onSubmit={handlePatientSubmit} className="space-y-4">
                                        <div>
                                            <label
                                                htmlFor="prenom"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Prénom
                                            </label>
                                            <input
                                                type="text"
                                                id="prenom"
                                                name="prenom"
                                                placeholder={patient.prenom}
                                                value={patient.prenom}
                                                onChange={handlePatientChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="nom"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Nom
                                            </label>
                                            <input
                                                type="text"
                                                id="nom"
                                                name="nom"
                                                placeholder={patient.nom}
                                                value={patient.nom}
                                                onChange={handlePatientChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="dateNaissance"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Date de naissance
                                            </label>
                                            <input
                                                type="date"
                                                id="dateNaissance"
                                                name="dateNaissance"
                                                placeholder={patient.dateNaissance}
                                                value={patient.dateNaissance}
                                                onChange={handlePatientChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="email"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={patient.email}
                                                onChange={handlePatientChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="telephone"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Téléphone
                                            </label>
                                            <input
                                                type="tel"
                                                id="telephone"
                                                name="telephone"
                                                value={patient.telephone}
                                                onChange={handlePatientChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                            >
                                                <FaSave />
                                                <span>Enregistrer</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeSection === "dossiers" && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Dossier Patient
                                    </h2>
                                    {dossiers.length === 0 ? (
                                        <p className="text-gray-600">
                                            Aucun dossier médical trouvé.
                                        </p>
                                    ) : (
                                        <div className="space-y-6">
                                            {dossiers.map((dossier) => (
                                                <div
                                                    key={dossier._id}
                                                    className="border p-4 rounded-lg"
                                                >
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        Dossier {dossier.numero}
                                                    </h3>
                                                    <div className="space-y-4 mt-4">
                                                        <div>
                                                            <label
                                                                htmlFor={`noteMedecin-${dossier._id}`}
                                                                className="block text-sm font-medium text-gray-700"
                                                            >
                                                                Notes du médecin
                                                            </label>
                                                            <textarea
                                                                id={`noteMedecin-${dossier._id}`}
                                                                value={dossier.noteMedecin || ""}
                                                                onChange={(e) =>
                                                                    handleDossierChange(
                                                                        dossier._id,
                                                                        "noteMedecin",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                rows={4}
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            />
                                                        </div>

                                                        {/* Consultations */}
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-700">
                                                                Consultations
                                                            </h4>
                                                            {dossier.consultations.map((consult, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex space-x-2 mt-2"
                                                                >
                                                                    <input
                                                                        type="date"
                                                                        value={consult.date || ""}
                                                                        onChange={(e) =>
                                                                            handleArrayChange(
                                                                                dossier._id,
                                                                                "consultations",
                                                                                index,
                                                                                "date",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={consult.description || ""}
                                                                        onChange={(e) =>
                                                                            handleArrayChange(
                                                                                dossier._id,
                                                                                "consultations",
                                                                                index,
                                                                                "description",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="Description"
                                                                        className="block w-2/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                                    />
                                                                    <button
                                                                        onClick={() =>
                                                                            removeArrayItem(
                                                                                dossier._id,
                                                                                "consultations",
                                                                                index
                                                                            )
                                                                        }
                                                                        className="text-red-600 hover:text-red-800"
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() =>
                                                                    addArrayItem(
                                                                        dossier._id,
                                                                        "consultations"
                                                                    )
                                                                }
                                                                className="mt-2 text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                                            >
                                                                <FaPlus />
                                                                <span>Ajouter une consultation</span>
                                                            </button>
                                                        </div>

                                                        {/* Prescriptions */}
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-700">
                                                                Prescriptions
                                                            </h4>
                                                            {dossier.prescriptions.map((presc, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex space-x-2 mt-2"
                                                                >
                                                                    <input
                                                                        type="date"
                                                                        value={presc.date || ""}
                                                                        onChange={(e) =>
                                                                            handleArrayChange(
                                                                                dossier._id,
                                                                                "prescriptions",
                                                                                index,
                                                                                "date",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={presc.description || ""}
                                                                        onChange={(e) =>
                                                                            handleArrayChange(
                                                                                dossier._id,
                                                                                "prescriptions",
                                                                                index,
                                                                                "description",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="Description"
                                                                        className="block w-2/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                                    />
                                                                    <button
                                                                        onClick={() =>
                                                                            removeArrayItem(
                                                                                dossier._id,
                                                                                "prescriptions",
                                                                                index
                                                                            )
                                                                        }
                                                                        className="text-red-600 hover:text-red-800"
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() =>
                                                                    addArrayItem(
                                                                        dossier._id,
                                                                        "prescriptions"
                                                                    )
                                                                }
                                                                className="mt-2 text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                                            >
                                                                <FaPlus />
                                                                <span>Ajouter une prescription</span>
                                                            </button>
                                                        </div>

                                                        {/* Résultats de laboratoire */}
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-700">
                                                                Résultats de laboratoire
                                                            </h4>
                                                            {dossier.labResults.map((result, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex space-x-2 mt-2"
                                                                >
                                                                    <input
                                                                        type="date"
                                                                        value={result.date || ""}
                                                                        onChange={(e) =>
                                                                            handleArrayChange(
                                                                                dossier._id,
                                                                                "labResults",
                                                                                index,
                                                                                "date",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={result.description || ""}
                                                                        onChange={(e) =>
                                                                            handleArrayChange(
                                                                                dossier._id,
                                                                                "labResults",
                                                                                index,
                                                                                "description",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="Description"
                                                                        className="block w-2/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                                    />
                                                                    <button
                                                                        onClick={() =>
                                                                            removeArrayItem(
                                                                                dossier._id,
                                                                                "labResults",
                                                                                index
                                                                            )
                                                                        }
                                                                        className="text-red-600 hover:text-red-800"
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() =>
                                                                    addArrayItem(
                                                                        dossier._id,
                                                                        "labResults"
                                                                    )
                                                                }
                                                                className="mt-2 text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                                            >
                                                                <FaPlus />
                                                                <span>
                                                                    Ajouter un résultat de laboratoire
                                                                </span>
                                                            </button>
                                                        </div>

                                                        <div className="flex justify-end">
                                                            <button
                                                                onClick={() =>
                                                                    handleDossierSubmit(dossier._id)
                                                                }
                                                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                                            >
                                                                <FaSave />
                                                                <span>Enregistrer</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSection === "attachments" && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Pièces jointes
                                    </h2>
                                    {dossiers.length === 0 ? (
                                        <p className="text-gray-600">
                                            Aucun dossier médical trouvé.
                                        </p>
                                    ) : (
                                        <div className="space-y-6">
                                            {dossiers.map((dossier) => (
                                                <div
                                                    key={dossier._id}
                                                    className="bg-white rounded-lg shadow-sm p-6"
                                                >
                                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                                        Dossier {dossier.numero}
                                                    </h3>
                                                    <div className="mb-6">
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                            Télécharger de nouveaux documents
                                                        </h4>
                                                        <div
                                                            onDrop={(e) => handleDrop(dossier._id, e)}
                                                            onDragOver={(e) => {
                                                                e.preventDefault();
                                                                setDragOver((prev) => ({ ...prev, [dossier._id]: true }));
                                                            }}
                                                            onDragLeave={() => setDragOver((prev) => ({ ...prev, [dossier._id]: false }))}
                                                            className={`w-full h-40 border-4 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors duration-300 relative ${dragOver[dossier._id] ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                                                                }`}
                                                        >
                                                            <CloudUpload className="w-10 h-10 text-blue-500 mb-2" />
                                                            <p className="text-gray-600 text-center">
                                                                {uploading[dossier._id]
                                                                    ? 'Upload en cours...'
                                                                    : 'Glissez-déposez vos fichiers ici ou cliquez pour sélectionner'}
                                                            </p>
                                                            <input
                                                                type="file"
                                                                multiple
                                                                disabled={uploading[dossier._id]}
                                                                className="opacity-0 w-full h-full absolute cursor-pointer"
                                                                onChange={(e) => handleFileChange(dossier._id, e)}
                                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                            />
                                                        </div>
                                                        {newFiles[dossier._id] && newFiles[dossier._id].length > 0 && (
                                                            <div className="mt-4">
                                                                <h5 className="font-medium text-gray-700">Fichiers sélectionnés :</h5>
                                                                <ul className="mt-2 space-y-1">
                                                                    {newFiles[dossier._id].map((file, index) => (
                                                                        <li key={index} className="text-sm text-gray-600">
                                                                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                <button
                                                                    onClick={() => handleFileSubmit(dossier._id)}
                                                                    disabled={uploading[dossier._id]}
                                                                    className={`mt-4 flex items-center space-x-2 px-4 py-2 rounded-lg ${uploading[dossier._id]
                                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                                                        }`}
                                                                >
                                                                    <FaSave />
                                                                    <span>Enregistrer</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                            Documents associés
                                                        </h4>
                                                        {dossier.documentsAssocies.length === 0 ? (
                                                            <p className="text-gray-500 text-center">Aucun document disponible</p>
                                                        ) : (
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full divide-y divide-gray-200">
                                                                    <thead className="bg-gray-50">
                                                                        <tr>
                                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du fichier</th>
                                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {dossier.documentsAssocies.map((doc, index) => (
                                                                            <tr key={index}>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                                    {doc.split("/").pop()}
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation(); // Empêche l'ouverture du gestionnaire de fichiers
                                                                                            window.open(`http://localhost:5000${doc}`, '_blank', 'noopener,noreferrer');
                                                                                        }}
                                                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                                                    >
                                                                                        <FaEye />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation(); // Empêche l'ouverture du gestionnaire de fichiers
                                                                                            handleDeleteDocument(dossier._id, doc);
                                                                                        }}
                                                                                        className="text-red-600 hover:text-red-900"
                                                                                    >
                                                                                        <FaTrash />
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditPatient;