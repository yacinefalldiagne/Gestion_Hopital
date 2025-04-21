const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Report = require('../models/Report');

// Créer un nouveau rapport
router.post('/', auth, async (req, res) => {
  try {
    const { patientId, content } = req.body;
    if (!patientId || !content) {
      return res.status(400).json({ message: 'patientId et content sont requis' });
    }

    const report = new Report({
      patientId,
      content,
      doctorId: req.user.id, // Récupéré depuis le middleware auth
    });

    await report.save();
    res.status(201).json({ message: 'Rapport créé avec succès', report });
  } catch (error) {
    console.error('Erreur lors de la création du rapport:', error.message);
    res.status(500).json({ message: 'Erreur lors de la création du rapport', error: error.message });
  }
});

// Récupérer tous les rapports d'un patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const reports = await Report.find({ patientId })
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error.message);
    res.status(500).json({ message: 'Erreur lors de la récupération des rapports', error: error.message });
  }
});

// Mettre à jour un rapport
router.put('/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'content est requis' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }

    // Vérifier que le médecin est l'auteur du rapport
    if (report.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    report.content = content;
    await report.save();
    res.json({ message: 'Rapport mis à jour avec succès', report });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rapport:', error.message);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du rapport', error: error.message });
  }
});

// Supprimer un rapport
router.delete('/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }

    // Vérifier que le médecin est l'auteur du rapport
    if (report.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    await report.deleteOne();
    res.json({ message: 'Rapport supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du rapport:', error.message);
    res.status(500).json({ message: 'Erreur lors de la suppression du rapport', error: error.message });
  }
});

module.exports = router;