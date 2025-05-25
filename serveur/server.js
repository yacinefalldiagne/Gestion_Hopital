const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/message'); // Ajouter le modèle Message

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
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
app.use('/api/reports', require('./routes/reportRoute'));
app.use('/api/dashboard', require('./routes/dashboardRoute'));
app.use('/api/telemedecine', require('./routes/telemedecineRoute'));

// Gestion des fichiers GridFS
let gfs;
mongoose.connection.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
});

app.get('/api/files/:fileId', (req, res) => {
  try {
    if (!gfs) {
      return res.status(500).json({ message: 'GridFS non initialisé.' });
    }
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const downloadStream = gfs.openDownloadStream(fileId);
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error.message);
    res.status(404).json({ message: 'Fichier non trouvé.' });
  }
});

// WebSocket pour la discussion
io.on('connection', (socket) => {
  console.log('Un utilisateur s’est connecté:', socket.id);

  socket.on('joinConsultation', (consultationId) => {
    socket.join(consultationId);
    console.log(`Utilisateur ${socket.id} a rejoint la consultation ${consultationId}`);
  });

  socket.on('sendMessage', async ({ consultationId, senderId, message }) => {
    try {
      const newMessage = new Message({ consultationId, senderId, message });
      await newMessage.save();
      io.to(consultationId).emit('newMessage', { senderId, message, timestamp: new Date() });
    } catch (err) {
      console.error('Erreur lors de l’enregistrement du message:', err.message);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`Utilisateur déconnecté: ${socket.id}, raison: ${reason}`);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  } catch (err) {
    console.error('Erreur lors du démarrage du serveur:', err.message);
    process.exit(1);
  }
};

startServer();