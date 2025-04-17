const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Route pour l'inscription
router.post('/register', async (req, res) => {
  if (!req.body) {
    console.log('Erreur: Aucun corps de requête fourni pour /register');
    return res.status(400).json({ message: 'Aucun corps de requête fourni' });
  }

  const { prenom, nom, email, password, role } = req.body;

  // Validation des champs requis
  if (!prenom || !nom || !email || !password || !role) {
    return res.status(400).json({ message: 'Tous les champs (prenom, nom, email, password, role) sont requis' });
  }

  // Validation du rôle
  const validRoles = ['patient', 'medecin', 'secretaire'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Le rôle doit être patient, medecin ou secretaire' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    user = new User({
      prenom,
      nom,
      email,
      password,
      role,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, role });
  } catch (error) {
    console.error('Erreur dans la route /register:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour la connexion
router.post('/login', async (req, res) => {
  if (!req.body) {
    console.log('Erreur: Aucun corps de requête fourni pour /login');
    return res.status(400).json({ message: 'Aucun corps de requête fourni' });
  }

  const { email, password } = req.body;

  try {
    console.log('Requête de connexion reçue:', { email, password });

    if (!email || !password) {
      console.log('Email ou mot de passe manquant');
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    console.log('Recherche de l’utilisateur dans la base de données');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }
    console.log('Utilisateur trouvé:', user);

    // Vérifier si le mot de passe est haché
    if (!user.password || !user.password.startsWith('$2')) {
      console.log('Mot de passe non haché ou invalide');
      return res.status(500).json({ message: 'Erreur serveur: mot de passe non haché correctement' });
    }

    console.log('Comparaison du mot de passe avec bcrypt');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Mot de passe incorrect');
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }
    console.log('Mot de passe correct');

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    console.log('Génération du token JWT');
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
    console.log('Token généré avec succès');

    res.json({ token, role: user.role });
  } catch (error) {
    console.error('Erreur dans la route /login:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour récupérer les informations de l'utilisateur connecté
router.get('/me', async (req, res) => {
  try {
    console.log('Requête reçue pour /me');
    // Récupérer le token depuis l'en-tête
    const token = req.header('x-auth-token');
    if (!token) {
      console.log('Aucun token fourni');
      return res.status(401).json({ message: 'Aucun token, autorisation refusée' });
    }

    console.log('Vérification du token JWT');
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token vérifié:', decoded);

    console.log('Recherche de l’utilisateur dans la base de données');
    // Récupérer l'utilisateur à partir de l'ID dans le token
    const user = await User.findById(decoded.user.id).select('-password');
    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    console.log('Utilisateur trouvé:', user);

    res.json(user);
  } catch (error) {
    console.error('Erreur dans la route /me:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;