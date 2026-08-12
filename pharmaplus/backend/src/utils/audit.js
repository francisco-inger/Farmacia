// utils/audit.js
// Simple helper to log audit records

const { getDb } = require('../db/database');

function logAudit({ userId, userName, action, module, description, referenceId = null, oldValues = null, newValues = null, ipAddress = null }) {
  const db = getDb();
  db.prepare(`
    INSERT INTO audit_log (user_id, user_name, action, module, description, reference_id, old_values, new_values, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    userName,
    action,
    module,
    description,
    referenceId,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null,
    ipAddress
  );
}

module.exports = { logAudit };
