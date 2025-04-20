const mongoose = require('mongoose');

const dicomInstanceSchema = new mongoose.Schema({
    instanceId: { type: String, required: true },
    studyInstanceUID: { type: String },
    examDate: { type: Date },
    patientName: { type: String },
});

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
    dicomInstances: {
        type: [dicomInstanceSchema], // Updated to use a sub-schema
        default: [],
    },
});

module.exports = mongoose.model('DossierMedical', dossierMedicalSchema);