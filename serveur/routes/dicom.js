const express = require('express');
   const router = express.Router();
   const auth = require('../middleware/auth');
   const axios = require('axios');
   const multer = require('multer');
   const FormData = require('form-data');

   // Configuration Multer pour gérer les fichiers DICOM
   const upload = multer({ storage: multer.memoryStorage() });

   // URL et authentification Orthanc
   const ORTHANC_URL = 'http://localhost:8042';
   const ORTHANC_AUTH = {
     username: 'medecin',
     password: 'password123',
   };

   // Uploader une image DICOM vers Orthanc
   router.post('/upload', auth, upload.array('files', 10), async (req, res) => {
     try {
       console.log('Requête POST /dicom/upload reçue - Fichiers:', req.files);
       if (!req.files || req.files.length === 0) {
         return res.status(400).json({ message: 'Aucun fichier fourni' });
       }

       const uploadedFiles = [];
       for (const file of req.files) {
         console.log('Traitement du fichier:', file.originalname, 'Taille:', file.size, 'Type:', file.mimetype);
         const formData = new FormData();
         formData.append('file', file.buffer, {
           filename: file.originalname,
           contentType: file.mimetype || 'application/dicom',
         });

         console.log('Envoi vers Orthanc:', `${ORTHANC_URL}/instances`);
         const response = await axios.post(`${ORTHANC_URL}/instances`, formData, {
           auth: ORTHANC_AUTH,
           headers: {
             ...formData.getHeaders(),
             'Content-Type': 'multipart/form-data',
           },
         }).catch(error => {
           console.error('Erreur Axios:', error.response?.status, error.response?.data);
           throw error;
         });

         console.log('Réponse Orthanc:', response.data);
         uploadedFiles.push({
           instanceId: response.data.ID,
           filename: file.originalname,
         });
       }

       res.json({ message: 'Fichiers DICOM uploadés avec succès', files: uploadedFiles });
     } catch (error) {
       console.error('Erreur lors de l\'upload vers Orthanc:', error.message, error.stack);
       const status = error.response?.status || 500;
       const errorMessage = error.response?.data?.Message || error.message || 'Erreur lors de l\'upload';
       res.status(status).json({ message: 'Erreur lors de l\'upload des fichiers DICOM', error: errorMessage });
     }
   });

   // Lister les images DICOM
   router.get('/files', auth, async (req, res) => {
     try {
       console.log('Requête GET /dicom/files reçue');
       const response = await axios.get(`${ORTHANC_URL}/instances`, { auth: ORTHANC_AUTH });
       const instances = response.data;

       const files = await Promise.all(
         instances.map(async (instanceId) => {
           const instanceDetails = await axios.get(`${ORTHANC_URL}/instances/${instanceId}`, {
             auth: ORTHANC_AUTH,
           });
           return {
             instanceId,
             filename: instanceDetails.data.MainDicomTags.SeriesDescription || `DICOM_${instanceId}`,
             patientId: instanceDetails.data.MainDicomTags.PatientID || 'N/A',
           };
         })
       );

       res.json(files);
     } catch (error) {
       console.error('Erreur lors de la récupération des fichiers DICOM:', error.message);
       res.status(500).json({ message: 'Erreur lors de la récupération des fichiers DICOM', error: error.message });
     }
   });

   // Télécharger une image DICOM
   router.get('/download/:instanceId', auth, async (req, res) => {
     try {
       const { instanceId } = req.params;
       console.log('Requête GET /dicom/download/', instanceId);
       const response = await axios.get(`${ORTHANC_URL}/instances/${instanceId}/file`, {
         auth: ORTHANC_AUTH,
         responseType: 'arraybuffer',
       });

       res.set({
         'Content-Type': 'application/dicom',
         'Content-Disposition': `attachment; filename="${instanceId}.dcm"`,
       });
       res.send(response.data);
     } catch (error) {
       console.error('Erreur lors du téléchargement:', error.message, error.response?.status);
       res.status(500).json({ message: 'Erreur lors du téléchargement du fichier DICOM', error: error.message });
     }
   });

   // Supprimer une image DICOM
   router.delete('/files/:instanceId', auth, async (req, res) => {
     try {
       const { instanceId } = req.params;
       console.log('Requête DELETE /dicom/files/', instanceId);
       await axios.delete(`${ORTHANC_URL}/instances/${instanceId}`, { auth: ORTHANC_AUTH });
       res.json({ message: 'Fichier DICOM supprimé avec succès' });
     } catch (error) {
       console.error('Erreur lors de la suppression:', error.message, error.response?.status);
       res.status(500).json({ message: 'Erreur lors de la suppression du fichier DICOM', error: error.message });
     }
   });

   module.exports = router;