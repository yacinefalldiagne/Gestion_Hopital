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
    // Vérification GridFS
    if (!gfs) {
      return res.status(500).json({ message: 'Système de fichiers non initialisé.' });
    }
    const { patientData, recipientDoctorId } = req.body;
    const files = req.files || [];

    // Validation des données requises
    if (!patientData || !recipientDoctorId) {
      return res.status(400).json({ 
        message: 'Données manquantes.',
        debug: `patientData: ${!!patientData}, recipientDoctorId: ${!!recipientDoctorId}`
      });
    }

    // Parsing des données patient
    let parsedPatientData;
    try {
      parsedPatientData = typeof patientData === 'string' ? JSON.parse(patientData) : patientData;
    } catch (parseError) {
      return res.status(400).json({ 
        message: 'Format des données patient invalide.',
        debug: parseError.message
      });
    }

    // Vérification des utilisateurs
    const [senderDoctor, recipientDoctor] = await Promise.all([
      User.findById(userId),
      User.findById(recipientDoctorId)
    ]);

    if (!senderDoctor) {
      return res.status(400).json({ message: 'Utilisateur expéditeur non trouvé.' });
    }

    if (!recipientDoctor) {
      return res.status(400).json({ message: 'Médecin destinataire non trouvé.' });
    }

    if (senderDoctor.role !== 'medecin') {
      return res.status(403).json({ message: 'Seuls les médecins peuvent envoyer des consultations.' });
    }

    if (recipientDoctor.role !== 'medecin') {
      return res.status(400).json({ message: 'Le destinataire doit être un médecin.' });
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

    res.status(201).json({ 
      message: 'Consultation envoyée avec succès.', 
      consultationId: consultation._id
    });

  } catch (error) {
    console.error('Erreur sendConsultation:', error);
    res.status(500).json({ 
      message: 'Erreur serveur.',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getConsultations = async (req, res) => {
  try {
    const userId = req.user?.user?.id || req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    const consultations = await Consultation.find({ 
      recipientDoctorId: userId 
    })
    .populate('senderDoctorId', 'name email')
    .sort({ createdAt: -1 });

    res.json(consultations);
  } catch (error) {
    console.error('Erreur getConsultations:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user?.user?.id || req.user?.id || req.user?._id;

    if (!consultationId) {
      return res.status(400).json({ message: 'ID de consultation manquant.' });
    }

    // Vérifier l'accès à la consultation
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation non trouvée.' });
    }

    if (consultation.senderDoctorId.toString() !== userId && 
        consultation.recipientDoctorId.toString() !== userId) {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }

    const messages = await Message.find({ consultationId })
      .populate('senderId', 'name')
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Erreur getMessages:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { getPatients, sendConsultation, getConsultations, getMessages };