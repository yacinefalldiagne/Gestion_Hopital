const express = require('express');
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createReport,
  getReportsByPatient,
  getReportById,
  updateReport,
  deleteReport,
  getReportsByDoctor

} = require('../controllers/reportController');

// Route to create a new appointment
router.post('/', verifyToken, createReport);
router.get('/:id', verifyToken, getReportById);
router.get('/user/:userId', verifyToken, getReportsByPatient);
router.put('/:id', verifyToken, updateReport);
router.delete('/:id', verifyToken, deleteReport);
router.get('/doctor', verifyToken, getReportsByDoctor); // Nouvelle route


module.exports = router;