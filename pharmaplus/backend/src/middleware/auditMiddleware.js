const { getDb } = require('../db/database');

function auditMiddleware(action, module) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (body && body.success !== false && req.user) {
        try {
          const db = getDb();
          db.prepare(`
            INSERT INTO audit_log (user_id, user_name, action, module, description, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            req.user.id,
            req.user.name,
            action,
            module,
            `${action} - ${req.method} ${req.originalUrl}`,
            req.ip || req.connection.remoteAddress
          );
        } catch (e) {
          // Silent fail for audit logging
        }
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { auditMiddleware };
