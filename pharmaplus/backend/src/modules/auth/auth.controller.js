const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../../db/database');

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT u.*, r.name as role_name
    FROM users u JOIN roles r ON u.role_id = r.id
    WHERE u.email = ?
  `).get(email.toLowerCase());

  if (!user) {
    return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
  }
  if (!user.is_active) {
    return res.status(403).json({ success: false, message: 'Usuario inactivo. Contacte al administrador.' });
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    db.prepare(`UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?`).run(user.id);
    return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
  }

  db.prepare(`UPDATE users SET last_login = CURRENT_TIMESTAMP, login_attempts = 0 WHERE id = ?`).run(user.id);

  db.prepare(`
    INSERT INTO audit_log (user_id, user_name, action, module, description, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(user.id, user.name, 'LOGIN', 'auth', `Inicio de sesión exitoso desde ${req.ip}`, req.ip);

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      phone: user.phone,
      avatar: user.avatar,
      last_login: user.last_login,
    },
  });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Contraseñas requeridas' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const db = getDb();
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });

  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const newHash = await bcrypt.hash(newPassword, rounds);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newHash, req.user.id);

  return res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
}

function getProfile(req, res) {
  const db = getDb();
  const user = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.avatar, u.last_login, u.created_at, r.name as role
    FROM users u JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `).get(req.user.id);
  return res.json({ success: true, data: user });
}

function logout(req, res) {
  const db = getDb();
  db.prepare(`
    INSERT INTO audit_log (user_id, user_name, action, module, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, req.user.name, 'LOGOUT', 'auth', 'Cierre de sesión');
  return res.json({ success: true, message: 'Sesión cerrada exitosamente' });
}

module.exports = { login, logout, getProfile, changePassword };
