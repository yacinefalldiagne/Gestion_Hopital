const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  senderDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientData: {
    name: String,
    age: Number,
    symptoms: String,
    notes: String,
  },
  files: [{ name: String, url: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Consultation', consultationSchema);