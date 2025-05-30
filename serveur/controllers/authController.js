const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Fonction pour l'inscription
const registerUser = async (req, res) => {
    const { prenom, nom, email, password, role } = req.body;

    console.log('Received user data:', req.body); // Debug incoming data

    if (!prenom || !nom || !email || !password || !role) {
        return res.status(400).json({ message: 'Tous les champs (prenom, nom, email, password, role) sont requis' });
    }

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

        console.log('User before save:', user); // Debug user object
        await user.save();
        console.log('User saved:', user); // Debug saved user

        res.status(201).json({ userId: user.id, role: user.role }); // Return userId without token
    } catch (error) {
        console.error('Erreur dans registerUser:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Fonction pour la connexion
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }

        if (!user.password || !user.password.startsWith('$2')) {
            return res.status(500).json({ message: 'Erreur serveur: mot de passe non haché correctement' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000,
            sameSite: 'strict'
        });

        res.json({ role: user.role }); // No need to send token in body
    } catch (error) {
        console.error('Erreur dans loginUser:', error.message);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Fonction pour récupérer le profil
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json(user);
    } catch (error) {
        console.error('Erreur dans getProfile:', error.message);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Fonction pour la déconnexion
const logoutUser = async (req, res) => {
    try {
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.json({ message: 'Déconnexion réussie' });
    } catch (error) {
        console.error('Erreur dans logoutUser:', error.message);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getProfile,
    logoutUser,
};