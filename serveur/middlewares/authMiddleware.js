const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.cookies?.authToken;
  if (!token) {
    return res.status(401).json({ message: 'Aucun token, autorisation refusée' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Erreur de vérification du token:', err.message);
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

const checkRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.user.role)) {
    return res.status(403).json({ message: 'Accès interdit. Rôle insuffisant.' });
  }
  next();
};

module.exports = { verifyToken, checkRole };