const { getDb } = require('../../db/database');

function getAll(req, res) {
  const db = getDb();
  const { is_read, priority, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let where = [`(user_id = ? OR user_id IS NULL)`]; const params = [req.user.id];
  if (is_read !== undefined) { where.push(`is_read = ?`); params.push(parseInt(is_read)); }
  if (priority) { where.push(`priority = ?`); params.push(priority); }
  const notifications = db.prepare(`SELECT * FROM notifications WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all([...params, parseInt(limit), offset]);
  const unreadCount = db.prepare(`SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`).get(req.user.id).count;
  return res.json({ success: true, data: notifications, unread_count: unreadCount });
}

function markAsRead(req, res) {
  const db = getDb();
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL)`).run(req.params.id, req.user.id);
  return res.json({ success: true });
}

function markAllAsRead(req, res) {
  const db = getDb();
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`).run(req.user.id);
  return res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
}

function remove(req, res) {
  const db = getDb();
  db.prepare(`DELETE FROM notifications WHERE id = ? AND (user_id = ? OR user_id IS NULL)`).run(req.params.id, req.user.id);
  return res.json({ success: true });
}

module.exports = { getAll, markAsRead, markAllAsRead, remove };
