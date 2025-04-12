const User = require('../models/user');
const { hashPassword, comparePassword } = require('../helpers/auth');
const jwt = require('jsonwebtoken');

const test = (req, res) => {
    res.json("Hello from auth controller");
};

const registerUser = async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;

        // Vérification des champs obligatoires
        if (!firstname || !lastname || !email || !password) {
            return res.json({ error: "Tous les champs sont requis." });
        }

        // Vérification de la longueur minimale
        if (password.length < 6) {
            return res.json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.json({
                error: "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)."
            });
        }

        // Vérification si l'email existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ error: "L'email existe déjà" });
        }

        // Hash du mot de passe
        const hashedPassword = await hashPassword(password);

        // Création de l'utilisateur
        const newUser = new User({ firstname, lastname, email, password: hashedPassword, role: "patient" });
        await newUser.save();

        res.status(201).json({ message: "Utilisateur créé avec succès !" });

    } catch (err) {
        console.error("Error in registerUser:", err);
        res.status(500).json({ error: "Server error. Try again later." });
    }
};

// Les autres fonctions restent inchangées
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'No user found with this email' });
        }

        const match = await comparePassword(password, user.password);
        if (!match) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        jwt.sign({ email: user.email, id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, {}, (err, token) => {
            if (err) {
                return res.status(400).json({ error: 'Error creating token' });
            }
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // Secure in production
                maxAge: 3600000
            });
            res.json({ message: "Connexion réussie", token, user });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
};

const getProfile = async (req, res) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ error: 'Token non fourni, veuillez vous connecter' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        return res.status(200).json({ user });
    } catch (err) {
        console.error("Erreur dans getProfile:", err);
        return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
};

const logoutUser = (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true });
    res.json({ message: "Déconnexion réussie" });
};

module.exports = {
    test,
    registerUser,
    loginUser,
    getProfile,
    logoutUser,
};
