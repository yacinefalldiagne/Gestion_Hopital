const express = require('express');
const router = express.Router();
const { getPatients, getPatientDetails, createPatient } = require('../controllers/patientController');
const { verifyToken, checkRole } = require("../middlewares/authMiddleware");

router.get('/', verifyToken, getPatients);
router.get('/details', verifyToken, getPatientDetails);
router.post('/', verifyToken, createPatient);

module.exports = router;