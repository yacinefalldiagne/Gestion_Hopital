const mongoose = require('mongoose');

const dossierMedicalSchema = new mongoose.Schema({
    numero: {
        type: String,
        required: true,
        unique: true,
    },
    dateCreation: {
        type: Date,
        default: Date.now,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient', // Reference to the Patient model
        required: true,
    },
    noteMedecin: {
        type: String,
        default: '',
    },
    documentsAssocies: {
        type: [String], // Array of file paths or URLs (e.g., PDF, image links)
        default: [],
    },
});

module.exports = mongoose.model('DossierMedical', dossierMedicalSchema);