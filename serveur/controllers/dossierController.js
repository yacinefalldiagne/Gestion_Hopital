const Dossier = require('../models/dossier');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const Minio = require('minio');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Configuration de Multer pour gérer les fichiers en mémoire avec filtre
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Type de fichier non autorisé. Seuls PDF, JPEG et PNG sont acceptés.'));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5 Mo (ajustable)
});

// Configuration du client MinIO
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'your-access-key',
    secretKey: process.env.MINIO_SECRET_KEY || 'your-secret-key'
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'dossiers-patients';

// Vérifier ou créer le bucket au démarrage
const initializeBucket = async () => {
    try {
        const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
        if (!bucketExists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            console.log(`Bucket ${BUCKET_NAME} créé avec succès`);
        }
    } catch (err) {
        console.error("Erreur lors de l'initialisation du bucket MinIO:", err);
    }
};
initializeBucket();

// Test de l'API
const test = (req, res) => {
    res.json("Hello from patient dossier controller");
};

// Middleware pour appliquer Multer à des routes spécifiques
const uploadMiddleware = upload.single('file');

// Créer un nouveau dossier patient avec upload de fichier
const createDossier = [
    uploadMiddleware,
    async (req, res) => {
        try {
            const { token } = req.cookies;
            const { dateCreation, noteMedecin, patientId } = req.body;
            const file = req.file;

            if (!token) {
                return res.status(401).json({ error: 'Veuillez vous connecter pour créer un dossier' });
            }

            if (!dateCreation || !noteMedecin || !patientId) {
                return res.status(400).json({ error: "Les champs dateCreation, noteMedecin et patient sont requis" });
            }

            const patient = await User.findById(patientId);
            if (!patient || patient.role !== 'patient') {
                return res.status(400).json({ error: "Patient non trouvé ou rôle invalide" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role !== 'secretaire' && decoded.role !== 'medecin') {
                return res.status(403).json({ error: "Accès réservé au secrétaire ou médecin" });
            }

            const numeroDossier = `DOS-${Date.now()}-${patientId.slice(-4)}`;

            let fileReference = null;
            if (file) {
                const fileName = `${uuidv4()}-${file.originalname}`;
                await minioClient.putObject(
                    BUCKET_NAME,
                    fileName,
                    file.buffer,
                    file.size,
                    { 'Content-Type': file.mimetype }
                );
                fileReference = fileName;
            }

            const newDossier = new Dossier({
                numeroDossier,
                dateCreation: new Date(dateCreation),
                noteMedecin: new Date(noteMedecin),
                patient: patientId,
                fileReference
            });

            await newDossier.save();
            res.status(201).json({ message: "Dossier patient créé avec succès", dossier: newDossier });

        } catch (err) {
            console.error("Error in createDossier:", err);
            res.status(500).json({ error: "Erreur serveur. Veuillez réessayer." });
        }
    }
];

// Récupérer tous les dossiers (pour secrétaire ou médecin)
const getAllDossiers = async (req, res) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({ error: 'Veuillez vous connecter' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'secretaire' && decoded.role !== 'medecin') {
            return res.status(403).json({ error: 'Accès réservé au secrétaire ou médecin' });
        }

        const dossiers = await Dossier.find()
            .populate('patient', 'firstname lastname email')
            .sort({ dateCreation: -1 });

        res.status(200).json({ dossiers });

    } catch (err) {
        console.error("Error in getAllDossiers:", err);
        res.status(500).json({ error: "Erreur serveur. Veuillez réessayer." });
    }
};

// Récupérer un dossier spécifique par ID avec URL de téléchargement
const getDossierById = async (req, res) => {
    try {
        const { token } = req.cookies;
        const { dossierId } = req.params;

        if (!token) {
            return res.status(401).json({ error: 'Veuillez vous connecter' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'secretaire' && decoded.role !== 'medecin') {
            return res.status(403).json({ error: 'Accès réservé au secrétaire ou médecin' });
        }

        const dossier = await Dossier.findById(dossierId)
            .populate('patient', 'firstname lastname email');

        if (!dossier) {
            return res.status(404).json({ error: 'Dossier non trouvé' });
        }

        let fileUrl = null;
        if (dossier.fileReference) {
            fileUrl = await minioClient.presignedGetObject(BUCKET_NAME, dossier.fileReference, 24 * 60 * 60);
        }

        res.status(200).json({ dossier, fileUrl });

    } catch (err) {
        console.error("Error in getDossierById:", err);
        res.status(500).json({ error: "Erreur serveur. Veuillez réessayer." });
    }
};

// Mettre à jour un dossier patient avec possibilité de changer le fichier
const updateDossier = [
    uploadMiddleware,
    async (req, res) => {
        try {
            const { token } = req.cookies;
            const { dossierId } = req.params;
            const { noteMedecin } = req.body;
            const file = req.file;

            if (!token) {
                return res.status(401).json({ error: 'Veuillez vous connecter' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role !== 'medecin') {
                return res.status(403).json({ error: 'Accès réservé au médecin' });
            }

            const dossier = await Dossier.findById(dossierId);
            if (!dossier) {
                return res.status(404).json({ error: 'Dossier non trouvé' });
            }

            let fileReference = dossier.fileReference;
            if (file) {
                const fileName = `${uuidv4()}-${file.originalname}`;
                await minioClient.putObject(
                    BUCKET_NAME,
                    fileName,
                    file.buffer,
                    file.size,
                    { 'Content-Type': file.mimetype }
                );
                fileReference = fileName;

                if (dossier.fileReference) {
                    await minioClient.removeObject(BUCKET_NAME, dossier.fileReference);
                }
            }

            const updatedDossier = await Dossier.findByIdAndUpdate(
                dossierId,
                {
                    noteMedecin: noteMedecin ? new Date(noteMedecin) : dossier.noteMedecin,
                    fileReference
                },
                { new: true }
            ).populate('patient', 'firstname lastname email');

            res.status(200).json({ message: "Dossier mis à jour avec succès", dossier: updatedDossier });

        } catch (err) {
            console.error("Error in updateDossier:", err);
            res.status(500).json({ error: "Erreur serveur. Veuillez réessayer." });
        }
    }
];

module.exports = {
    test,
    createDossier,
    getAllDossiers,
    getDossierById,
    updateDossier
};