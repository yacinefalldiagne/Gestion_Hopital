// --- routes/reportRoute.js ---
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createReport,
  getReportsByPatient,
  getReportById,
  updateReport,
  deleteReport,
  getReportsByUser
} = require("../controllers/reportController");

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`Report Route: ${req.method} ${req.originalUrl}`);
  console.log('Route params:', req.params);
  next();
});

// ✅ Créer un rapport
router.post("/", verifyToken, createReport);

// ✅ Routes spécifiques (mettre avant les génériques)
router.get("/user/:userId", verifyToken, (req, res, next) => {
  console.log('Route /user/:userId called with userId:', req.params.userId);
  getReportsByUser(req, res, next);
});

router.get("/patient/:userId", verifyToken, getReportsByPatient);

// ✅ Routes génériques par ID (doivent venir après les spécifiques)
router.get("/:reportId", verifyToken, getReportById);
router.put("/:reportId", verifyToken, updateReport);
router.delete("/:reportId", verifyToken, deleteReport);

module.exports = router;