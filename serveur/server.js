const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
require('dotenv').config();
const path = require('path');
const app = express();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());


// Routes
app.use('/api/auth', require('./routes/authRoute'));
app.use('/api/patients', require('./routes/patientRoute'));
app.use('/api/medecins', require('./routes/medecinRoutes'));
app.use('/api/dossiers', require('./routes/dossierRoute'));
app.use('/api/rendezvous', require('./routes/rendezvousRoute'));
// app.use('/api/files', require('./routes/fileRoute')); // Corrected path for file routes


// Connexion à MongoDB et démarrage du serveur
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT} `);
    });
  } catch (err) {
    console.error('Erreur lors du démarrage du serveur:', err.message);
    process.exit(1);
  }
};

startServer();
