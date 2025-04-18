import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaEye, FaTrash, FaPlus, FaSave } from "react-icons/fa";
import { CloudUpload } from 'lucide-react';
import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';

// Initialiser Cornerstone
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

function Dicom() {
    const [patients, setPatients] = useState([]);
    const [dicomInstances, setDicomInstances] = useState({});
    const [newFiles, setNewFiles] = useState({});
    const [dragOver, setDragOver] = useState({});
    const [uploading, setUploading] = useState({});
    const [previewFile, setPreviewFile] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(null);
    const [selectedDossierId, setSelectedDossierId] = useState(null);
    const [dossiers, setDossiers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const dicomViewerRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Récupérer tous les dossiers médicaux
                const dossiersResponse = await axios.get('http://localhost:5000/api/dossiers', {
                    withCredentials: true
                });
                const allDossiers = dossiersResponse.data;

                // Extraire les patients uniques à partir des dossiers
                const patientsMap = new Map();
                allDossiers.forEach(dossier => {
                    const patient = dossier.patient;
                    if (patient && patient._id) {
                        patientsMap.set(patient._id.toString(), {
                            _id: patient._id,
                            prenom: patient.name.split(' ')[0] || 'Inconnu',
                            nom: patient.name.split(' ').slice(1).join(' ') || '',
                        });
                    }
                });
                const validPatients = Array.from(patientsMap.values());
                setPatients(validPatients);

                // Regrouper les dossiers par patient
                const dossiersData = {};
                validPatients.forEach(patient => {
                    dossiersData[patient._id] = allDossiers.filter(
                        dossier => dossier.patient && dossier.patient._id.toString() === patient._id.toString()
                    );
                });
                setDossiers(dossiersData);

                // Récupérer les instances DICOM pour chaque patient
                const dicomData = {};
                for (const patient of validPatients) {
                    try {
                        const instancesResponse = await axios.get(
                            `http://localhost:5000/api/dossiers/dicom/${patient._id}`,
                            { withCredentials: true }
                        );
                        dicomData[patient._id] = instancesResponse.data || [];
                    } catch (err) {
                        console.warn(`Erreur pour le patient ${patient._id}:`, err.message);
                        dicomData[patient._id] = [];
                    }
                }
                setDicomInstances(dicomData);

                setLoading(false);
            } catch (err) {
                console.error("Erreur lors de la récupération des données :", err);
                setError(err.response?.data?.message || "Erreur lors de la récupération des données");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        // Initialiser Cornerstone pour la prévisualisation DICOM
        if (previewFile && dicomViewerRef.current) {
            cornerstone.enable(dicomViewerRef.current);
            cornerstone.loadImage(`wadouri:http://localhost:8042${previewFile}`).then(image => {
                cornerstone.displayImage(dicomViewerRef.current, image);
            }).catch(err => {
                console.error('Erreur lors du chargement de l\'image DICOM :', err);
                setError('Impossible de charger l\'image DICOM');
            });
        }
    }, [previewFile]);

    const handleFileChange = (patientId, e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const isDicom = /\.dcm$/i.test(file.name);
            const isSizeValid = file.size <= 10 * 1024 * 1024;
            return isDicom && isSizeValid;
        });
        if (validFiles.length < files.length) {
            setError("Certains fichiers ne sont pas des fichiers DICOM valides ou dépassent la limite de 10 Mo");
        }
        setNewFiles((prev) => ({ ...prev, [patientId]: validFiles }));
        e.target.value = null;
        if (fileInputRef.current) {
            fileInputRef.current.blur();
        }
    };

    const handleDrop = (patientId, e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver((prev) => ({ ...prev, [patientId]: false }));
        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter(file => {
            const isDicom = /\.dcm$/i.test(file.name);
            const isSizeValid = file.size <= 10 * 1024 * 1024;
            return isDicom && isSizeValid;
        });
        if (validFiles.length < files.length) {
            setError("Certains fichiers ne sont pas des fichiers DICOM valides ou dépassent la limite de 10 Mo");
        }
        setNewFiles((prev) => ({ ...prev, [patientId]: validFiles }));
    };

    const handleFileSubmit = async (patientId) => {
        try {
            const files = newFiles[patientId];
            if (!files || files.length === 0) {
                setError("Aucun fichier sélectionné");
                return;
            }
            if (!selectedDossierId) {
                setError("Veuillez sélectionner un dossier médical");
                return;
            }

            setUploading((prev) => ({ ...prev, [patientId]: true }));

            const formData = new FormData();
            files.forEach(file => formData.append("files", file));
            formData.append("dossierId", selectedDossierId);

            const response = await axios.post('http://localhost:5000/api/dossiers/upload-dicom', formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true
            });

            // Log full response for debugging
            console.log('Réponse backend complète:', response.data);

            // Handle failed files
            if (response.data.failedFiles?.length > 0) {
                const failedMessages = response.data.failedFiles.map(f => `${f.filename}: ${f.reason}`).join('; ');
                setError(`Certains fichiers ont échoué : ${failedMessages}`);
            }

            // Fetch metadata for each new instance to get StudyInstanceUID
            const newInstances = [];
            for (const id of response.data.instanceIds) {
                if (!id) {
                    console.warn("Instance ID is null or undefined, skipping...");
                    continue;
                }
                try {
                    const instanceResponse = await axios.get(`http://localhost:5000/api/dossiers/dicom/instance/${id}`, {
                        withCredentials: true
                    });
                    const instanceData = instanceResponse.data;
                    newInstances.push({
                        id,
                        mainDicomTags: instanceData.mainDicomTags || { StudyDescription: 'Nouvelle image DICOM' },
                        previewUrl: `/instances/${id}/preview`,
                        stoneViewerUrl: instanceData.stoneViewerUrl || null
                    });
                } catch (err) {
                    console.warn(`Erreur lors de la récupération des métadonnées pour l'instance ${id}:`, err.message);
                    newInstances.push({
                        id,
                        mainDicomTags: { StudyDescription: 'Nouvelle image DICOM' },
                        previewUrl: `/instances/${id}/preview`,
                        stoneViewerUrl: null
                    });
                }
            }

            if (newInstances.length === 0) {
                setError(response.data.failedFiles?.length > 0
                    ? `Aucun fichier DICOM n'a pu être uploadé : ${response.data.failedFiles.map(f => `${f.filename}: ${f.reason}`).join('; ')}`
                    : "Aucun fichier DICOM n'a pu être uploadé. Vérifiez les fichiers ou le serveur Orthanc.");
                setSuccess("");
                setUploading((prev) => ({ ...prev, [patientId]: false }));
                return;
            }

            setDicomInstances((prev) => ({
                ...prev,
                [patientId]: [
                    ...(prev[patientId] || []),
                    ...newInstances
                ]
            }));

            setSuccess(`Fichiers DICOM ajoutés avec succès pour ${patients.find(p => p._id === patientId)?.prenom || 'le patient'}`);
            setError("");
            setNewFiles((prev) => ({ ...prev, [patientId]: [] }));
            setShowUploadModal(null);
            setSelectedDossierId(null);
        } catch (err) {
            console.error("Erreur lors de l'upload :", err);
            const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout des fichiers";
            const failedFilesMessage = err.response?.data?.failedFiles
                ? err.response.data.failedFiles.map(f => `${f.filename}: ${f.reason}`).join('; ')
                : '';
            setError(failedFilesMessage ? `${errorMessage}: ${failedFilesMessage}` : errorMessage);
            setSuccess("");
        } finally {
            setUploading((prev) => ({ ...prev, [patientId]: false }));
        }
    };

    const handleDeleteInstance = async (patientId, dossierId, instanceId) => {
        if (window.confirm("Voulez-vous vraiment supprimer cette image DICOM ?")) {
            try {
                await axios.delete(
                    `http://localhost:5000/api/dossiers/dicom/${dossierId}/${instanceId}`,
                    { withCredentials: true }
                );
                setDicomInstances((prev) => ({
                    ...prev,
                    [patientId]: prev[patientId].filter(instance => instance.id !== instanceId)
                }));
                setSuccess("Image DICOM supprimée avec succès");
                setError("");
            } catch (err) {
                setError(err.response?.data?.message || "Erreur lors de la suppression de l'image");
                setSuccess("");
            }
        }
    };

    const openPreview = (instance) => {
        if (instance.stoneViewerUrl) {
            window.open(instance.stoneViewerUrl, '_blank');
        } else if (instance.previewUrl) {
            setPreviewFile(instance.previewUrl);
        } else {
            console.error("Aucune URL de visualisation disponible");
            setError("Impossible d'ouvrir le visualiseur : URLs manquantes");
        }
    };

    const closePreview = () => {
        setPreviewFile(null);
        if (dicomViewerRef.current) {
            cornerstone.disable(dicomViewerRef.current);
        }
    };

    const handleClickToSelect = (patientId) => {
        if (fileInputRef.current && !uploading[patientId]) {
            fileInputRef.current.click();
        }
    };

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
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des images DICOM</h1>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">{success}</div>
                )}

                <div className="bg-white rounded-xl shadow-sm p-6">
                    {patients.length === 0 ? (
                        <p className="text-gray-600">Aucun patient trouvé.</p>
                    ) : (
                        <div className="space-y-6">
                            {patients.map((patient) => (
                                <div key={patient._id} className="bg-white rounded-lg shadow-sm p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-medium text-gray-900">
                                            {patient.prenom} {patient.nom}
                                        </h2>
                                        <button
                                            onClick={() => setShowUploadModal(patient._id)}
                                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                        >
                                            <FaPlus />
                                            <span>Ajouter une image DICOM</span>
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                                            Images DICOM
                                        </h3>
                                        {dicomInstances[patient._id]?.length === 0 ? (
                                            <p className="text-gray-500 text-center">Aucune image DICOM disponible</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Description
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {dicomInstances[patient._id].map((instance) => (
                                                            <tr key={instance.id}>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                    {instance.mainDicomTags.StudyDescription || 'Image DICOM'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                    <button
                                                                        onClick={() => openPreview(instance)}
                                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                                        disabled={!instance.stoneViewerUrl && !instance.previewUrl}
                                                                        title={
                                                                            instance.stoneViewerUrl
                                                                                ? "Voir dans Stone Web Viewer"
                                                                                : instance.previewUrl
                                                                                    ? "Voir dans Cornerstone"
                                                                                    : "URL non disponible"
                                                                        }
                                                                    >
                                                                        <FaEye />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteInstance(
                                                                            patient._id,
                                                                            dossiers[patient._id]?.[0]?._id,
                                                                            instance.id
                                                                        )}
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

                {/* Modale pour uploader des images DICOM */}
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg max-w-lg w-full">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Ajouter une image DICOM pour {patients.find(p => p._id === showUploadModal)?.prenom || 'le patient'}
                            </h2>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sélectionner un dossier médical
                                </label>
                                <select
                                    value={selectedDossierId || ''}
                                    onChange={(e) => setSelectedDossierId(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">Choisir un dossier</option>
                                    {dossiers[showUploadModal]?.map(dossier => (
                                        <option key={dossier._id} value={dossier._id}>
                                            Dossier {dossier.numero}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div
                                onDrop={(e) => handleDrop(showUploadModal, e)}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOver((prev) => ({ ...prev, [showUploadModal]: true }));
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOver((prev) => ({ ...prev, [showUploadModal]: false }));
                                }}
                                onClick={() => handleClickToSelect(showUploadModal)}
                                className={`w-full h-40 border-4 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors duration-300 cursor-pointer ${dragOver[showUploadModal] ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
                            >
                                <CloudUpload className="w-10 h-10 text-blue-500 mb-2" />
                                <p className="text-gray-600 text-center">
                                    {uploading[showUploadModal] ? 'Upload en cours...' : 'Glissez-déposez vos fichiers DICOM ici ou cliquez pour sélectionner'}
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".dcm"
                                disabled={uploading[showUploadModal]}
                                className="hidden"
                                onChange={(e) => handleFileChange(showUploadModal, e)}
                            />
                            {newFiles[showUploadModal]?.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="font-medium text-gray-700">Fichiers sélectionnés :</h3>
                                    <ul className="mt-2 space-y-1">
                                        {newFiles[showUploadModal].map((file, index) => (
                                            <li key={index} className="text-sm text-gray-600">
                                                {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="mt-6 flex justify-end space-x-4">
                                <button
                                    onClick={() => {
                                        setShowUploadModal(null);
                                        setNewFiles((prev) => ({ ...prev, [showUploadModal]: [] }));
                                        setSelectedDossierId(null);
                                    }}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => handleFileSubmit(showUploadModal)}
                                    disabled={uploading[showUploadModal] || !selectedDossierId}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${uploading[showUploadModal] || !selectedDossierId
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    <FaSave />
                                    <span>Enregistrer</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modale pour visualiser les images DICOM */}
                {previewFile && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-4 rounded-lg max-w-4xl w-full">
                            <div className="flex justify-end mb-2">
                                <button
                                    onClick={closePreview}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    Fermer
                                </button>
                            </div>
                            <div
                                ref={dicomViewerRef}
                                className="w-full h-[80vh] bg-black"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dicom;