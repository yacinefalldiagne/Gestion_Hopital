const Medecin = require('../models/medecin');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Obtenir la liste des médecins
const getMedecins = async (req, res) => {
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

        const medecins = await Medecin.find()
            .populate('userId', 'prenom nom email')
            .populate({
                path: 'rendezvous',
                select: 'dateRendezVous titre',
            });

        const medecinList = medecins.map(medecin => {
            const latestRendezvous = medecin.rendezvous.sort((a, b) =>
                new Date(b.dateRendezVous) - new Date(a.dateRendezVous)
            )[0];
            return {
                id: medecin.userId._id.toString(),
                name: `${medecin.userId.prenom} ${medecin.userId.nom}`,
                specialite: medecin.specialite.join(', '),
                lastAppointment: latestRendezvous
                    ? new Date(latestRendezvous.dateRendezVous).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Aucun rendez-vous',
                phone: medecin.numeroTelephone,
                email: medecin.userId.email,
                statut: medecin.statut,
            };
        });

        res.json(medecinList);
    } catch (error) {
        console.error('Erreur dans getMedecins:', error.message);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Obtenir les détails d'un médecin
const getMedecinDetails = async (req, res) => {
    try {
        const userId = req.query.userId || req.user.user.id;
        const isAccept = req.user.user.role === 'secretaire' || req.user.user.role === 'medecin';

        if (!isAccept && req.query.userId) {
            return res.status(403).json({ message: 'Accès interdit. Seuls les secrétaires/medecins peuvent voir les détails d\'autres médecins.' });
        }

        const medecin = await Medecin.findOne({ userId })
            .populate('userId', 'prenom nom email')
            .populate({
                path: 'rendezvous',
                select: 'dateRendezVous titre color',
            });

        if (!medecin) {
            return res.status(404).json({ message: 'Aucun médecin trouvé pour cet utilisateur' });
        }

        const medecinData = {
            id: medecin.userId._id.toString(),
            prenom: medecin.userId.prenom,
            nom: medecin.userId.nom,
            email: medecin.userId.email,
            phone: medecin.numeroTelephone,
            specialite: medecin.specialite,
            statut: medecin.statut,
            horaires: medecin.horaires.map(h => ({
                jour: h.jour,
                heureDebut: h.heureDebut,
                heureFin: h.heureFin,
            })),
            appointments: medecin.rendezvous.map(r => ({
                date: r.dateRendezVous.toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' }),
                title: r.titre,
                color: r.color,
            })),
            createdAt: medecin.createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            updatedAt: medecin.updatedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        };

        res.json(medecinData);
    } catch (error) {
        console.error('Erreur dans getMedecinDetails:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Créer un médecin (seuls les secrétaires peuvent créer)
const createMedecin = async (req, res) => {
    try {
        console.log('Received medecin data:', req.body);
        console.log('Authenticated user:', req.user);

        if (req.user.user.role !== 'secretaire') {
            console.log('Access denied: User role is not secretaire, role:', req.user.user.role);
            return res.status(403).json({ message: 'Accès interdit. Seuls les secrétaires peuvent créer des médecins.' });
        }

        const {
            userId,
            nom,
            prenom,
            numeroTelephone,
            email,
            specialite,
            horaires,
            statut,
        } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'ID utilisateur manquant' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Vérification de l'email
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ message: 'Email invalide' });
        }

        // Vérification des spécialités
        const validSpecialites = [
            'Cardiologie', 'Dermatologie', 'Gynécologie', 'Pédiatrie',
            'Neurologie', 'Orthopédie', 'Ophtalmologie', 'Généraliste',
            'Chirurgie', 'Psychiatrie', 'Radiologie', 'Autre'
        ];
        if (!specialite.every(spec => validSpecialites.includes(spec))) {
            return res.status(400).json({ message: 'Spécialité invalide' });
        }

        // Vérification des horaires
        if (horaires) {
            for (const horaire of horaires) {
                if (!['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].includes(horaire.jour)) {
                    return res.status(400).json({ message: 'Jour invalide dans les horaires' });
                }
                if (!/^\d{2}:\d{2}$/.test(horaire.heureDebut) || !/^\d{2}:\d{2}$/.test(horaire.heureFin)) {
                    return res.status(400).json({ message: 'Format d\'heure invalide (attendu : HH:MM)' });
                }
            }
        }

        const medecin = new Medecin({
            userId,
            nom,
            prenom,
            numeroTelephone,
            email,
            specialite,
            horaires: horaires || [],
            statut: statut || 'Actif',
            rendezvous: [],
        });

        console.log('Medecin model before save:', JSON.stringify(medecin, null, 2));
        await medecin.save();
        console.log('Medecin saved successfully:', medecin._id);
        res.status(201).json({ message: 'Médecin créé avec succès', medecinId: medecin._id });
    } catch (error) {
        console.error('Error in createMedecin:', error.message, error.stack);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Erreur de validation', errors });
        } else if (error.code === 11000) {
            return res.status(400).json({ message: 'Un médecin existe déjà pour cet utilisateur ou cet email' });
        }
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

module.exports = {
    getMedecins,
    getMedecinDetails,
    createMedecin,
};