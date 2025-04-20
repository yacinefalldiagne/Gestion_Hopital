const mongoose = require('mongoose');

const rendezVousSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    dateRendezVous: { type: Date, required: true },
    heureDebut: { type: Date, required: true },
    heureFin: { type: Date, required: true },
    titre: { type: String, required: true },
    description: { type: String, default: '' },
    statut: { type: String, enum: ['Planifié', 'En cours', 'Terminé', 'Annulé'], default: 'Planifié' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    medecin: { type: mongoose.Schema.Types.ObjectId, ref: 'Medecin', required: true },
    createdAt: { type: Date, default: Date.now },
    color: { type: String, default: 'bg-gray-200' }, // For UI styling (e.g., bg-blue-200)
});

module.exports = mongoose.model('Rendezvous', rendezVousSchema);