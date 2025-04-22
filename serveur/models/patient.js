const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    sexe: {
        type: String,
        enum: ['Masculin', 'Féminin', 'Autre'],
        required: true,
    },
    numeroTelephone: {
        type: String,
        required: true,
    },
    groupeSanguin: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: true,
    },
    allergies: {
        type: [String],
        default: [],
    },
    antecedent: {
        type: String,
        default: '',
    },
    dateNaissance: {
        type: Date,
        required: true,
    },
    assurance: {
        numero: { type: String, required: true },
        expiry: { type: Date, required: true },
        status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    },
    membership: {
        startDate: { type: Date, required: true },
        daysRemaining: { type: Number, required: true },
    },
    history: [{
        id: { type: String }, // Removed required
        type: { type: String },
        date: { type: Date },
        result: { type: String },
        payment: { type: String, enum: ['Paid', 'Pending'] },
    }],
    documents: [{
        name: { type: String }, // Removed required
        size: { type: String }, // e.g., "2.3 mb"
    }],
    dossierMedical: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DossierMedical',
    }],
    rendezvous: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rendezvous',
    }],
    medicalImages: [{
        name: { type: String, required: true },
        type: { type: String, enum: ['DICOM', 'Non-DICOM'], required: true },
        size: { type: String, required: true },
        url: { type: String, required: true },
        uploadDate: { type: Date, default: Date.now },
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Patient', patientSchema);