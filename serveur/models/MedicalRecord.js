const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  history: {
    type: String,
    default: '',
  },
  diagnoses: [{
    condition: String,
    date: { type: Date, default: Date.now },
  }],
  treatments: [{
    medication: String,
    dosage: String,
    startDate: { type: Date, default: Date.now },
    endDate: Date,
  }],
  reports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);