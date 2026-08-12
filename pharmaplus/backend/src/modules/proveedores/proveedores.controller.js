const { getDb } = require('../../db/database');

function getAll(req, res) {
  const db = getDb();
  const { search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1']; const params = [];
  if (search) { where.push(`(company_name LIKE ? OR rnc LIKE ? OR contact_name LIKE ?)`); const s = `%${search}%`; params.push(s,s,s); }
  const suppliers = db.prepare(`SELECT * FROM suppliers WHERE ${where.join(' AND ')} ORDER BY company_name LIMIT ? OFFSET ?`).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM suppliers WHERE ${where.join(' AND ')}`).get(params).count;
  
  // Attach products to each supplier in the list
  const suppliersWithProducts = suppliers.map(s => {
    const products = db.prepare(`
      SELECT p.id, p.name, p.code, sp.price
      FROM supplier_products sp
      JOIN products p ON sp.product_id = p.id
      WHERE sp.supplier_id = ? AND p.is_active = 1
    `).all(s.id);
    return { ...s, products };
  });

  return res.json({ success: true, data: suppliersWithProducts, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
}

function getById(req, res) {
  const db = getDb();
  const supplier = db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(req.params.id);
  if (!supplier) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
  const purchases = db.prepare(`SELECT id, purchase_number, total, status, order_date FROM purchases WHERE supplier_id = ? ORDER BY order_date DESC LIMIT 10`).all(req.params.id);
  
  // Get products from supplier_products table with custom price
  const products = db.prepare(`
    SELECT p.id, p.name, p.code, p.sale_price, sp.price
    FROM supplier_products sp
    JOIN products p ON sp.product_id = p.id
    WHERE sp.supplier_id = ? AND p.is_active = 1
  `).all(req.params.id);

  const totalPurchased = db.prepare(`SELECT COALESCE(SUM(total),0) as total FROM purchases WHERE supplier_id = ? AND status = 'recibida'`).get(req.params.id);
  return res.json({ success: true, data: { ...supplier, recent_purchases: purchases, products, total_purchased: totalPurchased.total } });
}

function create(req, res) {
  const db = getDb();
  const { company_name, rnc, contact_name, phone, email, address, city, country, type, payment_terms, credit_limit, notes, products } = req.body;
  if (!company_name) return res.status(400).json({ success: false, message: 'Nombre de empresa requerido' });
  
  const result = db.prepare(`INSERT INTO suppliers (company_name, rnc, contact_name, phone, email, address, city, country, type, payment_terms, credit_limit, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(company_name, rnc||null, contact_name||null, phone||null, email||null, address||null, city||'Santo Domingo', country||'República Dominicana', type||'Nacional', payment_terms||30, credit_limit||0, notes||null);
  const supplierId = result.lastInsertRowid;

  // Insert associated products
  if (Array.isArray(products)) {
    const stmt = db.prepare(`INSERT INTO supplier_products (supplier_id, product_id, price) VALUES (?, ?, ?)`);
    products.forEach(p => {
      if (p.product_id && p.price !== undefined) {
        stmt.run(supplierId, p.product_id, p.price);
      }
    });
  }

  return res.status(201).json({ success: true, data: db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(supplierId) });
}

function update(req, res) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
  
  const fields = ['company_name','rnc','contact_name','phone','email','address','city','country','type','payment_terms','credit_limit','is_active','notes'];
  const updates = []; const values = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } });
  updates.push(`updated_at = CURRENT_TIMESTAMP`); values.push(req.params.id);
  db.prepare(`UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`).run(values);

  // Sync associated products
  if (req.body.products !== undefined) {
    db.prepare(`DELETE FROM supplier_products WHERE supplier_id = ?`).run(req.params.id);
    if (Array.isArray(req.body.products)) {
      const stmt = db.prepare(`INSERT INTO supplier_products (supplier_id, product_id, price) VALUES (?, ?, ?)`);
      req.body.products.forEach(p => {
        if (p.product_id && p.price !== undefined) {
          stmt.run(req.params.id, p.product_id, p.price);
        }
      });
    }
  }

  return res.json({ success: true, data: db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(req.params.id) });
}

function remove(req, res) {
  const db = getDb();
  db.prepare(`UPDATE suppliers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);
  return res.json({ success: true, message: 'Proveedor desactivado' });
}

module.exports = { getAll, getById, create, update, remove };
