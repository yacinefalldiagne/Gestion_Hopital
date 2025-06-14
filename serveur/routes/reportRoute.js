const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createReport,
  getReportsByPatient,
  getReportById,
  updateReport,
  deleteReport,
  getAllReports,
  getReportsByUser, // Ajouter cette importation
} = require('../controllers/reportController');

// Route to get all reports
router.get('/', verifyToken, getAllReports);

// Route to create a new report
router.post('/', verifyToken, createReport);

// Route to get reports by user (doctor) - Utiliser getReportsByUser
router.get('/user/:userId', verifyToken, getReportsByUser);

// Route to get reports by patient
router.get('/patient/:userId', verifyToken, getReportsByPatient);

// Other routes
router.get('/:id', verifyToken, getReportById);
router.put('/:id', verifyToken, updateReport);
router.delete('/:id', verifyToken, deleteReport);

module.exports = router;