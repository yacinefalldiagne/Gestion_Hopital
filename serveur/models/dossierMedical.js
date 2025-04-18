const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
    date: { type: Date },
    doctor: { type: String },
    diagnosis: { type: String },
    treatment: { type: String },
    notes: { type: String },
});

const prescriptionSchema = new mongoose.Schema({
    medication: { type: String },
    dosage: { type: String },
    frequency: { type: String },
    duration: { type: String },
    prescribedDate: { type: Date },
});

const labResultSchema = new mongoose.Schema({
    testName: { type: String },
    result: { type: String },
    date: { type: Date },
    notes: { type: String },
});

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
        ref: 'Patient',
        required: true,
    },
    noteMedecin: {
        type: String,
        default: '',
    },
    consultations: {
        type: [consultationSchema],
        default: [],
    },
    prescriptions: {
        type: [prescriptionSchema],
        default: [],
    },
    labResults: {
        type: [labResultSchema],
        default: [],
    },
    documentsAssocies: {
        type: [String],
        default: [],
    },
    studyIds: [{
        type: String // IDs des instances DICOM dans Orthanc
    }],
});

module.exports = mongoose.model('DossierMedical', dossierMedicalSchema);