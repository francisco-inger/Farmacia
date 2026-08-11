const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'pharmaplus_secret_key_2026';
    const decoded = jwt.verify(token, jwtSecret);
    const db = getDb();
    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.is_active, u.role_id, r.name as role_name
      FROM users u JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Usuario inactivo' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado' });
    }
    return res.status(403).json({ success: false, message: 'Token inválido' });
  }
}

module.exports = { authMiddleware };
