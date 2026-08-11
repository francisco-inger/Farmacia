const { getDb } = require('../../db/database');

function getAll(req, res) {
  const db = getDb();
  const { search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1']; const params = [];
  if (search) { where.push(`(company_name LIKE ? OR rnc LIKE ? OR contact_name LIKE ?)`); const s = `%${search}%`; params.push(s,s,s); }
  const suppliers = db.prepare(`SELECT * FROM suppliers WHERE ${where.join(' AND ')} ORDER BY company_name LIMIT ? OFFSET ?`).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM suppliers WHERE ${where.join(' AND ')}`).get(params).count;
  return res.json({ success: true, data: suppliers, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
}

function getById(req, res) {
  const db = getDb();
  const supplier = db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(req.params.id);
  if (!supplier) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
  const purchases = db.prepare(`SELECT id, purchase_number, total, status, order_date FROM purchases WHERE supplier_id = ? ORDER BY order_date DESC LIMIT 10`).all(req.params.id);
  const products = db.prepare(`SELECT id, name, code, cost_price, sale_price FROM products WHERE supplier_id = ? AND is_active = 1 LIMIT 20`).all(req.params.id);
  const totalPurchased = db.prepare(`SELECT COALESCE(SUM(total),0) as total FROM purchases WHERE supplier_id = ? AND status = 'recibida'`).get(req.params.id);
  return res.json({ success: true, data: { ...supplier, recent_purchases: purchases, products, total_purchased: totalPurchased.total } });
}

function create(req, res) {
  const db = getDb();
  const { company_name, rnc, contact_name, phone, email, address, payment_terms, credit_limit, notes } = req.body;
  if (!company_name) return res.status(400).json({ success: false, message: 'Nombre de empresa requerido' });
  const result = db.prepare(`INSERT INTO suppliers (company_name, rnc, contact_name, phone, email, address, payment_terms, credit_limit, notes) VALUES (?,?,?,?,?,?,?,?,?)`).run(company_name, rnc||null, contact_name||null, phone||null, email||null, address||null, payment_terms||30, credit_limit||0, notes||null);
  return res.status(201).json({ success: true, data: db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(result.lastInsertRowid) });
}

function update(req, res) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
  const fields = ['company_name','rnc','contact_name','phone','email','address','payment_terms','credit_limit','is_active','notes'];
  const updates = []; const values = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } });
  updates.push(`updated_at = CURRENT_TIMESTAMP`); values.push(req.params.id);
  db.prepare(`UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`).run(values);
  return res.json({ success: true, data: db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(req.params.id) });
}

function remove(req, res) {
  const db = getDb();
  db.prepare(`UPDATE suppliers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);
  return res.json({ success: true, message: 'Proveedor desactivado' });
}

module.exports = { getAll, getById, create, update, remove };
