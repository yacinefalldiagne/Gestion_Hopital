const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// Test upload route
const testUpload = (req, res) => {
    console.log('Route test-upload appelée');
    res.json({ message: 'Test upload route accessible' });
};

// Upload files
const uploadFiles = (req, res) => {
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
            size: file.size,
        })),
    });
};

// List files
const listFiles = async (req, res) => {
    try {
        const bucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'nondicom_files',
        });
        const files = await bucket.find().toArray();
        res.json(files);
    } catch (err) {
        console.error('Erreur dans listFiles:', err.message);
        res.status(500).json({ message: 'Erreur lors de la récupération des fichiers', error: err.message });
    }
};

// Download file
const downloadFile = (req, res) => {
    try {
        const bucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'nondicom_files',
        });
        const stream = bucket.openDownloadStreamByName(req.params.filename);
        stream.on('error', () => res.status(404).send('Fichier introuvable'));
        stream.pipe(res);
    } catch (err) {
        console.error('Erreur dans downloadFile:', err.message);
        res.status(500).json({ message: 'Erreur lors du téléchargement', error: err.message });
    }
};

// Delete file
const deleteFile = async (req, res) => {
    try {
        const bucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'nondicom_files',
        });
        await bucket.delete(new mongoose.Types.ObjectId(req.params.id));
        res.json({ message: 'Fichier supprimé avec succès' });
    } catch (err) {
        console.error('Erreur dans deleteFile:', err.message);
        res.status(500).json({ message: 'Erreur lors de la suppression du fichier', error: err.message });
    }
};

module.exports = {
    testUpload,
    uploadFiles,
    listFiles,
    downloadFile,
    deleteFile,
};
