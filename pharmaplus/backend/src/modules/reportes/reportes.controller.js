const { getDb } = require('../../db/database');

function getSalesReport(req, res) {
  const db = getDb();
  const { period = 'daily', date_from, date_to, user_id } = req.query;
  let groupBy;
  if (period === 'daily') { groupBy = "DATE(s.created_at)"; }
  else if (period === 'monthly') { groupBy = "strftime('%Y-%m', s.created_at)"; }
  else { groupBy = "strftime('%Y', s.created_at)"; }
  
  let where = [`(s.status = 'completada' OR s.status = 'completado' OR s.status IS NULL)`];
  const params = [];
  if (date_from) { where.push(`DATE(s.created_at) >= ?`); params.push(date_from); }
  if (date_to) { where.push(`DATE(s.created_at) <= ?`); params.push(date_to); }
  if (user_id && user_id !== 'all') { where.push(`s.user_id = ?`); params.push(user_id); }
  
  const whereSql = where.join(' AND ');

  const data = db.prepare(`
    SELECT ${groupBy} as period, COUNT(*) as transactions, COALESCE(SUM(s.total), 0) as revenue, COALESCE(SUM(s.discount), 0) as discounts, COALESCE(AVG(s.total), 0) as avg_ticket
    FROM sales s WHERE ${whereSql} GROUP BY ${groupBy} ORDER BY period ASC
  `).all(params) || [];

  const summary = db.prepare(`
    SELECT COUNT(*) as total_sales, COALESCE(SUM(total), 0) as total_revenue, COALESCE(AVG(total), 0) as avg_ticket, COALESCE(SUM(discount), 0) as total_discounts 
    FROM sales s WHERE ${whereSql}
  `).get(params) || { total_sales: 0, total_revenue: 0, avg_ticket: 0, total_discounts: 0 };

  // Calculate real profit for the selected scope
  const profitData = db.prepare(`
    SELECT COALESCE(SUM(si.subtotal - (si.quantity * COALESCE(p.cost_price, 0))), 0) as total_profit
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN sales s ON si.sale_id = s.id
    WHERE ${whereSql}
  `).get(params) || { total_profit: 0 };

  const totalRevenue = summary.total_revenue || 0;
  const totalProfit = profitData.total_profit || 0;
  const profitMarginPercent = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  // Collaborators list for filtering
  const collaborators = db.prepare(`
    SELECT DISTINCT u.id, u.name, r.name as role_name
    FROM users u
    JOIN sales s ON u.id = s.user_id
    LEFT JOIN roles r ON u.role_id = r.id
    ORDER BY u.name ASC
  `).all() || [];

  return res.json({ 
    success: true, 
    data, 
    summary: {
      ...summary,
      total_profit: totalProfit,
      profit_margin_percent: profitMarginPercent
    },
    collaborators
  });
}

function getInventoryReport(req, res) {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.id, p.name, p.code, p.stock, p.min_stock, p.cost_price, p.sale_price,
      (COALESCE(p.stock, 0) * COALESCE(p.cost_price, 0)) as stock_value, c.name as category,
      CASE WHEN p.stock = 0 THEN 'agotado' WHEN p.stock <= p.min_stock THEN 'bajo' ELSE 'normal' END as status
    FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1 ORDER BY p.stock ASC
  `).all() || [];

  const summary = db.prepare(`
    SELECT COALESCE(SUM(stock * cost_price), 0) as total_value, 
           COALESCE(SUM(stock * sale_price), 0) as total_sale_value, 
           COUNT(*) as total_products, 
           SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock, 
           SUM(CASE WHEN stock > 0 AND stock <= min_stock THEN 1 ELSE 0 END) as low_stock 
    FROM products WHERE is_active = 1
  `).get() || { total_value: 0, total_sale_value: 0, total_products: 0, out_of_stock: 0, low_stock: 0 };

  return res.json({ success: true, data: products, summary });
}

function getTopProducts(req, res) {
  const db = getDb();
  const { limit = 10, date_from, date_to, user_id } = req.query;
  let where = [`(s.status = 'completada' OR s.status = 'completado' OR s.status IS NULL)`]; 
  const params = [];
  if (date_from) { where.push(`DATE(s.created_at) >= ?`); params.push(date_from); }
  if (date_to) { where.push(`DATE(s.created_at) <= ?`); params.push(date_to); }
  if (user_id && user_id !== 'all') { where.push(`s.user_id = ?`); params.push(user_id); }
  
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
  const { date_from, date_to, user_id } = req.query;
  let where = ['1=1']; const params = [];
  if (date_from) { where.push(`DATE(cr.opened_at) >= ?`); params.push(date_from); }
  if (date_to) { where.push(`DATE(cr.opened_at) <= ?`); params.push(date_to); }
  if (user_id && user_id !== 'all') { where.push(`cr.user_id = ?`); params.push(user_id); }
  
  const cashes = db.prepare(`
    SELECT cr.*, u.name as user_name,
      COALESCE(cr.counted_amount, cr.expected_amount, cr.initial_amount) as closed_amount,
      (COALESCE(cr.expected_amount, cr.initial_amount) - cr.initial_amount) as cash_sales
    FROM cash_registers cr 
    JOIN users u ON cr.user_id = u.id 
    WHERE ${where.join(' AND ')} 
    ORDER BY cr.opened_at DESC
  `).all(params) || [];
  return res.json({ success: true, data: cashes });
}

module.exports = { getSalesReport, getInventoryReport, getTopProducts, getCashReport };
