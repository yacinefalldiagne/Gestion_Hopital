import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaEye, FaTrash, FaPlus, FaSave, FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";
import { CloudUpload, Loader2 } from 'lucide-react';
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
    const [expandedPatients, setExpandedPatients] = useState({});
    const dicomViewerRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const dossiersResponse = await axios.get('http://localhost:5000/api/dossiers', {
                    withCredentials: true
                });
                const allDossiers = dossiersResponse.data;

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

                const dossiersData = {};
                validPatients.forEach(patient => {
                    dossiersData[patient._id] = allDossiers.filter(
                        dossier => dossier.patient && dossier.patient._id.toString() === patient._id.toString()
                    );
                });
                setDossiers(dossiersData);

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

    useEffect(() => {
        if (showUploadModal && dossiers[showUploadModal]?.length > 0) {
            setSelectedDossierId(dossiers[showUploadModal][0]._id);
        } else {
            setSelectedDossierId(null);
        }
    }, [showUploadModal, dossiers]);

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
                setError("Aucun dossier médical disponible pour ce patient");
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

            const newInstances = [];
            for (const instance of response.data.instances) {
                try {
                    const instanceResponse = await axios.get(`http://localhost:5000/api/dossiers/dicom/instance/${instance.instanceId}`, {
                        withCredentials: true
                    });
                    const instanceData = instanceResponse.data;
                    newInstances.push({
                        id: instance.instanceId,
                        mainDicomTags: instanceData.mainDicomTags || { StudyDescription: 'Nouvelle image DICOM' },
                        previewUrl: `/instances/${instance.instanceId}/preview`,
                        stoneViewerUrl: instanceData.stoneViewerUrl || null
                    });
                } catch (err) {
                    console.warn(`Erreur lors de la récupération des métadonnées pour l'instance ${instance.instanceId}:`, err.message);
                    newInstances.push({
                        id: instance.instanceId,
                        mainDicomTags: { StudyDescription: 'Nouvelle image DICOM' },
                        previewUrl: `/instances/${instance.instanceId}/preview`,
                        stoneViewerUrl: null
                    });
                }
            }

            if (newInstances.length === 0) {
                setError("Aucun fichier DICOM valide n'a été uploadé. Vérifiez les fichiers ou le serveur Orthanc.");
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
            const errorMessage = err.response?.data?.message || "Erreur lors de l'upload des fichiers DICOM. Vérifiez les fichiers ou le serveur Orthanc.";
            setError(errorMessage);
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

    const togglePatientExpand = (patientId) => {
        setExpandedPatients((prev) => ({
            ...prev,
            [patientId]: !prev[patientId]
        }));
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

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Gestion des Images DICOM</h1>
                    <p className="mt-2 text-gray-600">Visualisez et gérez les images DICOM de vos patients en toute simplicité.</p>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2">
                        <FaTimes className="text-red-700" />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center space-x-2">
                        <span>✔</span>
                        <span>{success}</span>
                    </div>
                )}

                {/* Patient List */}
                {patients.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                        <p className="text-gray-600">Aucun patient trouvé.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {patients.map((patient) => (
                            <div key={patient._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                {/* Patient Header */}
                                <div
                                    className="flex justify-between items-center p-6 cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                                    onClick={() => togglePatientExpand(patient._id)}
                                >
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {patient.prenom} {patient.nom}
                                    </h2>
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowUploadModal(patient._id);
                                            }}
                                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                        >
                                            <FaPlus />
                                            <span>Ajouter une Image</span>
                                        </button>
                                        {expandedPatients[patient._id] ? (
                                            <FaChevronUp className="text-gray-600" />
                                        ) : (
                                            <FaChevronDown className="text-gray-600" />
                                        )}
                                    </div>
                                </div>
                                {/* Patient DICOM Images */}
                                {expandedPatients[patient._id] && (
                                    <div className="p-6">
                                        {dicomInstances[patient._id]?.length === 0 ? (
                                            <p className="text-gray-500 text-center">Aucune image DICOM disponible</p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {dicomInstances[patient._id].map((instance) => (
                                                    <div
                                                        key={instance.id}
                                                        className="bg-gray-50 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition"
                                                    >
                                                        <span className="text-gray-900 font-medium">
                                                            {instance.mainDicomTags.StudyDescription || 'Image DICOM'}
                                                        </span>
                                                        <div className="flex space-x-3">
                                                            <button
                                                                onClick={() => openPreview(instance)}
                                                                className="text-blue-600 hover:text-blue-800 transition"
                                                                disabled={!instance.stoneViewerUrl && !instance.previewUrl}
                                                                title={
                                                                    instance.stoneViewerUrl
                                                                        ? "Voir dans Stone Web Viewer"
                                                                        : instance.previewUrl
                                                                            ? "Voir dans Cornerstone"
                                                                            : "URL non disponible"
                                                                }
                                                            >
                                                                <FaEye size={20} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteInstance(
                                                                    patient._id,
                                                                    dossiers[patient._id]?.[0]?._id,
                                                                    instance.id
                                                                )}
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
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                Ajouter une Image DICOM
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Patient : <span className="font-medium">{patients.find(p => p._id === showUploadModal)?.prenom || 'le patient'} {patients.find(p => p._id === showUploadModal)?.nom}</span>
                            </p>
                            {dossiers[showUploadModal]?.length > 0 ? (
                                <p className="text-sm text-gray-600 mb-6">
                                    Dossier : <span className="font-medium">Dossier {dossiers[showUploadModal][0].numero}</span>
                                </p>
                            ) : (
                                <p className="text-sm text-red-600 mb-6">
                                    Aucun dossier médical trouvé pour ce patient. Veuillez créer un dossier avant d'uploader une image DICOM.
                                </p>
                            )}
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
                                className={`w-full h-48 border-4 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${dragOver[showUploadModal] ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-100'
                                    }`}
                            >
                                <CloudUpload className="w-12 h-12 text-blue-500 mb-3" />
                                <p className="text-gray-600 text-center px-4">
                                    {uploading[showUploadModal] ? (
                                        <span className="flex items-center space-x-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Upload en cours...</span>
                                        </span>
                                    ) : (
                                        'Glissez-déposez vos fichiers DICOM ici ou cliquez pour sélectionner'
                                    )}
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
                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Fichiers sélectionnés :</h3>
                                    <ul className="max-h-32 overflow-y-auto space-y-1">
                                        {newFiles[showUploadModal].map((file, index) => (
                                            <li key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                                {file.name} <span className="text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="mt-8 flex justify-end space-x-4">
                                <button
                                    onClick={() => {
                                        setShowUploadModal(null);
                                        setNewFiles((prev) => ({ ...prev, [showUploadModal]: [] }));
                                        setSelectedDossierId(null);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => handleFileSubmit(showUploadModal)}
                                    disabled={uploading[showUploadModal] || !dossiers[showUploadModal]?.length}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${uploading[showUploadModal] || !dossiers[showUploadModal]?.length
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

                {/* Preview Modal */}
                {previewFile && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl">
                            <div className="flex justify-between items-center p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Visualisation de l'Image DICOM</h2>
                                <button
                                    onClick={closePreview}
                                    className="text-gray-600 hover:text-gray-800 transition"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                            <div
                                ref={dicomViewerRef}
                                className="flex-1 bg-black"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dicom;