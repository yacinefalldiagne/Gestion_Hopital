const mongoose = require('mongoose');

const medecinSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    nom: {
        type: String,
        required: true,
    },
    prenom: {
        type: String,
        required: true,
    },
    numeroTelephone: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide'],
    },
    specialite: {
        type: [String],
        required: true,
        enum: [
            'Cardiologie', 'Dermatologie', 'Gynécologie', 'Pédiatrie',
            'Neurologie', 'Orthopédie', 'Ophtalmologie', 'Généraliste',
            'Chirurgie', 'Psychiatrie', 'Radiologie', 'Autre'
        ],
    },

    horaires: [{
        jour: {
            type: String,
            enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
            required: true
        },
        heureDebut: { type: String, required: true }, // Format: "08:00"
        heureFin: { type: String, required: true },   // Format: "17:00"
    }],
    rendezvous: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rendezvous',
    }],
    statut: {
        type: String,
        enum: ['Actif', 'Inactif', 'En congé'],
        default: 'Actif',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware pour mettre à jour updatedAt avant chaque sauvegarde
medecinSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Medecin', medecinSchema);