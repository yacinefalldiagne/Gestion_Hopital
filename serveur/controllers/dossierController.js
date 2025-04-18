const mongoose = require("mongoose");
const Patient = require("../models/patient");
const DossierMedical = require("../models/dossierMedical");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const FormData = require("form-data"); // Ajout de la dépendance form-data
const axios = require("axios");

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "Uploads/dossiers/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /\.(pdf|doc|docx|jpg|jpeg|png|dcm)$/i;
        const allowedMimeTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png",
            "application/dicom",
            "application/octet-stream",
        ];

        const extname = allowedExtensions.test(path.extname(file.originalname));
        const mimetype = allowedMimeTypes.includes(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error("Seuls les fichiers PDF, Word, JPG, PNG et DICOM sont autorisés"));
    },
    limits: { fileSize: 10 * 1024 * 1024 },
});

// Middleware pour gérer les erreurs de Multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    }
    if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};


// Authentication middleware
const authMiddleware = (req, res, next) => {
    const token = req.cookies.authToken; // Match cookie name from patientController
    if (!token) {
        return res.status(401).json({ message: "Non autorisé" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        if (!["medecin", "secretaire"].includes(decoded.role)) {
            return res.status(403).json({ message: "Accès interdit" });
        }
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token invalide" });
    }
};

// Generate a dossier number in the format DOS-timestamp-patientIdLast4
const generateDossierNumber = async (patientId) => {
    const patientIdString = patientId.toString();
    const numeroDossier = `DOS-${Date.now()}-${patientIdString.slice(-4)}`;
    const existingDossier = await DossierMedical.findOne({ numero: numeroDossier });
    if (existingDossier) {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return generateDossierNumber(patientId);
    }
    return numeroDossier;
};

const getDossiers = async (req, res) => {
    try {
        const dossiers = await DossierMedical.find()
            .populate({
                path: "patient",
                populate: {
                    path: "userId",
                    select: "prenom nom"
                }
            })
            .lean();

        const populatedDossiers = dossiers.map((dossier) => ({
            ...dossier,
            patient: {
                _id: dossier.patient._id,
                userId: dossier.patient.userId?._id.toString() || null,
                name: dossier.patient.userId
                    ? `${dossier.patient.userId.prenom} ${dossier.patient.userId.nom}`
                    : "Inconnu",
            },
        }));

        res.json(populatedDossiers);
    } catch (error) {
        console.error("Erreur dans getDossiers:", error.message, error.stack);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

const getDossiersByPatient = async (req, res) => {
    try {
        const { patientId } = req.query;
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: "ID du patient invalide" });
        }

        const dossiers = await DossierMedical.find({ patient: patientId })
            .populate({
                path: "patient",
                populate: {
                    path: "userId",
                    select: "prenom nom"
                }
            })
            .lean();

        const populatedDossiers = dossiers.map((dossier) => ({
            ...dossier,
            patient: {
                _id: dossier.patient._id,
                userId: dossier.patient.userId?._id.toString() || null,
                name: dossier.patient.userId
                    ? `${dossier.patient.userId.prenom} ${dossier.patient.userId.nom}`
                    : "Inconnu",
            },
        }));

        res.json(populatedDossiers);
    } catch (error) {
        console.error("Erreur dans getDossiersByPatient:", error.message, error.stack);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

const createDossier = async (req, res) => {
    try {
        const { patientId, noteMedecin, consultations, prescriptions, labResults } = req.body;
        const file = req.file;

        if (!patientId) {
            return res.status(400).json({ message: "L'ID du patient est requis" });
        }

        const patient = await Patient.findOne({ userId: patientId });
        if (!patient) {
            return res.status(404).json({ message: "Patient non trouvé" });
        }

        const numero = await generateDossierNumber(patient._id);

        let documentPath = "";
        if (file) {
            documentPath = `/uploads/dossiers/${file.filename}`;
        }

        const dossier = new DossierMedical({
            numero,
            patient: patient._id,
            noteMedecin,
            consultations: consultations ? JSON.parse(consultations) : [],
            prescriptions: prescriptions ? JSON.parse(prescriptions) : [],
            labResults: labResults ? JSON.parse(labResults) : [],
            documentsAssocies: documentPath ? [documentPath] : [],
        });

        await dossier.save();

        patient.dossierMedical.push(dossier._id);
        await patient.save();

        res.status(201).json({ message: "Dossier créé avec succès", dossierId: dossier._id, numero });
    } catch (error) {
        console.error("Erreur dans createDossier:", error.message, error.stack);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Un dossier avec ce numéro existe déjà" });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: "Données invalides", errors: error.errors });
        }
        res.status(500).json({ message: "Erreur serveur" });
    }
};

const updateDossier = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero, patientId, noteMedecin, consultations, prescriptions, labResults } = req.body;
        const file = req.file;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID de dossier invalide" });
        }

        const dossier = await DossierMedical.findById(id);
        if (!dossier) {
            return res.status(404).json({ message: "Dossier non trouvé" });
        }

        if (patientId) {
            if (!mongoose.Types.ObjectId.isValid(patientId)) {
                return res.status(400).json({ message: "L'ID du patient est invalide" });
            }
            const patient = await Patient.findById(patientId);
            if (!patient) {
                return res.status(404).json({ message: "Patient non trouvé" });
            }
            dossier.patient = patientId;
        }

        let documentPath = "";
        if (file) {
            documentPath = `/Uploads/dossiers/${file.filename}`;
            dossier.documentsAssocies.push(documentPath);
        }

        dossier.numero = numero || dossier.numero;
        dossier.noteMedecin = noteMedecin !== undefined ? noteMedecin : dossier.noteMedecin;
        dossier.consultations = consultations ? JSON.parse(consultations) : dossier.consultations;
        dossier.prescriptions = prescriptions ? JSON.parse(prescriptions) : dossier.prescriptions;
        dossier.labResults = labResults ? JSON.parse(labResults) : dossier.labResults;

        await dossier.save();
        res.json({ message: "Dossier modifié avec succès" });
    } catch (error) {
        console.error("Erreur dans updateDossier:", error.message, error.stack);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Un dossier avec ce numéro existe déjà" });
        }
        res.status(500).json({ message: "Erreur serveur" });
    }
};

