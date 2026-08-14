function securityHeaders(req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
}

const rateLimitMap = new Map();
function rateLimiter(limit = 120, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const clientData = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
    } else {
      clientData.count++;
    }

    rateLimitMap.set(ip, clientData);

    if (clientData.count > limit) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Por favor intente de nuevo en un momento.'
      });
    }
    next();
  };
}

module.exports = {
  securityHeaders,
  rateLimiter
};