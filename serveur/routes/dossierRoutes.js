const express = require("express");
const router = express.Router();
const cors = require("cors");
const {
    test,
    createDossier,
    getAllDossiers,
    getDossierById,
    updateDossier
} = require('../controllers/dossierController');

router.get('/test', test);
router.post('/createDossier', createDossier);
router.get('/getAllDossiers', getAllDossiers);
router.get('/getDossier/:dossierId', getDossierById);
router.put('/updateDossier/:dossierId', updateDossier);

module.exports = router;