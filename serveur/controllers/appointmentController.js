const Appointment = require('../models/appointment');
const jwt = require('jsonwebtoken');

// Test de l'API
const test = (req, res) => {
    res.json("Hello from appointment controller");
};

// Créer un nouveau rendez-vous
const createAppointment = async (req, res) => {
    try {
        const { token } = req.cookies;
        const { date, heureDebut, heureFin, titre, description } = req.body;

        // Vérification du token
        if (!token) {
            return res.status(401).json({ error: 'Veuillez vous connecter pour prendre un rendez-vous' });
        }

        // Vérification des champs obligatoires
        if (!date || !heureDebut || !heureFin || !titre || !description) {
            return res.json({ error: "Tous les champs sont requis" });
        }

        // Vérification des dates
        const debut = new Date(heureDebut);
        const fin = new Date(heureFin);
        if (debut >= fin) {
            return res.json({ error: "L'heure de début doit être antérieure à l'heure de fin" });
        }

        // Vérification des chevauchements pour le même jour
        const existingAppointment = await Appointment.findOne({
            date: new Date(date),
            $or: [
                {
                    heureDebut: { $lt: fin },
                    heureFin: { $gt: debut }
                }
            ]
        });

        if (existingAppointment) {
            return res.json({ error: "Un rendez-vous existe déjà à ce créneau horaire" });
        }

        // Décodage du token pour obtenir l'utilisateur
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Création du rendez-vous
        const newAppointment = new Appointment({
            date: new Date(date),
            heureDebut: debut,
            heureFin: fin,
            titre,
            description,
            status: 'en attente' // statut par défaut
        });

        await newAppointment.save();
        res.status(201).json({ message: "Rendez-vous créé avec succès", appointment: newAppointment });

    } catch (err) {
        console.error("Error in createAppointment:", err);
        res.status(500).json({ error: "Erreur serveur. Veuillez réessayer." });
    }
};

// Récupérer tous les rendez-vous (pour le secrétaire)
const getAllAppointments = async (req, res) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({ error: 'Veuillez vous connecter' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Vérification du rôle (seul le secrétaire peut voir tous les RDV)
        if (decoded.role !== 'secretaire') {
            return res.status(403).json({ error: 'Accès réservé au secrétaire' });
        }

        const appointments = await Appointment.find()
            .sort({ date: 1, heureDebut: 1 }); // Tri par date et heure

        res.status(200).json({ appointments });

    } catch (err) {
        console.error("Error in getAllAppointments:", err);
        res.status(500).json({ error: "Erreur serveur. Veuillez réessayer." });
    }
};

// Récupérer les rendez-vous d'un utilisateur spécifique
const getUserAppointments = async (req, res) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({ error: 'Veuillez vous connecter' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const appointments = await Appointment.find()
            .sort({ date: 1, heureDebut: 1 });

        res.status(200).json({ appointments });

    } catch (err) {
        console.error("Error in getUserAppointments:", err);
        res.status(500).json({ error: "Erreur serveur. Veuillez réessayer." });
    }
};

// Mettre à jour le statut d'un rendez-vous (pour le secrétaire)
const updateAppointmentStatus = async (req, res) => {
    try {
        const { token } = req.cookies;
        const { appointmentId, status } = req.body;

        if (!token) {
            return res.status(401).json({ error: 'Veuillez vous connecter' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'secretaire') {
            return res.status(403).json({ error: 'Accès réservé au secrétaire' });
        }

        if (!['en attente', 'valide', 'annule'].includes(status)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ error: 'Rendez-vous non trouvé' });
        }

        res.status(200).json({ message: "Statut mis à jour", appointment });

    } catch (err) {
        console.error("Error in updateAppointmentStatus:", err);
        res.status(500).json({ error: "Erreur serveur. Veuillez réessayer." });
    }
};

module.exports = {
    test,
    createAppointment,
    getAllAppointments,
    getUserAppointments,
    updateAppointmentStatus
};