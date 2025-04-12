const express = require("express");
const router = express.Router();
const cors = require("cors");
const { test, registerUser, loginUser, getProfile, logoutUser } = require("../controllers/authController");

const { verifyToken, checkRole } = require("../middlewares/authMiddleware");

// Middleware CORS
router.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

// Routes publiques
router.get("/test", test); // Renommé pour éviter confusion avec la racine "/"
// Routes classiques
router.get("/", test);

// Routes publiques

router.post("/register", registerUser);
router.post("/login", loginUser);

// Routes protégées (nécessitent d'être connecté)
router.get("/profile", verifyToken, getProfile); // Ajout de verifyToken pour sécuriser
router.post("/logout", verifyToken, logoutUser);

// Routes spécifiques aux rôles
router.get("/patient", verifyToken, checkRole(["patient"]), (req, res) => {
    res.json({ message: "Bienvenue, patient !" });
});

router.get("/secretaire", verifyToken, checkRole(["secretaire"]), (req, res) => {
    res.json({ message: "Bienvenue, secretaire !" });
});
router.get("/medecin", verifyToken, checkRole(["medecin"]), (req, res) => {
    res.json({ message: "Bienvenue, medecin !" });
});

module.exports = router;