const Patient = require('../models/patient');
const DossierMedical = require('../models/dossierMedical');
const Rendezvous = require('../models/rendezVous');
const jwt = require('jsonwebtoken');
const User = require('../models/user');


const verifyToken = (req) => {
    const token = req.cookies.authToken;
    if (!token) {
        throw new Error('Token non fourni');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.user.id;
    } catch (error) {
        throw new Error('Token invalide');
    }
};

const getPatients = async (req, res) => {
    try {
        const { authToken } = req.cookies;
        if (!authToken) {
            return res.status(401).json({ message: 'Token non fourni' });
        }

        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
        const userId = decoded.user.id;
        const user = await User.findById(userId);

        // Vérification si l'utilisateur existe
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Vérification du rôle de l'utilisateur
        if (user.role !== 'secretaire' && user.role !== 'medecin') {
            return res.status(403).json({ message: 'Accès interdit. Rôle insuffisant.' });
        }

        const patients = await Patient.find()
            .populate('userId', 'prenom nom email')
            .populate({
                path: 'rendezvous',
                select: 'dateRendezVous titre',
            });

        const patientList = patients.map(patient => {
            const latestRendezvous = patient.rendezvous.sort((a, b) =>
                new Date(b.dateRendezVous) - new Date(a.dateRendezVous)
            )[0];
            return {
                id: patient.userId._id.toString(),
                name: `${patient.userId.prenom} ${patient.userId.nom}`,
                age: calculateAge(patient.dateNaissance),
                lastAppointment: latestRendezvous
                    ? new Date(latestRendezvous.dateRendezVous).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Aucun rendez-vous',
                phone: patient.numeroTelephone,
                email: patient.userId.email,
            };
        });

        res.json(patientList);
    } catch (error) {
        console.error('Erreur dans getPatients:', error.message);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const calculateAge = (birthDate) => {
    if (!birthDate) {
        console.error('calculateAge: birthDate is null or undefined');
        return null; // Return null to indicate missing data
    }

    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) {
        console.error(`calculateAge: Invalid birthDate format: ${birthDate}`);
        return null; // Return null for invalid dates
    }

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    if (age < 0) {
        console.warn(`calculateAge: Future birthDate detected: ${birthDate}, age: ${age}`);
        return 0; // Return 0 for future dates
    }

    return age;
};

const getPatientDetails = async (req, res) => {
    try {
        const userId = req.query.userId || req.user.user.id;
        const isAccept = req.user.user.role === 'secretaire' || req.user.user.role === 'medecin';

        if (!isAccept && req.query.userId) {
            return res.status(403).json({ message: 'Accès interdit. Seuls les secrétaires/medecins peuvent voir les détails d\'autres patients.' });
        }

        // Trouver le patient avec l'userId
        const patient = await Patient.findOne({ userId })
            .populate('userId', 'prenom nom email')
            .populate({
                path: 'dossierMedical',
                select: 'numero noteMedecin consultations prescriptions labResults documentsAssocies',
            })
            .populate({
                path: 'rendezvous',
                select: 'dateRendezVous titre color',
            });

        if (!patient) {
            return res.status(404).json({ message: 'Aucun patient trouvé pour cet utilisateur' });
        }

        // Construire les données du patient
        const patientData = {
            id: patient.userId._id.toString(),
            prenom: patient.userId.prenom,
            nom: patient.userId.nom,
            email: patient.userId.email,
            dateNaissance: patient.dateNaissance,
            phone: patient.numeroTelephone,
            groupeSanguin: patient.groupeSanguin || null,
            allergies: patient.allergies || [],
            antecedent: patient.antecedent || '',
            dossiers: patient.dossierMedical.map(dossier => ({
                _id: dossier._id,
                numero: dossier.numero,
                noteMedecin: dossier.noteMedecin || '',
                consultations: dossier.consultations || [],
                prescriptions: dossier.prescriptions || [],
                labResults: dossier.labResults || [],
                documentsAssocies: dossier.documentsAssocies || [],
            })),
            appointments: patient.rendezvous.map(r => ({
                date: r.dateRendezVous.toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' }),
                title: r.titre,
                doctor: 'Dr. TBD',
                color: r.color,
            })),
            assurance: {
                number: patient.assurance.numero,
                expiry: patient.assurance.expiry.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
                status: patient.assurance.status,
            },
            medicalImages: patient.medicalImages.map(img => ({
                name: img.name,
                type: img.type,
                size: img.size,
                url: img.url,
                uploadDate: img.uploadDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            })),
            documents: patient.documents.map(doc => ({
                name: doc.name,
                type: doc.type,
                size: doc.size,
                url: doc.url,
                uploadDate: doc.uploadDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            })),
        };

        res.json(patientData);
    } catch (error) {
        console.error('Erreur dans getPatientDetails:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
const createPatient = async (req, res) => {
    try {
        console.log('Received patient data:', req.body);
        console.log('Authenticated user:', req.user);

        if (req.user.user.role !== 'secretaire') {
            console.log('Access denied: User role is not secretaire, role:', req.user.user.role);
            return res.status(403).json({ message: 'Accès interdit. Seuls les secrétaires peuvent créer des patients.' });
        }

        const {
            userId,
            sexe,
            numeroTelephone,
            groupeSanguin,
            allergies,
            antecedent,
            dateNaissance,
            assurance,
            membership
        } = req.body;

        console.log('Processing dateNaissance:', dateNaissance, typeof dateNaissance);
        console.log('Processing assurance:', assurance);
        console.log('Processing membership:', membership);

        if (!userId) {
            return res.status(400).json({ message: 'ID utilisateur manquant' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Validate dateNaissance
        const birthDate = new Date(dateNaissance);
        const today = new Date();
        if (isNaN(birthDate.getTime())) {
            return res.status(400).json({ message: 'Date de naissance invalide' });
        }
        if (birthDate > today) {
            return res.status(400).json({ message: 'La date de naissance ne peut pas être dans le futur' });
        }

        const patient = new Patient({
            userId,
            sexe,
            numeroTelephone,
            groupeSanguin,
            allergies: allergies || [],
            antecedent: antecedent || '',
            dateNaissance: birthDate,
            assurance: {
                numero: assurance.numero,
                expiry: new Date(assurance.expiry),
                status: assurance.status || 'Active'
            },
            membership: {
                startDate: new Date(membership.startDate),
                daysRemaining: parseInt(membership.daysRemaining)
            },
            history: [],
            documents: [],
            dossierMedical: [],
            rendezvous: [],
        });

        console.log('Patient model before save:', JSON.stringify(patient, null, 2));
        await patient.save();
        console.log('Patient saved successfully:', patient._id);
        res.status(201).json({ message: 'Patient créé avec succès', patientId: patient._id });
    } catch (error) {
        console.error('Error in createPatient:', error.message, error.stack);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Erreur de validation', errors });
        } else if (error.code === 11000) {
            return res.status(400).json({ message: 'Un patient existe déjà pour cet utilisateur' });
        }
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
module.exports = {
    getPatientDetails,
    getPatients,
    createPatient,
};