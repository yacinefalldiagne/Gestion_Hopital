const express = require('express');
const router = express.Router();
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
const auth = require('../middlewares/authMiddleware');
const {
    testUpload,
    uploadFiles,
    listFiles,
    downloadFile,
    deleteFile,
} = require('../controllers/fileController');

// Multer storage config
const storage = new GridFsStorage({
    url: process.env.MONGO_URI,
    file: (req, file) => {
        console.log('Fichier reçu:', file.originalname);
        return {
            bucketName: 'nondicom_files',
            filename: `${Date.now()}_${file.originalname} `,
            metadata: {
                uploadedBy: req.user ? req.user.id : 'guest',
                uploadDate: new Date(),
            },
        };
    },
});

const upload = multer({ storage });

// Routes
router.post('/test-upload', testUpload);
router.post('/upload', auth, upload.array('files', 10), uploadFiles);
router.get('/files', listFiles);
router.get('/download/:filename', downloadFile);
router.delete('/files/:id', deleteFile);

module.exports = router;
