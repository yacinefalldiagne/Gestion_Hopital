import React, { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FaArrowLeft,
    FaPlus,
    FaTrash,
    FaEye,
    FaSave,
    FaTimes,
    FaFileMedical,
} from "react-icons/fa";
import { CloudUpload, Loader2 } from "lucide-react";

function DicomImages() {
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const [dossier, setDossier] = useState(null);
    const [dicomInstances, setDicomInstances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newFiles, setNewFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Fetch patient, dossier, and DICOM instances
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");

                // Fetch patient details
                const patientResponse = await axios.get(
                    `http://localhost:5000/api/patients/details?userId=${patientId}`,
                    { withCredentials: true }
                );
                setPatient(patientResponse.data);

                // Fetch dossier
                const dossierResponse = await axios.get(
                    `http://localhost:5000/api/dossiers?patientId=${patientId}`,
                    { withCredentials: true }
                );
                setDossier(dossierResponse.data[0] || null);

                // Fetch DICOM instances
                try {
                    const dicomResponse = await axios.get(
                        `http://localhost:5000/api/dossiers/dicom/${patientId}`,
                        { withCredentials: true }
                    );
                    setDicomInstances(dicomResponse.data || []);
                } catch (dicomError) {
                    if (dicomError.response?.status === 404) {
                        console.warn("Aucun DICOM trouvé pour ce patient");
                        setDicomInstances([]);
                    } else {
                        throw dicomError;
                    }
                }
            } catch (err) {
                console.error("Erreur lors de la récupération des données:", err);
                setError(
                    err.response?.data?.message || "Erreur lors de la récupération des données"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [patientId]);

    // Handle file selection
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter((file) => {
            const isDicom = /\.dcm$/i.test(file.name);
            const isSizeValid = file.size <= 10 * 1024 * 1024;
            if (!isDicom) {
                toast.error(`${file.name} n'est pas un fichier DICOM valide (.dcm)`);
            }
            if (!isSizeValid) {
                toast.error(`${file.name} dépasse la limite de 10 Mo`);
            }
            return isDicom && isSizeValid;
        });
        if (validFiles.length < files.length) {
            setError(
                "Certains fichiers ne sont pas des fichiers DICOM valides ou dépassent la limite de 10 Mo"
            );
        } else {
            setError("");
        }
        setNewFiles(validFiles);
        e.target.value = null;
        if (fileInputRef.current) {
            fileInputRef.current.blur();
        }
    };

    // Handle drag-and-drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter((file) => {
            const isDicom = /\.dcm$/i.test(file.name);
            const isSizeValid = file.size <= 10 * 1024 * 1024;
            if (!isDicom) {
                toast.error(`${file.name} n'est pas un fichier DICOM valide (.dcm)`);
            }
            if (!isSizeValid) {
                toast.error(`${file.name} dépasse la limite de 10 Mo`);
            }
            return isDicom && isSizeValid;
        });
        if (validFiles.length < files.length) {
            setError(
                "Certains fichiers ne sont pas des fichiers DICOM valides ou dépassent la limite de 10 Mo"
            );
        } else {
            setError("");
        }
        setNewFiles(validFiles);
    };

    // Handle file upload
    const handleFileSubmit = async () => {
        if (!newFiles.length) {
            toast.error("Aucun fichier sélectionné");
            setError("Aucun fichier sélectionné");
            return;
        }
        if (!dossier?._id) {
            toast.error(
                "Aucun dossier médical disponible. Veuillez créer un dossier d'abord."
            );
            setError(
                "Aucun dossier médical disponible. Veuillez créer un dossier d'abord."
            );
            return;
        }
        try {
            setUploading(true);
            setError("");
            setSuccess("");

            const formData = new FormData();
            newFiles.forEach((file) => formData.append("files", file));
            formData.append("dossierId", dossier._id);

            const response = await axios.post(
                "http://localhost:5000/api/dossiers/upload-dicom",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    withCredentials: true,
                }
            );

            const newInstances = response.data.instances.map((instance) => ({
                id: instance.instanceId,
                studyInstanceUID: instance.studyInstanceUID,
                patientName: instance.patientName,
                examDate: instance.examDate,
                studyDescription: instance.studyDescription,
                previewUrl: instance.previewUrl || `/instances/${instance.instanceId}/preview`,
                stoneViewerUrl: instance.stoneViewerUrl || null,
                createdAt: instance.examDate || instance.createdAt || Date.now(),
            }));

            if (newInstances.length === 0) {
                toast.error(
                    "Aucun fichier DICOM valide n'a été uploadé. Vérifiez les fichiers ou le serveur DICOM."
                );
                setError(
                    "Aucun fichier DICOM valide n'a été uploadé. Vérifiez les fichiers ou le serveur DICOM."
                );
                return;
            }

            setDicomInstances([...dicomInstances, ...newInstances]);
            setSuccess("Images DICOM ajoutées avec succès");
            toast.success("Images DICOM ajoutées avec succès");
            setNewFiles([]);
            setShowUploadModal(false);
        } catch (err) {
            console.error("Erreur lors de l'upload:", err);
            const errorMessage =
                err.response?.data?.message ||
                "Erreur lors de l'upload des fichiers DICOM. Vérifiez le serveur DICOM.";
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    // Handle instance deletion
    const handleDeleteInstance = async (instanceId) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette image DICOM ?"))
            return;
        try {
            await axios.delete(
                `http://localhost:5000/api/dossiers/dicom/${dossier._id}/${instanceId}`,
                { withCredentials: true }
            );
            setDicomInstances(
                dicomInstances.filter((instance) => instance.id !== instanceId)
            );
            setSuccess("Image DICOM supprimée avec succès");
            toast.success("Image DICOM supprimée avec succès");
            setError("");
        } catch (err) {
            console.error("Erreur lors de la suppression:", err);
            const errorMessage =
                err.response?.data?.message || "Erreur lors de la suppression de l'image";
            toast.error(errorMessage);
            setError(errorMessage);
            setSuccess("");
        }
    };

    // Open Orthanc viewer
    const openPreview = (instance) => {
        if (instance.stoneViewerUrl) {
            window.open(instance.stoneViewerUrl, "_blank");
        } else {
            toast.error("Aucune URL de visualisation disponible pour cette image");
            setError("Aucune URL de visualisation disponible pour cette image");
        }
    };

    // Trigger file input click
    const handleClickToSelect = () => {
        if (fileInputRef.current && !uploading) {
            fileInputRef.current.click();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-gray-600 font-medium">Chargement des données...</p>
                </div>
            </div>
        );
    }

    if (error && !patient) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600 text-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <ToastContainer />
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            to={`/medecin/patient/${patientId}`}
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <FaArrowLeft className="text-2xl" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Images DICOM - {patient?.prenom} {patient?.nom}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="max-w-7xl mx-auto mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2">
                    <FaTimes className="text-red-700" />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="max-w-7xl mx-auto mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center space-x-2">
                    <span>✔</span>
                    <span>{success}</span>
                </div>
            )}

            {/* DICOM Images Section */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <FaEye className="mr-2 text-blue-600" />
                            Images DICOM
                        </h2>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${dossier
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-400 cursor-not-allowed"
                                }`}
                            disabled={!dossier}
                        >
                            <FaPlus />
                            <span>Ajouter une Image</span>
                        </button>
                    </div>
                    {!dossier && (
                        <p className="text-red-600 mb-4">
                            Aucun dossier médical trouvé.{" "}
                            <Link
                                to={`/medecin/patient/${patientId}/record`}
                                className="text-blue-600 hover:underline"
                            >
                                Créez un dossier médical
                            </Link>{" "}
                            avant d'ajouter des images DICOM.
                        </p>
                    )}
                    {dicomInstances.length === 0 ? (
                        <p className="text-gray-500">Aucune image DICOM disponible.</p>
                    ) : (
                        <div className="space-y-4">
                            {dicomInstances.map((instance) => (
                                <div
                                    key={instance.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <FaFileMedical className="text-gray-400" />
                                        <div>
                                            <p className="text-gray-900 font-medium">
                                                {instance.studyDescription ||
                                                    instance.patientName ||
                                                    `Image DICOM ${instance.studyInstanceUID}`}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Ajoutée le :{" "}
                                                {new Date(
                                                    instance.examDate || instance.createdAt || Date.now()
                                                ).toLocaleDateString("fr-FR")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => openPreview(instance)}
                                            className="text-blue-600 hover:text-blue-800 transition"
                                            disabled={!instance.stoneViewerUrl}
                                            title={
                                                instance.stoneViewerUrl
                                                    ? "Voir dans Orthanc Viewer"
                                                    : "URL non disponible"
                                            }
                                        >
                                            <FaEye size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteInstance(instance.id)}
                                            className="text-red-600 hover:text-red-800 transition"
                                        >
                                            <FaTrash size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            Ajouter une Image DICOM
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Patient:{" "}
                            <span className="font-medium">
                                {patient?.prenom} {patient?.nom}
                            </span>
                        </p>
                        {dossier ? (
                            <p className="text-sm text-gray-600 mb-6">
                                Dossier:{" "}
                                <span className="font-medium">Dossier {dossier.numero}</span>
                            </p>
                        ) : (
                            <p className="text-sm text-red-600 mb-6">
                                Aucun dossier médical trouvé pour ce patient. Veuillez créer un
                                dossier avant d'uploader une image DICOM.
                            </p>
                        )}
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOver(true);
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                setDragOver(false);
                            }}
                            onClick={handleClickToSelect}
                            className={`w-full h-48 border-4 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-100"
                                }`}
                        >
                            <CloudUpload className="w-12 h-12 text-blue-500 mb-3" />
                            <p className="text-gray-600 text-center px-4">
                                {uploading ? (
                                    <span className="flex items-center space-x-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Upload en cours...</span>
                                    </span>
                                ) : (
                                    "Glissez-déposez vos fichiers DICOM (.dcm) ici ou cliquez pour sélectionner"
                                )}
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".dcm"
                            disabled={uploading}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {newFiles.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                    Fichiers sélectionnés :
                                </h3>
                                <ul className="max-h-32 overflow-y-auto space-y-1">
                                    {newFiles.map((file, index) => (
                                        <li
                                            key={index}
                                            className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg"
                                        >
                                            {file.name}{" "}
                                            <span className="text-gray-500">
                                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="mt-8 flex justify-end space-x-4">
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setNewFiles([]);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                disabled={uploading}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleFileSubmit}
                                disabled={uploading || !dossier}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${uploading || !dossier
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                            >
                                <FaSave />
                                <span>Enregistrer</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DicomImages;