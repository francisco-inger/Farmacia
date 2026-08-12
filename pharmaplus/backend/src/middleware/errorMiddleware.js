const { getDb } = require('../db/database');

function errorMiddleware(err, req, res, next) {
  console.error('❌ Error:', err.stack || err.message);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  // Log error to audit log database
  try {
    const db = getDb();
    const userId = req.user ? req.user.id : 0;
    const userName = req.user ? req.user.name : 'Sistema/Anónimo';
    const action = 'ERROR_SISTEMA';
    const pathParts = req.originalUrl.split('?')[0].split('/');
    const moduleName = pathParts[2] || 'general';
    const description = `Error ${status}: ${err.message || message} - ${req.method} ${req.originalUrl}`;
    
    db.prepare(`
      INSERT INTO audit_log (user_id, user_name, action, module, description, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      userName,
      action,
      moduleName,
      description,
      req.ip || req.connection.remoteAddress
    );
  } catch (e) {
    console.error('Failed to log error to audit log:', e);
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message, errors: err.errors });
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({ success: false, message: 'El registro ya existe o viola una restricción de unicidad' });
  }

  res.status(status).json({ success: false, message: status < 500 ? message : 'Error interno del servidor' });
}

module.exports = { errorMiddleware };
