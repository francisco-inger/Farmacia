const bcrypt = require('bcryptjs');
const { getDb } = require('../../db/database');

function getAll(req, res) {
  const db = getDb();
  const { search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1']; const params = [];
  if (search) { where.push(`(u.name LIKE ? OR u.email LIKE ?)`); const s = `%${search}%`; params.push(s,s); }
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.is_active, u.last_login, u.created_at, r.name as role, r.id as role_id
    FROM users u JOIN roles r ON u.role_id = r.id
    WHERE ${where.join(' AND ')} ORDER BY u.name LIMIT ? OFFSET ?
  `).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM users u WHERE ${where.join(' AND ')}`).get(params).count;
  return res.json({ success: true, data: users, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
}

function getRoles(req, res) {
  const db = getDb();
  const roles = db.prepare(`SELECT r.*, COUNT(u.id) as users_count FROM roles r LEFT JOIN users u ON r.id = u.role_id GROUP BY r.id`).all();
  return res.json({ success: true, data: roles });
}

async function create(req, res) {
  const db = getDb();
  const { name, email, password, role_id, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son requeridos' });
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email.toLowerCase());
  if (existing) return res.status(409).json({ success: false, message: 'El email ya está registrado' });
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const hash = await bcrypt.hash(password, rounds);
  const result = db.prepare(`INSERT INTO users (name, email, password_hash, role_id, phone) VALUES (?, ?, ?, ?, ?)`).run(name, email.toLowerCase(), hash, role_id||2, phone||null);
  const user = db.prepare(`SELECT u.id, u.name, u.email, u.phone, u.is_active, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`).get(result.lastInsertRowid);
  return res.status(201).json({ success: true, data: user });
}

function update(req, res) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  const fields = ['name','email','phone','role_id','is_active'];
  const updates = []; const values = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } });
  updates.push(`updated_at = CURRENT_TIMESTAMP`); values.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(values);
  return res.json({ success: true, data: db.prepare(`SELECT u.id, u.name, u.email, u.phone, u.is_active, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`).get(req.params.id) });
}

async function resetPassword(req, res) {
  const db = getDb();
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ success: false, message: 'Contraseña mínima de 6 caracteres' });
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const hash = await bcrypt.hash(password, rounds);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(hash, req.params.id);
  return res.json({ success: true, message: 'Contraseña reseteada' });
}

function toggleActive(req, res) {
  const db = getDb();
  const user = db.prepare(`SELECT is_active FROM users WHERE id = ?`).get(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  db.prepare(`UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(user.is_active ? 0 : 1, req.params.id);
  return res.json({ success: true, message: user.is_active ? 'Usuario desactivado' : 'Usuario activado' });
}

module.exports = { getAll, getRoles, create, update, resetPassword, toggleActive };
