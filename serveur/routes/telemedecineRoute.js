const express = require('express');
const multer = require('multer');
const router = express.Router();
const { sendConsultation, getConsultations, getMessages } = require('../controllers/telemedecineController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Configuration Multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB par fichier
    files: 10 // Maximum 10 fichiers
  },
  fileFilter: (req, file, cb) => {
    console.log('Fichier reçu:', file.originalname, file.mimetype);
    
    // Accepter images et PDF
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non supporté: ${file.mimetype}`), false);
    }
  }
});

// Middleware de debug pour voir ce qui arrive
const debugMiddleware = (req, res, next) => {
  console.log('=== DEBUG MIDDLEWARE ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Body avant parsing:', req.body);
  console.log('Files avant parsing:', req.files);
  console.log('========================');
  next();
};

// Routes avec middlewares dans le bon ordre
router.post('/', 
  debugMiddleware,           // 1. Debug
  verifyToken,              // 2. Authentification
  upload.array('files'),    // 3. Upload fichiers
  (req, res, next) => {     // 4. Middleware final de vérification
    console.log('=== APRÈS MULTER ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files ? req.files.length : 0);
    console.log('User:', req.user ? 'présent' : 'absent');
    console.log('===================');
    next();
  },
  sendConsultation          // 5. Contrôleur final
);

router.get('/consultations', verifyToken, getConsultations);
router.get('/messages/:consultationId', verifyToken, getMessages);

// Gestion d'erreur spécifique pour multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Erreur Multer:', error);
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          message: 'Fichier trop volumineux', 
          debug: 'Taille maximum: 10MB par fichier' 
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          message: 'Trop de fichiers', 
          debug: 'Maximum 10 fichiers autorisés' 
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          message: 'Champ de fichier inattendu', 
          debug: 'Utilisez le champ "files"' 
        });
      default:
        return res.status(400).json({ 
          message: 'Erreur upload', 
          debug: error.message 
        });
    }
  }
  
  if (error.message.includes('Type de fichier non supporté')) {
    return res.status(400).json({ 
      message: 'Type de fichier non supporté', 
      debug: 'Seuls les images et PDF sont acceptés' 
    });
  }
  
  next(error);
});

module.exports = router;