function errorMiddleware(err, req, res, next) {
  console.error('❌ Error:', err.stack || err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message, errors: err.errors });
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({ success: false, message: 'El registro ya existe o viola una restricción de unicidad' });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Error interno del servidor';

  res.status(status).json({ success: false, message });
}

module.exports = { errorMiddleware };