const deleteDossier = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID de dossier invalide" });
        }

        const dossier = await DossierMedical.findById(id);
        if (!dossier) {
            return res.status(404).json({ message: "Dossier non trouvé" });
        }

        await dossier.deleteOne();
        res.json({ message: "Dossier supprimé avec succès" });
    } catch (error) {
        console.error("Erreur dans deleteDossier:", error.message, error.stack);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const { dossierId, documentPath } = req.params;
        if (!mongoose.Types.ObjectId.isValid(dossierId)) {
            return res.status(400).json({ message: "ID du dossier invalide" });
        }

        const dossier = await DossierMedical.findById(dossierId);
        if (!dossier) {
            return res.status(404).json({ message: "Dossier non trouvé" });
        }

        const decodedPath = decodeURIComponent(documentPath);
        dossier.documentsAssocies = dossier.documentsAssocies.filter((doc) => doc !== decodedPath);
        await dossier.save();

        const filePath = path.join(__dirname, "..", decodedPath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: "Document supprimé avec succès" });
    } catch (error) {
        console.error("Erreur dans deleteDocument:", error.message, error.stack);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

const getDicomInstance = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Instance ID is required" });
        }

        const response = await axios.get(`http://localhost:8042/instances/${id}`);
        const studyInstanceUID = response.data.MainDicomTags.StudyInstanceUID;
        res.json({
            id,
            mainDicomTags: response.data.MainDicomTags,
            previewUrl: `/instances/${id}/preview`,
            stoneViewerUrl: studyInstanceUID
                ? `http://localhost:8042/stone-webviewer/index.html?study=${studyInstanceUID}`
                : null
        });
    } catch (error) {
        console.error("Erreur dans getDicomInstance:", error.message, error.stack);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
// Récupérer les instances DICOM d'un patient
const getDicomInstances = async (req, res) => {
    try {
        const { patientId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: "ID de patient invalide" });
        }

        const dossiers = await DossierMedical.find({ patient: patientId }).select('dicomInstances');
        if (!dossiers || dossiers.length === 0) {
            return res.status(404).json({ message: "Aucun dossier trouvé pour ce patient" });
        }

        const dicomInstanceIds = dossiers.flatMap(dossier => dossier.dicomInstances).filter(id => id != null && id !== '');

        // Récupérer les métadonnées des instances depuis Orthanc
        const instances = [];
        for (const instanceId of dicomInstanceIds) {
            try {
                const response = await axios.get(`http://localhost:8042/instances/${instanceId}`);
                const studyInstanceUID = response.data.MainDicomTags.StudyInstanceUID;
                instances.push({
                    id: instanceId,
                    mainDicomTags: response.data.MainDicomTags,
                    previewUrl: `/instances/${instanceId}/preview`,
                    stoneViewerUrl: studyInstanceUID
                        ? `http://localhost:8042/stone-webviewer/index.html?study=${studyInstanceUID}`
                        : null
                });
            } catch (err) {
                console.warn(`Impossible de récupérer l'instance ${instanceId}:`, err.message);
            }
        }

        res.json(instances);
    } catch (error) {
        console.error("Erreur dans getDicomInstances:", error.message, error.stack);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Uploader un fichier DICOM vers Orthanc
const uploadDicom = async (req, res) => {
    try {
        const { dossierId } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "Aucun fichier fourni" });
        }
        if (!mongoose.Types.ObjectId.isValid(dossierId)) {
            return res.status(400).json({ message: "ID de dossier invalide" });
        }

        const dossier = await DossierMedical.findById(dossierId);
        if (!dossier) {
            return res.status(404).json({ message: "Dossier non trouvé" });
        }

        const instanceIds = [];
        const failedFiles = [];

        for (const file of files) {
            if (!/\.dcm$/i.test(file.originalname)) {
                console.warn(`Fichier ignoré (extension non-DICOM): ${file.originalname}`);
                failedFiles.push({ filename: file.originalname, reason: "Extension non-DICOM" });
                continue;
            }

            const formData = new FormData();
            const fileBuffer = fs.readFileSync(file.path);
            formData.append('file', fileBuffer, {
                filename: file.originalname,
                contentType: file.mimetype
            });

            try {
                const response = await axios.post('http://localhost:8042/instances', formData, {
                    headers: {
                        ...formData.getHeaders()
                    }
                });

                const instanceId = response.data.ID;
                if (!instanceId || typeof instanceId !== 'string' || instanceId.trim() === '') {
                    console.error(`ID d'instance invalide pour le fichier ${file.originalname}:`, response.data);
                    failedFiles.push({ filename: file.originalname, reason: `ID d'instance invalide: ${JSON.stringify(response.data)}` });
                    continue;
                }
                instanceIds.push(instanceId);
            } catch (err) {
                console.error(`Erreur lors de l'upload du fichier ${file.originalname}:`, {
                    message: err.message,
                    status: err.response?.status,
                    data: err.response?.data
                });
                failedFiles.push({
                    filename: file.originalname,
                    reason: `Erreur Orthanc: ${err.message}${err.response?.status ? ` (Status: ${err.response.status})` : ''}`
                });
                continue;
            } finally {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
        }

        if (instanceIds.length === 0) {
            return res.status(400).json({
                message: "Aucun fichier DICOM valide n'a été uploadé",
                failedFiles
            });
        }

        // Mettre à jour le dossier avec les nouveaux IDs d'instances
        dossier.dicomInstances.push(...instanceIds);
        await dossier.save();

        res.json({
            message: "Fichiers DICOM uploadés avec succès",
            instanceIds,
            failedFiles: failedFiles.length > 0 ? failedFiles : undefined
        });
    } catch (error) {
        console.error("Erreur dans uploadDicom:", error.message, error.stack);
        res.status(500).json({ message: "Erreur lors de l'upload des fichiers DICOM" });
    }
};


module.exports = {
    getDossiers: [getDossiers],
    getDossiersByPatient: [getDossiersByPatient],
    createDossier: [upload.single("document"), createDossier],
    updateDossier: [upload.single("document"), updateDossier],
    deleteDossier: [deleteDossier],
    deleteDocument: [deleteDocument],
    getDicomInstances: [getDicomInstances],
    uploadDicom: [upload.array("files", 10), uploadDicom],
    getDicomInstance: [getDicomInstance],
};