import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FaArrowLeft, FaFileUpload, FaPlus, FaPills, FaStethoscope, FaVial } from "react-icons/fa";
import axios from "axios";

function AddDossier() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get userId from URL
    const userRole = localStorage.getItem("userRole") || "secretaire"; // Mock; replace with auth logic

    const [formData, setFormData] = useState({
        noteMedecin: "",
        consultations: [],
        prescriptions: [],
        labResults: [],
        patientId: id, // Initialiser avec l'ID de l'URL directement
    });
    const [file, setFile] = useState(null);
    const [patientName, setPatientName] = useState("Chargement...");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isPatientLoading, setIsPatientLoading] = useState(true); // Track patient fetch status
    const [activeAccordion, setActiveAccordion] = useState(null);
    const [sectionForm, setSectionForm] = useState({
        consultation: { date: "", doctor: "", diagnosis: "", treatment: "", notes: "" },
        prescription: { medication: "", dosage: "", frequency: "", duration: "", prescribedDate: "" },
        labResult: { testName: "", result: "", date: "", notes: "" },
    });

    // Fetch patient details to display name and _id
    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                console.log("Fetching patient with userId:", id);
                // Vérifiez si l'endpoint existe et s'il est correct
                const response = await axios.get(`http://localhost:5000/api/patients/details?userId=${id}`, {
                    withCredentials: true,
                });
                console.log("Patient fetch response:", response.data);

                // Vérification de la structure de la réponse
                if (!response.data || (!response.data.id && !response.data._id)) {
                    throw new Error("Patient ID manquant dans la réponse");
                }

                // Utiliser l'ID approprié selon la structure de la réponse
                const patientId = response.data.id || response.data._id;
                const name = response.data.name || `${response.data.firstName || ''} ${response.data.lastName || ''}`.trim();

                setPatientName(name);
                setFormData((prev) => {
                    const newFormData = { ...prev, patientId: patientId };
                    console.log("formData.patientId after fetch:", newFormData.patientId);
                    return newFormData;
                });
                setIsPatientLoading(false);
            } catch (err) {
                console.error("Patient fetch error:", {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status,
                    stack: err.stack,
                });

                // En cas d'échec, utilisez l'ID de l'URL comme fallback
                setPatientName("Patient inconnu");
                setFormData(prev => ({ ...prev, patientId: id }));
                const errorMessage = err.response?.data?.message || err.message || "Erreur lors de la récupération des détails du patient";
                setError(errorMessage);
                setIsPatientLoading(false);
            }
        };

        if (id) {
            fetchPatientDetails();
        } else {
            setError("ID du patient manquant dans l'URL");
            setIsPatientLoading(false);
        }
    }, [id]);

    // Handle form input changes for section forms
    const handleSectionInputChange = (e, section) => {
        const { name, value } = e.target;
        setSectionForm((prev) => ({
            ...prev,
            [section]: { ...prev[section], [name]: value },
        }));
    };

    // Handle file input change
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    // Validate section form (only when adding a section)
    const validateSectionForm = (section) => {
        const data = sectionForm[section];
        if (section === "consultation") {
            return data.date && data.doctor && data.diagnosis;
        } else if (section === "prescription") {
            return data.medication && data.dosage && data.frequency && data.prescribedDate;
        } else if (section === "labResult") {
            return data.testName && data.result && data.date;
        }
        return false;
    };

    // Add section data to formData
    const addSectionData = (section) => {
        if (!validateSectionForm(section)) {
            setError(`Veuillez remplir tous les champs requis pour ${section === "consultation" ? "la consultation" : section === "prescription" ? "la prescription" : "le résultat de laboratoire"}`);
            return;
        }
        setFormData((prev) => ({
            ...prev,
            [section + "s"]: [...prev[section + "s"], sectionForm[section]],
        }));
        // Reset section form and close accordion
        setSectionForm((prev) => ({
            ...prev,
            [section]: section === "consultation"
                ? { date: "", doctor: "", diagnosis: "", treatment: "", notes: "" }
                : section === "prescription"
                    ? { medication: "", dosage: "", frequency: "", duration: "", prescribedDate: "" }
                    : { testName: "", result: "", date: "", notes: "" },
        }));
        setActiveAccordion(null);
        setError("");
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Vérifier si les données nécessaires sont présentes
            if (!formData.patientId) {
                throw new Error("ID du patient manquant");
            }
            if (!formData.noteMedecin.trim()) {
                throw new Error("La note du médecin est requise");
            }

            console.log("Submitting with patientId:", formData.patientId);

            // Préparation des données
            const data = new FormData();
            data.append("patientId", formData.patientId);
            data.append("noteMedecin", formData.noteMedecin);
            data.append("consultations", JSON.stringify(formData.consultations));
            data.append("prescriptions", JSON.stringify(formData.prescriptions));
            data.append("labResults", JSON.stringify(formData.labResults));

            if (file) {
                data.append("document", file);
            }


            const response = await axios.post("http://localhost:5000/api/dossiers", data, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });

            setSuccess(`Dossier créé avec succès (Numéro: ${response.data.numero || 'N/A'})`);
            setFormData({ noteMedecin: "", consultations: [], prescriptions: [], labResults: [], patientId: "" });
            setFile(null);

            // Redirection après succès
            setTimeout(() => navigate(`/${userRole}/patient/${id}`), 2000);
        } catch (err) {
            console.error("Submission error:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                stack: err.stack,
            });

            // Message d'erreur plus informatif
            let errorMessage = "Erreur lors de la création du dossier : ";

            if (err.response) {
                if (err.response.status === 404) {
                    errorMessage += "L'API n'est pas disponible (404 Not Found). Vérifiez que le serveur est en cours d'exécution et que l'URL est correcte.";
                } else {
                    errorMessage += err.response.data?.message || `Erreur ${err.response.status}`;
                }
            } else if (err.request) {
                errorMessage += "Aucune réponse reçue du serveur. Vérifiez votre connexion internet.";
            } else {
                errorMessage += err.message || "Erreur inconnue";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Toggle accordion
    const toggleAccordion = (section) => {
        setActiveAccordion(activeAccordion === section ? null : section);
        setError("");
        setSuccess("");
    };

    // Handle "Nouvelle Consultation" button (doctor only)
    const handleNewConsultation = () => {
        toggleAccordion("consultation");
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex space-x-2 text-sm text-gray-500">
                        <li><Link to={`/${userRole}`} className="hover:text-blue-600">Tableau de bord</Link></li>
                        <li>/</li>
                        <li><Link to={`/${userRole}/patients`} className="hover:text-blue-600">Patients</Link></li>
                        <li>/</li>
                        <li><Link to={`/${userRole}/patient/${id}`} className="hover:text-blue-600">{patientName}</Link></li>
                        <li>/</li>
                        <li className="text-gray-900">Ajouter Dossier</li>
                    </ol>
                </nav>

                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate(`/${userRole}/patient/${id}`)}
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <FaArrowLeft className="text-2xl" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Ajouter un dossier pour {patientName}</h1>
                    </div>
                    {userRole === "medecin" && (
                        <button
                            onClick={handleNewConsultation}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <FaPlus />
                            <span>Nouvelle Consultation</span>
                        </button>
                    )}
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">{success}</div>
                    )}
                    {isPatientLoading && (
                        <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 rounded-lg">Chargement des détails du patient...</div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient Name (Display Only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Patient *</label>
                            <p className="mt-1 text-gray-900 font-medium">{patientName}</p>
                        </div>

                        {/* Medical Notes */}
                        <div>
                            <label htmlFor="noteMedecin" className="block text-sm font-medium text-gray-700">Notes du médecin *</label>
                            <textarea
                                id="noteMedecin"
                                name="noteMedecin"
                                value={formData.noteMedecin}
                                onChange={(e) => setFormData((prev) => ({ ...prev, noteMedecin: e.target.value }))}
                                rows={4}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Entrez les notes du médecin"
                            />
                        </div>

                        {/* Section Buttons with Optional Hint */}
                        <div>
                            <p className="text-sm text-gray-500 mb-2">
                                Ajoutez des consultations, prescriptions ou résultats de laboratoire si nécessaire (facultatif, modifiable ultérieurement).
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    type="button"
                                    onClick={() => toggleAccordion("prescription")}
                                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <FaPills />
                                    <span>Ajouter Prescription</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleAccordion("consultation")}
                                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <FaStethoscope />
                                    <span>Nouvelle Consultation</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleAccordion("labResult")}
                                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <FaVial />
                                    <span>Ajouter Résultat de Labo</span>
                                </button>
                            </div>
                        </div>

                        {/* Accordions */}
                        <div className="space-y-4">
                            {/* Prescription Accordion */}
                            {activeAccordion === "prescription" && (
                                <div className="border-t pt-4 animate-fade-in">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle Prescription</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="medication" className="block text-sm font-medium text-gray-700">Médicament *</label>
                                            <input
                                                type="text"
                                                id="medication"
                                                name="medication"
                                                value={sectionForm.prescription.medication}
                                                onChange={(e) => handleSectionInputChange(e, "prescription")}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Nom du médicament"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">Dosage *</label>
                                            <input
                                                type="text"
                                                id="dosage"
                                                name="dosage"
                                                value={sectionForm.prescription.dosage}
                                                onChange={(e) => handleSectionInputChange(e, "prescription")}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Ex: 500 mg"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Fréquence *</label>
                                            <input
                                                type="text"
                                                id="frequency"
                                                name="frequency"
                                                value={sectionForm.prescription.frequency}
                                                onChange={(e) => handleSectionInputChange(e, "prescription")}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Ex: 2 fois par jour"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Durée</label>
                                            <input
                                                type="text"
                                                id="duration"
                                                name="duration"
                                                value={sectionForm.prescription.duration}
                                                onChange={(e) => handleSectionInputChange(e, "prescription")}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Ex: 7 jours"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="prescribedDate" className="block text-sm font-medium text-gray-700">Date de prescription *</label>
                                            <input
                                                type="date"
                                                id="prescribedDate"
                                                name="prescribedDate"
                                                value={sectionForm.prescription.prescribedDate}
                                                onChange={(e) => handleSectionInputChange(e, "prescription")}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-4">
                                            <button
                                                type="button"
                                                onClick={() => toggleAccordion(null)}
                                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addSectionData("prescription")}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Ajouter Prescription
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Consultation Accordion */}
                            {activeAccordion === "consultation" && (
                                <div className="border-t pt-4 animate-fade-in">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle Consultation</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date *</label>
                                            <input
                                                type="date"
                                                id="date"
                                                name="date"
                                                value={sectionForm.consultation.date}
                                                onChange={(e) => handleSectionInputChange(e, "consultation")}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">Médecin *</label>
                                            <input
                                                type="text"
                                                id="doctor"
                                                name="doctor"
                                                value={sectionForm.consultation.doctor}
                                                onChange={(e) => handleSectionInputChange(e, "consultation")}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Nom du médecin"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">Diagnostic *</label>
                                            <textarea
                                                id="diagnosis"
                                                name="diagnosis"
                                                value={sectionForm.consultation.diagnosis}
                                                onChange={(e) => handleSectionInputChange(e, "consultation")}
                                                rows={3}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Entrez le diagnostic"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="treatment" className="block text-sm font-medium text-gray-700">Traitement</label>
                                            <textarea
                                                id="treatment"
                                                name="treatment"
                                                value={sectionForm.consultation.treatment}
                                                onChange={(e) => handleSectionInputChange(e, "consultation")}
                                                rows={3}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Entrez le traitement"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                                            <textarea
                                                id="notes"
                                                name="notes"
                                                value={sectionForm.consultation.notes}
                                                onChange={(e) => handleSectionInputChange(e, "consultation")}
                                                rows={3}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Notes supplémentaires"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-4">
                                            <button
                                                type="button"
                                                onClick={() => toggleAccordion(null)}
                                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addSectionData("consultation")}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Ajouter Consultation
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Lab Result Accordion */}
                            {activeAccordion === "labResult" && (
                                <div className="border-t pt-4 animate-fade-in">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouveau Résultat de Laboratoire</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="testName" className="block text-sm font-medium text-gray-700">Nom du test *</label>
                                            <input
                                                type="text"
                                                id="testName"
                                                name="testName"
                                                value={sectionForm.labResult.testName}
                                                onChange={(e) => handleSectionInputChange(e, "labResult")}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Ex: Analyse de sang"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="result" className="block text-sm font-medium text-gray-700">Résultat *</label>
                                            <textarea
                                                id="result"
                                                name="result"
                                                value={sectionForm.labResult.result}
                                                onChange={(e) => handleSectionInputChange(e, "labResult")}
                                                rows={3}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Entrez le résultat"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date *</label>
                                            <input
                                                type="date"
                                                id="date"
                                                name="date"
                                                value={sectionForm.labResult.date}
                                                onChange={(e) => handleSectionInputChange(e, "labResult")}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                                            <textarea
                                                id="notes"
                                                name="notes"
                                                value={sectionForm.labResult.notes}
                                                onChange={(e) => handleSectionInputChange(e, "labResult")}
                                                rows={3}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Notes supplémentaires"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-4">
                                            <button
                                                type="button"
                                                onClick={() => toggleAccordion(null)}
                                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addSectionData("labResult")}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Ajouter Résultat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Added Sections Summary */}
                        {(formData.consultations.length > 0 || formData.prescriptions.length > 0 || formData.labResults.length > 0) && (
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sections Ajoutées</h3>
                                <div className="space-y-4">
                                    {formData.consultations.map((consult, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                            <p><strong>Consultation {index + 1}</strong>: {consult.diagnosis} ({new Date(consult.date).toLocaleDateString()})</p>
                                            <p className="text-sm text-gray-600">Médecin: {consult.doctor}</p>
                                        </div>
                                    ))}
                                    {formData.prescriptions.map((presc, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                            <p><strong>Prescription {index + 1}</strong>: {presc.medication} ({presc.dosage})</p>
                                            <p className="text-sm text-gray-600">Fréquence: {presc.frequency}, Date: {new Date(presc.prescribedDate).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                    {formData.labResults.map((result, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                            <p><strong>Résultat {index + 1}</strong>: {result.testName} ({result.result})</p>
                                            <p className="text-sm text-gray-600">Date: {new Date(result.date).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* File Upload */}
                        <div>
                            <label htmlFor="document" className="block text-sm font-medium text-gray-700">Document associé (facultatif)</label>
                            <div className="mt-1 flex items-center space-x-4">
                                <input
                                    type="file"
                                    id="document"
                                    name="document"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    className="hidden"
                                />
                                <label
                                    htmlFor="document"
                                    className="cursor-pointer bg-gray-100 px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-gray-200 transition-colors"
                                >
                                    <FaFileUpload className="text-gray-600" /><FaFileUpload className="text-gray-600" />
                                    <span>{file ? file.name : "Choisir un fichier"}</span>
                                </label>
                                {file && (
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="text-sm text-red-600 hover:text-red-800"
                                    >
                                        Supprimer
                                    </button>
                                )}
                            </div>
                            <p className="mt-2 text-sm text-gray-500">Formats acceptés : PDF, Word, JPG, PNG (modifiable ultérieurement)</p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className={`px-6 py-2 rounded-md text-white font-medium ${loading || isPatientLoading || !formData.patientId || !formData.noteMedecin.trim()
                                    ? "bg-blue-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                    } transition-colors`}
                                disabled={loading || isPatientLoading || !formData.patientId || !formData.noteMedecin.trim()}
                            >
                                {loading ? "Création..." : isPatientLoading ? "Chargement..." : "Créer le dossier"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddDossier;