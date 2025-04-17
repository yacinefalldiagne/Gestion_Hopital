const mongoose = require("mongoose");
const Patient = require("../models/patient");
const DossierMedical = require("../models/dossierMedical");
const Minio = require("minio");
const multer = require("multer");

// Configure MinIO client
const minioClient = new Minio.Client({
    endPoint: "localhost",
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || "admin",
    secretKey: process.env.MINIO_SECRET_KEY || "passer123",
});

// Configure Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

const getDossiers = async (req, res) => {
    try {
        const dossiers = await DossierMedical.find()
            .populate("patient", "userId")
            .lean();

        // Fetch patient names by mapping userId
        const populatedDossiers = await Promise.all(
            dossiers.map(async (dossier) => {
                const patient = await Patient.findOne({ userId: dossier.patient.userId })
                    .populate("userId", "prenom nom")
                    .lean();
                return {
                    ...dossier,
                    patient: {
                        _id: patient._id,
                        name: patient.userId ? `${patient.userId.prenom} ${patient.userId.nom}` : "Inconnu",
                    },
                };
            })
        );

        res.json(populatedDossiers);
    } catch (error) {
        console.error("Erreur dans getDossiers:", error.message, error.stack);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

const createDossier = async (req, res) => {
    try {
        const { numero, patientId, noteMedecin } = req.body;
        const file = req.file;

        if (!numero || !patientId) {
            return res.status(400).json({ message: "Numéro et patient sont requis" });
        }

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: "Patient non trouvé" });
        }

        let documentUrl = "";
        if (file) {
            const bucketName = "medtrack-documents";
            const objectName = `dossiers/${Date.now()}_${file.originalname}`;

            // Ensure bucket exists
            const bucketExists = await minioClient.bucketExists(bucketName);
            if (!bucketExists) {
                await minioClient.makeBucket(bucketName);
            }

            // Upload file to MinIO
            await minioClient.putObject(bucketName, objectName, file.buffer, file.size, {
                "Content-Type": file.mimetype,
            });

            // Generate presigned URL (valid for 7 days)
            documentUrl = await minioClient.presignedUrl("GET", bucketName, objectName, 7 * 24 * 60 * 60);
        }

        const dossier = new DossierMedical({
            numero,
            patient: patientId,
            noteMedecin: noteMedecin || "",
            documentsAssocies: documentUrl ? [documentUrl] : [],
        });

        await dossier.save();
        res.status(201).json({ message: "Dossier créé avec succès", dossierId: dossier._id });
    } catch (error) {
        console.error("Erreur dans createDossier:", error.message, error.stack);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Un dossier avec ce numéro existe déjà" });
        }
        res.status(500).json({ message: "Erreur serveur" });
    }
};

const updateDossier = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero, patientId, noteMedecin } = req.body;
        const file = req.file;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID de dossier invalide" });
        }

        const dossier = await DossierMedical.findById(id);
        if (!dossier) {
            return res.status(404).json({ message: "Dossier non trouvé" });
        }

        if (patientId) {
            const patient = await Patient.findById(patientId);
            if (!patient) {
                return res.status(404).json({ message: "Patient non trouvé" });
            }
            dossier.patient = patientId;
        }

        let documentUrl = "";
        if (file) {
            const bucketName = "medtrack-documents";
            const objectName = `dossiers/${Date.now()}_${file.originalname}`;

            // Ensure bucket exists
            const bucketExists = await minioClient.bucketExists(bucketName);
            if (!bucketExists) {
                await minioClient.makeBucket(bucketName);
            }

            // Upload file to MinIO
            await minioClient.putObject(bucketName, objectName, file.buffer, file.size, {
                "Content-Type": file.mimetype,
            });

            // Generate presigned URL
            documentUrl = await minioClient.presignedUrl("GET", bucketName, objectName, 7 * 24 * 60 * 60);
            dossier.documentsAssocies.push(documentUrl);
        }

        dossier.numero = numero || dossier.numero;
        dossier.noteMedecin = noteMedecin !== undefined ? noteMedecin : dossier.noteMedecin;

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

module.exports = {
    getDossiers,
    createDossier: [upload.single("document"), createDossier],
    updateDossier: [upload.single("document"), updateDossier],
    deleteDossier,
};