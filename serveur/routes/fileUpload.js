// routes/fileUpload.js
const express = require('express');
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer storage config
const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (req, file) => {
    console.log('Fichier reçu:', file.originalname);
    return {
      bucketName: 'nondicom_files',
      filename: `${Date.now()}_${file.originalname}`,
      metadata: {
        uploadedBy: req.user ? req.user.id : 'guest',
        uploadDate: new Date(),
      },
    };
  },
});

const upload = multer({ storage });

// Route de test simple sans auth
router.post('/test-upload', (req, res) => {
  console.log('Route test-upload appelée');
  res.json({ message: 'Test upload route accessible' });
});

// Upload files - CORRIGER le chemin ici (enlever "nondicom/" du chemin)
router.post('/upload', auth, upload.array('files', 10), (req, res) => {
  console.log('Route /upload appelée');
  console.log('Fichiers reçus:', req.files?.length || 0);
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Aucun fichier téléchargé' });
  }
  
  res.json({
    message: 'Fichiers uploadés avec succès',
    files: req.files.map(file => ({
      id: file.id,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }))
  });
});

// List files
router.get('/files', async (req, res) => {
  try {
    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'nondicom_files',
    });
    const files = await bucket.find().toArray();
    res.json(files);
  } catch (err) {
    console.error('Erreur dans GET /files:', err.message);
    res.status(500).json({ message: 'Erreur lors de la récupération des fichiers', error: err.message });
  }
});

// Download
router.get('/download/:filename', (req, res) => {
  try {
    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'nondicom_files',
    });
    const stream = bucket.openDownloadStreamByName(req.params.filename);
    stream.on('error', () => res.status(404).send('Fichier introuvable'));
    stream.pipe(res);
  } catch (err) {
    console.error('Erreur dans GET /download:', err.message);
    res.status(500).json({ message: 'Erreur lors du téléchargement', error: err.message });
  }
});

// Delete
router.delete('/files/:id', async (req, res) => {
  try {
    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'nondicom_files',
    });
    await bucket.delete(new mongoose.Types.ObjectId(req.params.id));
    res.json({ message: 'Fichier supprimé avec succès' });
  } catch (err) {
    console.error('Erreur dans DELETE /files:', err.message);
    res.status(500).json({ message: 'Erreur lors de la suppression du fichier', error: err.message });
  }
});

module.exports = router;