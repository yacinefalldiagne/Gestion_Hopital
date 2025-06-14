const mongoose = require('mongoose');
const Rendezvous = require('../models/rendezVous');
const Patient = require('../models/patient');
const Medecin = require('../models/medecin');
const { v4: uuidv4 } = require('uuid');

const createRendezvous = async (req, res) => {
    try {
        const { dateRendezVous, heureDebut, heureFin, titre, description, statut, patient, medecin, color } = req.body;

        // Validate required fields
        if (!dateRendezVous || !heureDebut || !heureFin || !titre || !patient || !medecin) {
            return res.status(400).json({ message: 'Champs requis manquants' });
        }

        // Validate patient ID format
        if (!mongoose.Types.ObjectId.isValid(patient)) {
            return res.status(400).json({ message: 'Format de l\'ID du patient invalide' });
        }

        // Chercher le patient par userId (User._id)
        const patientExists = await Patient.findOne({ userId: patient });
        if (!patientExists) {
            console.error(`Patient non trouvé pour userId: ${patient}`);
            return res.status(404).json({ message: 'Patient non trouvé' });
        }

        // Validate doctor ID format
        if (!mongoose.Types.ObjectId.isValid(medecin)) {
            return res.status(400).json({ message: 'Format de l\'ID du médecin invalide' });
        }

        // Chercher le médecin par userId (User._id)
        const medecinExists = await Medecin.findOne({ userId: medecin });
        if (!medecinExists) {
            console.error(`Médecin non trouvé pour userId: ${medecin}`);
            return res.status(404).json({ message: 'Médecin non trouvé' });
        }

        // Validate date and time
        const startTime = new Date(heureDebut);
        const endTime = new Date(heureFin);
        const appointmentDate = new Date(dateRendezVous);
        if (startTime >= endTime) {
            return res.status(400).json({ message: 'L\'heure de début doit être avant l\'heure de fin' });
        }
        if (isNaN(appointmentDate.getTime())) {
            return res.status(400).json({ message: 'Format de date invalide' });
        }

        // Check for overlapping appointments for the same patient
        const patientOverlapping = await Rendezvous.find({
            patient: patientExists._id,
            dateRendezVous: appointmentDate,
            $or: [
                { heureDebut: { $lte: endTime, $gte: startTime } },
                { heureFin: { $gte: startTime, $lte: endTime } },
                { heureDebut: { $lte: startTime }, heureFin: { $gte: endTime } },
            ],
        });
        if (patientOverlapping.length > 0) {
            return res.status(409).json({ message: 'Conflit de rendez-vous pour le patient' });
        }

        // Check for overlapping appointments for the same doctor
        const medecinOverlapping = await Rendezvous.find({
            medecin: medecinExists._id,
            dateRendezVous: appointmentDate,
            $or: [
                { heureDebut: { $lte: endTime, $gte: startTime } },
                { heureFin: { $gte: startTime, $lte: endTime } },
                { heureDebut: { $lte: startTime }, heureFin: { $gte: endTime } },
            ],
        });
        if (medecinOverlapping.length > 0) {
            return res.status(409).json({ message: 'Conflit de rendez-vous pour le médecin' });
        }

        const rendezvous = new Rendezvous({
            id: uuidv4(),
            dateRendezVous: appointmentDate,
            heureDebut: startTime,
            heureFin: endTime,
            titre,
            description: description || '',
            statut: statut || 'Planifié',
            patient: patientExists._id,
            medecin: medecinExists._id,
            color: color || 'bg-gray-200',
        });

        await rendezvous.save();

        // Populate patient.userId and medecin.userId to get nom and prenom from User
        const populatedRendezvous = await Rendezvous.findById(rendezvous._id)
            .populate({
                path: 'patient',
                populate: {
                    path: 'userId',
                    select: 'nom prenom',
                },
            })
            .populate({
                path: 'medecin',
                populate: {
                    path: 'userId',
                    select: 'nom prenom',
                },
            });

        // Transform the response to match frontend expectations
        const transformedRendezvous = {
            ...populatedRendezvous._doc,
            patient: {
                _id: populatedRendezvous.patient._id,
                nom: populatedRendezvous.patient.userId?.nom || '',
                prenom: populatedRendezvous.patient.userId?.prenom || '',
            },
            medecin: {
                _id: populatedRendezvous.medecin._id,
                nom: populatedRendezvous.medecin.userId?.nom || '',
                prenom: populatedRendezvous.medecin.userId?.prenom || '',
            },
        };

        res.status(201).json({ message: 'Rendez-vous créé avec succès', rendezvous: transformedRendezvous });
    } catch (error) {
        console.error('Erreur dans createRendezvous:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

const updateRendezvous = async (req, res) => {
    try {
        const { dateRendezVous, heureDebut, heureFin, titre, description, statut, patient, medecin, color } = req.body;

        // Find existing appointment
        const rendezvous = await Rendezvous.findOne({ id: req.params.id });
        if (!rendezvous) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        // Validate patient if updated
        let patientId = rendezvous.patient;
        if (patient && patient !== rendezvous.patient.toString()) {
            if (!mongoose.Types.ObjectId.isValid(patient)) {
                return res.status(400).json({ message: 'Format de l\'ID du patient invalide' });
            }
            const patientExists = await Patient.findOne({ userId: patient });
            if (!patientExists) {
                return res.status(404).json({ message: 'Patient non trouvé' });
            }
            patientId = patientExists._id;
        }

        // Validate doctor if updated
        let medecinId = rendezvous.medecin;
        if (medecin && medecin !== rendezvous.medecin.toString()) {
            if (!mongoose.Types.ObjectId.isValid(medecin)) {
                return res.status(400).json({ message: 'Format de l\'ID du médecin invalide' });
            }
            const medecinExists = await Medecin.findOne({ userId: medecin });
            if (!medecinExists) {
                return res.status(404).json({ message: 'Médecin non trouvé' });
            }
            medecinId = medecinExists._id;
        }

        // Validate date and time if updated
        let startTime, endTime, appointmentDate;
        if (heureDebut && heureFin) {
            startTime = new Date(heureDebut);
            endTime = new Date(heureFin);
            if (startTime >= endTime) {
                return res.status(400).json({ message: 'L\'heure de début doit être avant l\'heure de fin' });
            }
        }
        if (dateRendezVous) {
            appointmentDate = new Date(dateRendezVous);
            if (isNaN(appointmentDate.getTime())) {
                return res.status(400).json({ message: 'Format de date invalide' });
            }
        }

        // Check for overlapping appointments if date/time/patient/doctor changes
        if (dateRendezVous || heureDebut || heureFin || patient || medecin) {
            // Patient overlap check
            const patientQuery = {
                patient: patientId,
                dateRendezVous: appointmentDate || rendezvous.dateRendezVous,
                id: { $ne: req.params.id }, // Exclude current appointment
                $or: [
                    { heureDebut: { $lte: endTime || rendezvous.heureFin, $gte: startTime || rendezvous.heureDebut } },
                    { heureFin: { $gte: startTime || rendezvous.heureDebut, $lte: endTime || rendezvous.heureFin } },
                    { heureDebut: { $lte: startTime || rendezvous.heureDebut }, heureFin: { $gte: endTime || rendezvous.heureFin } },
                ],
            };
            const patientOverlapping = await Rendezvous.find(patientQuery);
            if (patientOverlapping.length > 0) {
                return res.status(409).json({ message: 'Conflit de rendez-vous pour le patient' });
            }

            // Doctor overlap check
            const medecinQuery = {
                medecin: medecinId,
                dateRendezVous: appointmentDate || rendezvous.dateRendezVous,
                id: { $ne: req.params.id }, // Exclude current appointment
                $or: [
                    { heureDebut: { $lte: endTime || rendezvous.heureFin, $gte: startTime || rendezvous.heureDebut } },
                    { heureFin: { $gte: startTime || rendezvous.heureDebut, $lte: endTime || rendezvous.heureFin } },
                    { heureDebut: { $lte: startTime || rendezvous.heureDebut }, heureFin: { $gte: endTime || rendezvous.heureFin } },
                ],
            };
            const medecinOverlapping = await Rendezvous.find(medecinQuery);
            if (medecinOverlapping.length > 0) {
                return res.status(409).json({ message: 'Conflit de rendez-vous pour le médecin' });
            }
        }

        // Update fields
        rendezvous.dateRendezVous = appointmentDate || rendezvous.dateRendezVous;
        rendezvous.heureDebut = startTime || rendezvous.heureDebut;
        rendezvous.heureFin = endTime || rendezvous.heureFin;
        rendezvous.titre = titre || rendezvous.titre;
        rendezvous.description = description !== undefined ? description : rendezvous.description;
        rendezvous.statut = statut || rendezvous.statut;
        rendezvous.patient = patientId;
        rendezvous.medecin = medecinId;
        rendezvous.color = color || rendezvous.color;

        await rendezvous.save();

        // Populate patient.userId and medecin.userId to get nom and prenom from User
        const populatedRendezvous = await Rendezvous.findById(rendezvous._id)
            .populate({
                path: 'patient',
                populate: {
                    path: 'userId',
                    select: 'nom prenom',
                },
            })
            .populate({
                path: 'medecin',
                populate: {
                    path: 'userId',
                    select: 'nom prenom',
                },
            });

        // Transform the response to match frontend expectations
        const transformedRendezvous = {
            ...populatedRendezvous._doc,
            patient: {
                _id: populatedRendezvous.patient._id,
                nom: populatedRendezvous.patient.userId?.nom || '',
                prenom: populatedRendezvous.patient.userId?.prenom || '',
            },
            medecin: {
                _id: populatedRendezvous.medecin._id,
                nom: populatedRendezvous.medecin.userId?.nom || '',
                prenom: populatedRendezvous.medecin.userId?.prenom || '',
            },
        };

        res.status(200).json({ message: 'Rendez-vous modifié avec succès', rendezvous: transformedRendezvous });
    } catch (error) {
        console.error('Erreur dans updateRendezvous:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

const getAllRendezvous = async (req, res) => {
    try {
        const rendezvous = await Rendezvous.find()
            .populate({
                path: 'patient',
                populate: {
                    path: 'userId',
                    select: 'nom prenom',
                },
            })
            .populate({
                path: 'medecin',
                populate: {
                    path: 'userId',
                    select: 'nom prenom',
                },
            })
            .sort({ dateRendezVous: -1 });

        // Transform each rendezvous to match frontend expectations
        const transformedRendezvous = rendezvous.map(rdv => ({
            ...rdv._doc,
            patient: {
                _id: rdv.patient._id,
                nom: rdv.patient.userId?.nom || '',
                prenom: rdv.patient.userId?.prenom || '',
            },
            medecin: {
                _id: rdv.medecin._id,
                nom: rdv.medecin.userId?.nom || '',
                prenom: rdv.medecin.userId?.prenom || '',
            },
        }));

        res.status(200).json(transformedRendezvous);
    } catch (error) {
        console.error('Erreur dans getAllRendezvous:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

const getRendezvousById = async (req, res) => {
    try {
        const rendezvous = await Rendezvous.findOne({ id: req.params.id })
            .populate({
                path: 'patient',
                populate: {
                    path: 'userId',
                    select: 'nom prenom',
                },
            })
            .populate({
                path: 'medecin',
                populate: {
                    path: 'userId',
                    select: 'nom prenom',
                },
            });

        if (!rendezvous) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        // Transform the response to match frontend expectations
        const transformedRendezvous = {
            ...rendezvous._doc,
            patient: {
                _id: rendezvous.patient._id,
                nom: rendezvous.patient.userId?.nom || '',
                prenom: rendezvous.patient.userId?.prenom || '',
            },
            medecin: {
                _id: rendezvous.medecin._id,
                nom: rendezvous.medecin.userId?.nom || '',
                prenom: rendezvous.medecin.userId?.prenom || '',
            },
        };

        res.status(200).json(transformedRendezvous);
    } catch (error) {
        console.error('Erreur dans getRendezvousById:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

const deleteRendezvous = async (req, res) => {
    try {
        const rendezvous = await Rendezvous.findOneAndDelete({ id: req.params.id });
        if (!rendezvous) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }
        res.status(200).json({ message: 'Rendez-vous supprimé avec succès' });
    } catch (error) {
        console.error('Erreur dans deleteRendezvous:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

const getRendezvousByPatient = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.patientId)) {
            return res.status(400).json({ message: 'Format de l\'ID du patient invalide' });
        }
        const patientExists = await Patient.findOne({ userId: req.params.patientId });
        if (!patientExists) {
            return res.status(404).json({ message: 'Patient non trouvé' });
        }
        const rendezvous = await Rendezvous.find({ patient: patientExists._id })
            .populate({
                path: 'patient',
                populate: {
                    path: 'userId',
                    select: 'nom prenom',
                },
            })
            .populate({
                path: 'medecin',
                populate: {
                    path: 'userId',
                    select: 'nom prenom',
                },
            })
            .sort({ dateRendezVous: -1 });

        // Transform each rendezvous to match frontend expectations
        const transformedRendezvous = rendezvous.map(rdv => ({
            ...rdv._doc,
            patient: {
                _id: rdv.patient._id,
                nom: rdv.patient.userId?.nom || '',
                prenom: rdv.patient.userId?.prenom || '',
            },
            medecin: {
                _id: rdv.medecin._id,
                nom: rdv.medecin.userId?.nom || '',
                prenom: rdv.medecin.userId?.prenom || '',
            },
        }));

        res.status(200).json(transformedRendezvous);
    } catch (error) {
        console.error('Erreur dans getRendezvousByPatient:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

const getRendezvousByMedecin = async (req, res) => {
    try {
        const medecinId = req.params.medecinId;
        console.log('Recherche de rendez-vous pour medecinId:', medecinId);
        
        // Validation de l'ID
        if (!mongoose.Types.ObjectId.isValid(medecinId)) {
            return res.status(400).json({ message: 'Format de l\'ID du médecin invalide' });
        }

        // Chercher le médecin par userId (User._id)
        const medecinExists = await Medecin.findOne({ userId: medecinId });
        if (!medecinExists) {
            console.error(`Médecin non trouvé pour userId: ${medecinId}`);
            return res.status(404).json({ message: 'Médecin non trouvé' });
        }

        // Chercher les rendez-vous par l'ID interne du médecin
        const rendezvous = await Rendezvous.find({ medecin: medecinExists._id })
            .populate({
                path: 'patient',
                populate: {
                    path: 'userId',
                    select: 'nom prenom',
                },
            })
            .populate({
                path: 'medecin',
                populate: {
                    path: 'userId',
                    select: 'nom prenom',
                },
            })
            .sort({ dateRendezVous: -1 });

        // Transform each rendezvous to match frontend expectations
        const transformedRendezvous = rendezvous.map(rdv => ({
            ...rdv._doc,
            patient: {
                _id: rdv.patient._id,
                nom: rdv.patient.userId?.nom || '',
                prenom: rdv.patient.userId?.prenom || '',
            },
            medecin: {
                _id: rdv.medecin._id,
                nom: rdv.medecin.userId?.nom || '',
                prenom: rdv.medecin.userId?.prenom || '',
            },
        }));

        console.log(`${transformedRendezvous.length} rendez-vous trouvés pour le médecin`);
        res.status(200).json(transformedRendezvous);
        
    } catch (error) {
        console.error('Erreur dans getRendezvousByMedecin:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Export unique de toutes les fonctions
module.exports = {
    createRendezvous,
    getAllRendezvous,
    getRendezvousById,
    updateRendezvous,
    deleteRendezvous,
    getRendezvousByPatient,
    getRendezvousByMedecin,
};