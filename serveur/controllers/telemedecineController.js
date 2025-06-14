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
    // Vérification GridFS
    if (!gfs) {
      return res.status(500).json({ message: 'Système de fichiers non initialisé.' });
    }

    // Extraction ID utilisateur (compatible avec différentes structures d'auth)
    const userId = req.user?.user?.id || req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    // Récupération des données
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

    // Traitement des fichiers
    const fileUrls = [];
    for (const file of files) {
      try {
        const uploadStream = gfs.openUploadStream(file.originalname, {
          metadata: {
            originalName: file.originalname,
            uploadedBy: userId,
            uploadedAt: new Date()
          }
        });

        await new Promise((resolve, reject) => {
          uploadStream.on('error', reject);
          uploadStream.on('finish', resolve);
          uploadStream.end(file.buffer);
        });

        fileUrls.push({
          name: file.originalname,
          url: `/api/files/${uploadStream.id}`,
          fileId: uploadStream.id
        });
      } catch (fileError) {
        return res.status(500).json({ 
          message: 'Erreur lors de l\'upload des fichiers.',
          debug: fileError.message
        });
      }
    }

    // Création et sauvegarde de la consultation
    const consultationData = {
      senderDoctorId: userId,
      recipientDoctorId,
      patientData: parsedPatientData,
      files: fileUrls,
      status: 'pending',
      createdAt: new Date()
    };

    const consultation = new Consultation(consultationData);
    
    // Validation
    const validationError = consultation.validateSync();
    if (validationError) {
      return res.status(400).json({ 
        message: 'Données de consultation invalides.',
        debug: validationError.message,
        errors: Object.keys(validationError.errors).map(key => ({
          field: key,
          message: validationError.errors[key].message
        }))
      });
    }

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

module.exports = { sendConsultation, getConsultations, getMessages };