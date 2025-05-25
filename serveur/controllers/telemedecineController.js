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

const sendConsultation = async (req, res) => {
  try {
    if (!gfs) {
      return res.status(500).json({ message: 'GridFS non initialisé.' });
    }
    const { patientData, recipientDoctorId } = req.body;
    const files = req.files || [];

    // Vérifier que le destinataire est un médecin
    const recipientDoctor = await User.findById(recipientDoctorId);
    if (!recipientDoctor || recipientDoctor.role !== 'medecin') {
      return res.status(400).json({ message: 'Destinataire invalide.' });
    }

    // Enregistrer les fichiers dans GridFS
    const fileUrls = await Promise.all(files.map(async (file) => {
      const uploadStream = gfs.openUploadStream(file.originalname);
      uploadStream.end(file.buffer);
      return {
        name: file.originalname,
        url: `/api/files/${uploadStream.id}`,
      };
    }));

    // Créer une nouvelle consultation
    const consultation = new Consultation({
      senderDoctorId: req.user.user.id,
      recipientDoctorId,
      patientData: JSON.parse(patientData),
      files: fileUrls,
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

module.exports = { sendConsultation, getConsultations, getMessages };