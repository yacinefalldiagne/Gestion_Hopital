const express = require("express");
const router = express.Router();
const cors = require("cors");
const { registerUser, loginUser, getProfile, logoutUser } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Middleware CORS
router.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-auth-token'],
  })
);

// Routes publiques
router.post("/register", registerUser);
router.post("/login", loginUser);

// Routes protégées (nécessitent d'être connecté)
router.get("/me", verifyToken, (req, res) => {
  res.json({ id: req.user.user.id });
});
router.get("/profile", verifyToken, getProfile);
router.post("/logout", verifyToken, logoutUser);

module.exports = router;