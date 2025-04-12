const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(401).json({ error: "Accès refusé. Token manquant." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Token invalide ou expiré" });
        }
        req.user = decoded;
        next();
    });
};

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Accès interdit. Rôle insuffisant." });
    }
    next();
};

module.exports = { verifyToken, checkRole };
