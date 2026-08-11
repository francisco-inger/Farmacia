function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`,
      });
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

module.exports = { requireRole, requireAdmin };
