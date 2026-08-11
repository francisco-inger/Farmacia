const { getDb } = require('../../db/database');

function getAll(req, res) {
  const db = getDb();
  const { module, action, user_id, date_from, date_to, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1']; const params = [];
  if (module) { where.push(`module = ?`); params.push(module); }
  if (action) { where.push(`action LIKE ?`); params.push(`%${action}%`); }
  if (user_id) { where.push(`user_id = ?`); params.push(user_id); }
  if (date_from) { where.push(`DATE(created_at) >= ?`); params.push(date_from); }
  if (date_to) { where.push(`DATE(created_at) <= ?`); params.push(date_to); }
  const logs = db.prepare(`SELECT * FROM audit_log WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM audit_log WHERE ${where.join(' AND ')}`).get(params).count;
  return res.json({ success: true, data: logs, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
}

function getModules(req, res) {
  const db = getDb();
  const modules = db.prepare(`SELECT DISTINCT module FROM audit_log ORDER BY module`).all();
  return res.json({ success: true, data: modules.map(m => m.module) });
}

module.exports = { getAll, getModules };
