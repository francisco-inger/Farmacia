const { getDb } = require('../../db/database');

function getAll(req, res) {
  const db = getDb();
  const { search, category, low_stock, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1'];
  const params = [];
  if (search) { where.push(`(p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ? OR p.active_ingredient LIKE ?)`); const s = `%${search}%`; params.push(s,s,s,s); }
  if (category) { where.push(`p.category_id = ?`); params.push(category); }
  if (low_stock === 'true') { where.push(`p.stock <= p.min_stock`); }
  const whereStr = where.join(' AND ');
  const products = db.prepare(`
    SELECT p.*, c.name as category_name, c.color as category_color, s.company_name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE ${whereStr} ORDER BY p.name LIMIT ? OFFSET ?
  `).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM products p WHERE ${whereStr}`).get(params).count;
  return res.json({ success: true, data: products, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
}

function getById(req, res) {
  const db = getDb();
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, s.company_name as supplier_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  const batches = db.prepare(`SELECT * FROM product_batches WHERE product_id = ? ORDER BY expiry_date`).all(req.params.id);
  return res.json({ success: true, data: { ...product, batches } });
}

function create(req, res) {
  const db = getDb();
  const { name, code, barcode, category_id, active_ingredient, laboratory, presentation, concentration, cost_price, sale_price, stock, min_stock, max_stock, requires_recipe, is_controlled, supplier_id, notes } = req.body;
  if (!name || !sale_price) return res.status(400).json({ success: false, message: 'Nombre y precio de venta son requeridos' });
  const result = db.prepare(`
    INSERT INTO products (name, code, barcode, category_id, active_ingredient, laboratory, presentation, concentration, cost_price, sale_price, stock, min_stock, max_stock, requires_recipe, is_controlled, supplier_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, code||null, barcode||null, category_id||null, active_ingredient||null, laboratory||null, presentation||null, concentration||null, cost_price||0, sale_price, stock||0, min_stock||5, max_stock||100, requires_recipe||0, is_controlled||0, supplier_id||null, notes||null);
  const newProduct = db.prepare(`SELECT * FROM products WHERE id = ?`).get(result.lastInsertRowid);
  return res.status(201).json({ success: true, message: 'Producto creado exitosamente', data: newProduct });
}

function update(req, res) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  const fields = ['name','code','barcode','category_id','active_ingredient','laboratory','presentation','concentration','cost_price','sale_price','stock','min_stock','max_stock','requires_recipe','is_controlled','supplier_id','notes','is_active'];
  const updates = []; const values = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } });
  if (updates.length === 0) return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(req.params.id);
  db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(values);
  const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
  return res.json({ success: true, message: 'Producto actualizado', data: updated });
}

function remove(req, res) {
  const db = getDb();
  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  db.prepare(`UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);
  return res.json({ success: true, message: 'Producto desactivado' });
}

function getCategories(req, res) {
  const db = getDb();
  const cats = db.prepare(`SELECT c.*, COUNT(p.id) as products_count FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1 GROUP BY c.id ORDER BY c.name`).all();
  return res.json({ success: true, data: cats });
}

function createCategory(req, res) {
  const db = getDb();
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Nombre requerido' });
  const result = db.prepare(`INSERT INTO categories (name, description, color) VALUES (?, ?, ?)`).run(name, description||null, color||'#16a085');
  const cat = db.prepare(`SELECT * FROM categories WHERE id = ?`).get(result.lastInsertRowid);
  return res.status(201).json({ success: true, data: cat });
}

module.exports = { getAll, getById, create, update, remove, getCategories, createCategory };
