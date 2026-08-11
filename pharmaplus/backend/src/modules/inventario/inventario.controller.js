const { getDb } = require('../../db/database');

function getInventory(req, res) {
  const db = getDb();
  const { filter, search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = [`p.is_active = 1`]; const params = [];
  if (search) { where.push(`(p.name LIKE ? OR p.code LIKE ?)`); const s = `%${search}%`; params.push(s, s); }
  if (filter === 'low') { where.push(`p.stock <= p.min_stock AND p.stock > 0`); }
  else if (filter === 'out') { where.push(`p.stock = 0`); }
  else if (filter === 'expiring') { where.push(`EXISTS (SELECT 1 FROM product_batches pb WHERE pb.product_id = p.id AND pb.expiry_date <= DATE('now', '+30 days') AND pb.expiry_date >= DATE('now'))`); }
  const whereStr = where.join(' AND ');
  const items = db.prepare(`
    SELECT p.id, p.name, p.code, p.stock, p.min_stock, p.max_stock, p.cost_price, p.sale_price, c.name as category,
      (SELECT pb.expiry_date FROM product_batches pb WHERE pb.product_id = p.id ORDER BY pb.expiry_date ASC LIMIT 1) as nearest_expiry,
      CASE WHEN p.stock = 0 THEN 'agotado' WHEN p.stock <= p.min_stock THEN 'bajo' ELSE 'normal' END as status
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE ${whereStr} ORDER BY p.name LIMIT ? OFFSET ?
  `).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM products p WHERE ${whereStr}`).get(params).count;
  const summary = db.prepare(`
    SELECT COUNT(*) as total, SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
      SUM(CASE WHEN stock > 0 AND stock <= min_stock THEN 1 ELSE 0 END) as low_stock,
      SUM(stock * cost_price) as inventory_value
    FROM products WHERE is_active = 1
  `).get();
  return res.json({ success: true, data: items, summary, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
}

function getMovements(req, res) {
  const db = getDb();
  const { product_id, type, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1']; const params = [];
  if (product_id) { where.push(`im.product_id = ?`); params.push(product_id); }
  if (type) { where.push(`im.movement_type = ?`); params.push(type); }
  const movements = db.prepare(`
    SELECT im.*, p.name as product_name, p.code, u.name as user_name
    FROM inventory_movements im JOIN products p ON im.product_id = p.id LEFT JOIN users u ON im.user_id = u.id
    WHERE ${where.join(' AND ')} ORDER BY im.created_at DESC LIMIT ? OFFSET ?
  `).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM inventory_movements im WHERE ${where.join(' AND ')}`).get(params).count;
  return res.json({ success: true, data: movements, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
}

function createAdjustment(req, res) {
  const db = getDb();
  const { product_id, quantity, notes, type = 'ajuste' } = req.body;
  if (!product_id || quantity === undefined) return res.status(400).json({ success: false, message: 'Producto y cantidad requeridos' });
  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(product_id);
  if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  const newStock = product.stock + parseInt(quantity);
  if (newStock < 0) return res.status(400).json({ success: false, message: 'Stock resultante no puede ser negativo' });
  db.prepare(`UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newStock, product_id);
  db.prepare(`
    INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, notes, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(product_id, type, quantity, product.stock, newStock, notes||null, req.user.id);
  return res.json({ success: true, message: 'Ajuste realizado exitosamente', data: { previous_stock: product.stock, new_stock: newStock } });
}

function getExpiring(req, res) {
  const db = getDb();
  const days = req.query.days || 30;
  const items = db.prepare(`
    SELECT pb.*, p.name as product_name, p.code,
      CAST(julianday(pb.expiry_date) - julianday('now') AS INTEGER) as days_left
    FROM product_batches pb JOIN products p ON pb.product_id = p.id
    WHERE pb.expiry_date <= DATE('now', '+${days} days') AND pb.quantity > 0
    ORDER BY pb.expiry_date ASC
  `).all();
  return res.json({ success: true, data: items });
}

module.exports = { getInventory, getMovements, createAdjustment, getExpiring };
