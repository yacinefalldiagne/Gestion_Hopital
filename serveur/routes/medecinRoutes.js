
const express = require('express');
const router = express.Router();
const { getMedecins, getMedecinDetails, createMedecin } = require('../controllers/medecinController');
const { verifyToken, checkRole } = require("../middlewares/authMiddleware");

router.get('/', verifyToken, getMedecins);
router.get('/details', verifyToken, getMedecinDetails);
router.post('/', verifyToken, checkRole('secretaire'), createMedecin);
module.exports = router;