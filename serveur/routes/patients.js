const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');
const Report = require('../models/Report');

// Récupérer tous les patients
router.get('/', auth, async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter un nouveau patient
router.post('/', auth, async (req, res) => {
  const { name, dateOfBirth, gender } = req.body;
  try {
    const patient = new Patient({
      name,
      dateOfBirth,
      gender,
    });
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer un patient par ID
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un patient
router.put('/:id', auth, async (req, res) => {
  const { name, dateOfBirth, gender } = req.body;
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    patient.name = name || patient.name;
    patient.dateOfBirth = dateOfBirth || patient.dateOfBirth;
    patient.gender = gender || patient.gender;
    await patient.save();
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un patient
router.delete('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    await patient.remove();
    res.json({ message: 'Patient supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer le dossier médical du patient connecté
router.get('/medical-record', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Trouver le dossier médical du patient connecté
    let medicalRecord = await MedicalRecord.findOne({ patientId: req.user.id })
      .populate('reports')
      .populate('patientId', 'name');

    if (!medicalRecord) {
      // Si aucun dossier n'existe, en créer un vide
      medicalRecord = new MedicalRecord({
        patientId: req.user.id,
      });
      await medicalRecord.save();
    }

    // Récupérer les rapports associés séparément si nécessaire
    const reports = await Report.find({ patientId: req.user.id }).populate('doctorId', 'name');
    medicalRecord.reports = reports;

   // Ajouter les rapports au résultat
   const result = medicalRecord.toObject();
   result.reports = reports;
   result.patientName = patient.name;

  res.json(medicalRecord);
  } catch (error) {
    console.error('Erreur /medical-record:', error)
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;