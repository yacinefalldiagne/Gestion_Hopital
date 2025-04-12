const mongoose = require('mongoose');
const { Schema } = mongoose;

const dossierSchema = new Schema({
    numeroDossier: {
        type: String
    },
    dateCreation: {
        type: Date,
        required: true
    },
    noteMedecin: {
        type: Date,
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileReference: {
        type: String,
    },
}, { timestamps: true });


const dossierModel = mongoose.model('Dossier', dossierSchema);

module.exports = dossierModel;