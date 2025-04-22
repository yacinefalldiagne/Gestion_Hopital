const express = require("express");
const router = express.Router();
const {
    getDossiers,
    createDossier,
    updateDossier,
    deleteDossier,
    getDossiersByPatient,
    deleteDocument,
    getDicomInstances,
    uploadDicom,
    getDicomInstance,
} = require("../controllers/dossierController");
const { verifyToken, checkRole } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, getDossiers);
router.post("/", verifyToken, createDossier);
router.get("/patient", verifyToken, getDossiersByPatient); // Changed to query parameter
router.put("/:id", verifyToken, updateDossier);
router.delete("/:id", verifyToken, deleteDossier);
router.get("/dicom/:patientId", verifyToken, getDicomInstances);
router.post("/upload-dicom", verifyToken, uploadDicom);
router.get("/dicom/:patientId", verifyToken, getDicomInstance);




//router.delete("/document/:dossierId/:documentPath", verifyToken, deleteDocument);

module.exports = router;    