const { getDb } = require('../../db/database');

function getSalesReport(req, res) {
  const db = getDb();
  const { period = 'daily', date_from, date_to } = req.query;
  let groupBy, dateFormat;
  if (period === 'daily') { groupBy = "DATE(s.created_at)"; dateFormat = "%Y-%m-%d"; }
  else if (period === 'monthly') { groupBy = "strftime('%Y-%m', s.created_at)"; dateFormat = "%Y-%m"; }
  else { groupBy = "strftime('%Y', s.created_at)"; dateFormat = "%Y"; }
  let where = [`s.status = 'completada'`]; const params = [];
  if (date_from) { where.push(`DATE(s.created_at) >= ?`); params.push(date_from); }
  if (date_to) { where.push(`DATE(s.created_at) <= ?`); params.push(date_to); }
  const data = db.prepare(`
    SELECT ${groupBy} as period, COUNT(*) as transactions, SUM(s.total) as revenue, SUM(s.discount) as discounts, AVG(s.total) as avg_ticket
    FROM sales s WHERE ${where.join(' AND ')} GROUP BY ${groupBy} ORDER BY period DESC
  `).all(params);
  const summary = db.prepare(`SELECT COUNT(*) as total_sales, SUM(total) as total_revenue, AVG(total) as avg_ticket, SUM(discount) as total_discounts FROM sales s WHERE ${where.join(' AND ')}`).get(params);
  return res.json({ success: true, data, summary });
}

function getInventoryReport(req, res) {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.id, p.name, p.code, p.stock, p.min_stock, p.cost_price, p.sale_price,
      (p.stock * p.cost_price) as stock_value, c.name as category,
      CASE WHEN p.stock = 0 THEN 'agotado' WHEN p.stock <= p.min_stock THEN 'bajo' ELSE 'normal' END as status
    FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1 ORDER BY p.stock ASC
  `).all();
  const summary = db.prepare(`SELECT SUM(stock * cost_price) as total_value, SUM(stock * sale_price) as total_sale_value, COUNT(*) as total_products, SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock, SUM(CASE WHEN stock > 0 AND stock <= min_stock THEN 1 ELSE 0 END) as low_stock FROM products WHERE is_active = 1`).get();
  return res.json({ success: true, data: products, summary });
}

function getTopProducts(req, res) {
  const db = getDb();
  const { limit = 10, date_from, date_to } = req.query;
  let where = [`s.status = 'completada'`]; const params = [];
  if (date_from) { where.push(`DATE(s.created_at) >= ?`); params.push(date_from); }
  if (date_to) { where.push(`DATE(s.created_at) <= ?`); params.push(date_to); }
  const products = db.prepare(`
    SELECT p.name, p.code, SUM(si.quantity) as total_sold, SUM(si.subtotal) as total_revenue,
      SUM(si.quantity * p.cost_price) as total_cost, SUM(si.subtotal) - SUM(si.quantity * p.cost_price) as profit
    FROM sale_items si JOIN products p ON si.product_id = p.id JOIN sales s ON si.sale_id = s.id
    WHERE ${where.join(' AND ')} GROUP BY p.id ORDER BY total_sold DESC LIMIT ?
  `).all([...params, parseInt(limit)]);
  return res.json({ success: true, data: products });
}

function getCashReport(req, res) {
  const db = getDb();
  const { date_from, date_to } = req.query;
  let where = ['1=1']; const params = [];
  if (date_from) { where.push(`DATE(opened_at) >= ?`); params.push(date_from); }
  if (date_to) { where.push(`DATE(opened_at) <= ?`); params.push(date_to); }
  const cashes = db.prepare(`SELECT cr.*, u.name as user_name FROM cash_registers cr JOIN users u ON cr.user_id = u.id WHERE ${where.join(' AND ')} ORDER BY opened_at DESC`).all(params);
  return res.json({ success: true, data: cashes });
}

module.exports = { getSalesReport, getInventoryReport, getTopProducts, getCashReport };
