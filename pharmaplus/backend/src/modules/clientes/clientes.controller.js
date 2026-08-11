const { getDb } = require('../../db/database');

// ─── CLIENTES ────────────────────────────────────────────────────────────────
function getAll(req, res) {
  const db = getDb();
  const { search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = [`is_active = 1`]; const params = [];
  if (search) { where.push(`(name LIKE ? OR cedula LIKE ? OR phone LIKE ? OR email LIKE ?)`); const s = `%${search}%`; params.push(s,s,s,s); }
  const clients = db.prepare(`SELECT * FROM clients WHERE ${where.join(' AND ')} ORDER BY name LIMIT ? OFFSET ?`).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM clients WHERE ${where.join(' AND ')}`).get(params).count;
  return res.json({ success: true, data: clients, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
}

function getById(req, res) {
  const db = getDb();
  const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(req.params.id);
  if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
  const sales = db.prepare(`SELECT id, sale_number, total, status, created_at FROM sales WHERE client_id = ? ORDER BY created_at DESC LIMIT 10`).all(req.params.id);
  const recipes = db.prepare(`SELECT * FROM recipes WHERE client_id = ? ORDER BY created_at DESC LIMIT 5`).all(req.params.id);
  const totalSpent = db.prepare(`SELECT COALESCE(SUM(total),0) as total FROM sales WHERE client_id = ? AND status = 'completada'`).get(req.params.id);
  return res.json({ success: true, data: { ...client, recent_sales: sales, recent_recipes: recipes, total_spent: totalSpent.total } });
}

function create(req, res) {
  const db = getDb();
  const { name, cedula, phone, email, address, birth_date, notes } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Nombre requerido' });
  const result = db.prepare(`INSERT INTO clients (name, cedula, phone, email, address, birth_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(name, cedula||null, phone||null, email||null, address||null, birth_date||null, notes||null);
  const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(result.lastInsertRowid);
  return res.status(201).json({ success: true, data: client });
}

function update(req, res) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
  const fields = ['name','cedula','phone','email','address','birth_date','notes','is_active'];
  const updates = []; const values = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } });
  updates.push(`updated_at = CURRENT_TIMESTAMP`); values.push(req.params.id);
  db.prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`).run(values);
  return res.json({ success: true, data: db.prepare(`SELECT * FROM clients WHERE id = ?`).get(req.params.id) });
}

function remove(req, res) {
  const db = getDb();
  db.prepare(`UPDATE clients SET is_active = 0 WHERE id = ?`).run(req.params.id);
  return res.json({ success: true, message: 'Cliente desactivado' });
}

module.exports = { getAll, getById, create, update, remove };
