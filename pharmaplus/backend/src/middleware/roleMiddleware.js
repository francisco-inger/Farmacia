/**
 * Middleware de roles — PharmaPlus
 *
 * Solo existen dos roles: 'Administrador' y 'Cajero'
 * El Cajero únicamente tiene acceso al POS y a las Cajas.
 * Todas las demás rutas requieren rol Administrador.
 */

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const userRole = (req.user.role_name || req.user.role || '').toLowerCase();
    const normalizedUserRole = userRole === 'administrador' ? 'admin' : userRole;
    const allowed = roles.map(r => {
      const lr = r.toLowerCase();
      return lr === 'administrador' ? 'admin' : lr;
    });
    if (allowed.includes(normalizedUserRole)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`,
    });
  };
}

/**
 * Solo Administrador puede acceder.
 * El Cajero recibirá 403.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }
  const role = (req.user.role_name || req.user.role || '').toLowerCase();
  if (role === 'administrador' || role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Acceso denegado. Se requiere rol de Administrador.',
  });
}

/**
 * Administrador y Cajero pueden acceder (rutas compartidas: POS, Cajas).
 */
function requireCajeroOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }
  const role = (req.user.role_name || req.user.role || '').toLowerCase();
  if (role === 'administrador' || role === 'admin' || role === 'cajero') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Acceso denegado.' });
}

module.exports = { requireRole, requireAdmin, requireCajeroOrAdmin };
