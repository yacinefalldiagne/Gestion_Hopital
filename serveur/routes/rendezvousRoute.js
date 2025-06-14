// --- routes/rendezvousRoute.js ---
const express = require('express');
const router = express.Router();
const {
  createRendezvous,
  deleteRendezvous,
  getAllRendezvous,
  getRendezvousById,
  updateRendezvous,
  getRendezvousByPatient,
  getRendezvousByMedecin
} = require('../controllers/rendezvousController');
const { verifyToken, checkRole } = require("../middlewares/authMiddleware");

router.post('/', verifyToken, checkRole('secretaire'), createRendezvous);
router.get('/', verifyToken, getAllRendezvous);
router.get('/details', verifyToken, getRendezvousById);
router.put('/:id', verifyToken, updateRendezvous);
router.delete('/:id', verifyToken, deleteRendezvous);
router.get('/patient/:patientId', verifyToken, getRendezvousByPatient);
router.get('/medecin/:medecinId', verifyToken, checkRole(['medecin']), getRendezvousByMedecin);

module.exports = router;
