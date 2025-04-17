const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connexion à MongoDB
connectDB();

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

// Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));