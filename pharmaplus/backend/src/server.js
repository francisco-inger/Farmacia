require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { getDb } = require('./db/database');
const { runMigrations } = require('./db/migrations/001_initial');
const { runSeed } = require('./db/seed');
const { errorMiddleware } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const productosRoutes = require('./modules/productos/productos.routes');
const inventarioRoutes = require('./modules/inventario/inventario.routes');
const clientesRoutes = require('./modules/clientes/clientes.routes');
const posRoutes = require('./modules/pos/pos.routes');
const comprasRoutes = require('./modules/compras/compras.routes');
const proveedoresRoutes = require('./modules/proveedores/proveedores.routes');
const recetasRoutes = require('./modules/recetas/recetas.routes');
const serviciosRoutes = require('./modules/servicios/servicios.routes');
const facturacionRoutes = require('./modules/facturacion/facturacion.routes');
const rrhhRoutes = require('./modules/rrhh/rrhh.routes');
const cajasRoutes = require('./modules/cajas/cajas.routes');
const usuariosRoutes = require('./modules/usuarios/usuarios.routes');
const auditoriaRoutes = require('./modules/auditoria/auditoria.routes');
const reportesRoutes = require('./modules/reportes/reportes.routes');
const notificacionesRoutes = require('./modules/notificaciones/notificaciones.routes');
const iaRoutes = require('./modules/ia/ia.routes');
const configuracionRoutes = require('./modules/configuracion/configuracion.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const { runIntegracionesMigrations } = require('./db/migrations/002_integraciones');
const integracionesRoutes = require('./modules/integraciones/integraciones.routes');

// Initialize Database
console.log('📦 Inicializando base de datos...');
try {
  const db = getDb();
  runMigrations();
  runIntegracionesMigrations();
  // Check if users exist, if not, run seed
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('🌱 No se encontraron usuarios. Ejecutando seed...');
    runSeed().catch(console.error);
  }
} catch (error) {
  console.error('❌ Error inicializando DB:', error);
  process.exit(1);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productosRoutes);
app.use('/api/inventory', inventarioRoutes);
app.use('/api/clients', clientesRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/purchases', comprasRoutes);
app.use('/api/suppliers', proveedoresRoutes);
app.use('/api/recipes', recetasRoutes);
app.use('/api/services', serviciosRoutes);
app.use('/api/invoices', facturacionRoutes);
app.use('/api/employees', rrhhRoutes);
app.use('/api/cash-registers', cajasRoutes);
app.use('/api/users', usuariosRoutes);
app.use('/api/audit', auditoriaRoutes);
app.use('/api/reports', reportesRoutes);
app.use('/api/notifications', notificacionesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/ai', iaRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/settings', configuracionRoutes);
app.use('/api/integraciones', integracionesRoutes);
app.use('/api/integrations', integracionesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'PharmaPlus API is running', timestamp: new Date() });
});

// Error handling middleware
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PharmaPlus Backend corriendo en http://localhost:${PORT}`);
  console.log(`   Verifique variables de entorno en .env`);
});
