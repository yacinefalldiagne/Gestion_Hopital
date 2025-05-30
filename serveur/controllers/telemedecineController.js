const mongoose = require('mongoose');
const User = require('../models/user');
const Consultation = require('../models/consultation');
const Message = require('../models/message');
const { GridFSBucket } = require('mongodb');
const mongooseConnection = mongoose.connection;

let gfs;
mongooseConnection.once('open', () => {
  gfs = new GridFSBucket(mongooseConnection.db, { bucketName: 'uploads' });
});

const getPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('nom prenom _id');
    res.json(patients);
  } catch (error) {
    console.error('Erreur dans getPatients:', error.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const sendConsultation = async (req, res) => {
  try {
    if (!gfs) {
      return res.status(500).json({ message: 'GridFS non initialisé.' });
    }
    const { patientId, recipientDoctorId } = req.body;
    const files = JSON.parse(req.body.files || '[]');

    // Vérifier que le destinataire est un médecin
    const recipientDoctor = await User.findById(recipientDoctorId);
    if (!recipientDoctor || recipientDoctor.role !== 'medecin') {
      return res.status(400).json({ message: 'Destinataire invalide.' });
    }

    // Vérifier que le patient existe
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(400).json({ message: 'Patient invalide.' });
    }

    // Récupérer le dossier médical du patient
    const dossier = await mongoose.model('Dossier').findOne({ patientId });
    const patientData = {
      nom: patient.nom,
      prenom: patient.prenom,
      age: patient.dateNaissance
        ? Math.floor((new Date() - new Date(patient.dateNaissance)) / (365.25 * 24 * 60 * 60 * 1000))
        : null,
      allergies: patient.allergies || [],
      antecedent: patient.antecedent || '',
    };

    // Créer une nouvelle consultation
    const consultation = new Consultation({
      senderDoctorId: req.user.user.id,
      recipientDoctorId,
      patientData,
      files,
    });

    await consultation.save();
    res.status(201).json({ message: 'Consultation envoyée avec succès.', consultationId: consultation._id });
  } catch (error) {
    console.error('Erreur dans sendConsultation:', error.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({ recipientDoctorId: req.user.user.id });
    res.json(consultations);
  } catch (error) {
    console.error('Erreur dans getConsultations:', error.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ consultationId: req.params.consultationId });
    res.json(messages);
  } catch (error) {
    console.error('Erreur dans getMessages:', error.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { getPatients, sendConsultation, getConsultations, getMessages };