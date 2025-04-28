const express = require('express');
const router = express.Router();
const { createRendezvous, deleteRendezvous, getAllRendezvous, getRendezvousById, updateRendezvous, getRendezvousByPatient, getRendezvousByMedecin } = require('../controllers/rendezvousController');
const { verifyToken, checkRole } = require("../middlewares/authMiddleware");

// Route to create a new appointment
router.post('/', verifyToken, checkRole('secretaire'), createRendezvous);
router.get('/', verifyToken, getAllRendezvous); // Route to get all appointments
router.get('/details', verifyToken, getRendezvousById); // Route to get appointment details
router.put('/:id', verifyToken, updateRendezvous); // Route to update an appointment
router.delete('/:id', verifyToken, deleteRendezvous); // Route to delete an appointment
router.get('/patient/:patientId', verifyToken, getRendezvousByPatient); // Route to get appointments by patient ID
router.get('/medecin/:medecinId', verifyToken, checkRole(['medecin']), getRendezvousByMedecin);
module.exports = router;