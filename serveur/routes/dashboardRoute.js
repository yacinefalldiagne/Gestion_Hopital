const express = require('express');
const router = express.Router();
const { getDashboardSecretaire, getDashboardMedecin, getDashboardPatient } = require('../controllers/dashboardController');

router.get('/secretaire', getDashboardSecretaire);
router.get('/medecin', getDashboardMedecin);
router.get('/patient', getDashboardPatient);

module.exports = router;