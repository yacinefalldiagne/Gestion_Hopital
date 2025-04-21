// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();
const fileUploadRoutes = require('./routes/fileUpload');
const dicomRoutes = require('./routes/dicom');
const reportRoutes = require('./routes/reports'); // Ajout des routes des rapports
const patientRoutes = require('./routes/patients'); // Ajout des routes des patients

const app = express();

// Connexion à MongoDB
connectDB().then(() => {
  // Middleware
  app.use(cors({
    origin: 'http://localhost:3000', // Ajustez selon votre port Vite
    credentials: true
  }));
  app.use(express.json());
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - Requête reçue: ${req.method} ${req.url}`);
    next();
  });

  // Routes d'authentification
  app.use('/api/auth', require('./routes/auth'));

  // Routes pour la gestion des fichiers non DICOM
  app.use('/api/nondicom', fileUploadRoutes);
    // Routes pour la gestion des fichiers DICOM
  app.use('/api/dicom', require('./routes/dicom'));
  app.use('/api/reports', reportRoutes); // Ajout des routes des rapports
  app.use('/api/patients', patientRoutes); // Ajout des routes des patients

  // Route de test simple
  app.get('/api/test', (req, res) => {
    res.json({ message: 'Le serveur fonctionne correctement' });
  });

  // Lancer le serveur
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
}).catch((err) => {
  console.error('Erreur lors du démarrage du serveur:', err.message);
  process.exit(1);
});