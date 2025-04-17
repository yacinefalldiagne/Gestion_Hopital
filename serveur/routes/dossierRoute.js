const express = require("express");
const router = express.Router();
const {
    getDossiers,
    createDossier,
    updateDossier,
    deleteDossier,
} = require("../controllers/dossierController");
const { verifyToken, checkRole } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, checkRole(["secretaire"]), getDossiers);
router.post("/", verifyToken, checkRole(["secretaire"]), createDossier);
router.put("/:id", verifyToken, checkRole(["secretaire"]), updateDossier);
router.delete("/:id", verifyToken, checkRole(["secretaire"]), deleteDossier);

module.exports = router;