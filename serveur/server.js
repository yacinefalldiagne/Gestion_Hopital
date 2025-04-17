// server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
require('dotenv').config();
const fileUploadRoutes = require('./routes/fileUpload');

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

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    })
  );


  // Middleware
  app.use(express.json());
  app.use(cookieParser()); // Parse cookies

  // Routes
  app.use('/api/auth', require('./routes/authRoute'));
  app.use('/api/patients', require('./routes/patientRoute'));
  app.use('/api/dossiers', require('./routes/dossierRoute'));

  // Routes pour la gestion des fichiers non DICOM
  app.use('/api/nondicom', fileUploadRoutes);

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