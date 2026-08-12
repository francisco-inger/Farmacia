require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { getDb } = require('./db/database');
const { runMigrations } = require('./db/migrations/001_initial');
const { runIntegracionesMigrations } = require('./db/migrations/002_integraciones');
const { runSupplierProducts } = require('./db/migrations/003_create_supplier_products');
const { runAddSupplierFields } = require('./db/migrations/004_add_supplier_fields');
const { runCleanRoles } = require('./db/migrations/005_clean_roles');
const { up: runLoyaltyFields } = require('./db/migrations/007_add_loyalty_fields');
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
const integracionesRoutes = require('./modules/integraciones/integraciones.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Global Audit Log Middleware for Mutating Requests
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && res.statusCode < 400 && req.user) {
      try {
        const db = getDb();
        const pathParts = req.originalUrl.split('?')[0].split('/');
        const resource = pathParts[2] || 'general';
        let action = '';
        if (req.method === 'POST') action = `CREAR_${resource.toUpperCase()}`;
        else if (req.method === 'PUT' || req.method === 'PATCH') action = `ACTUALIZAR_${resource.toUpperCase()}`;
        else if (req.method === 'DELETE') action = `ELIMINAR_${resource.toUpperCase()}`;

        // Avoid double logging POS sales
        if (!(resource === 'pos' && action === 'CREAR_POS')) {
          db.prepare(`
            INSERT INTO audit_log (user_id, user_name, action, module, description, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            req.user.id,
            req.user.name,
            action,
            resource,
            `Acción exitosa: ${req.method} ${req.originalUrl.split('?')[0]}`,
            req.ip || req.connection.remoteAddress
          );
        }
      } catch (e) {
        console.error('Error logging global audit action:', e);
      }
    }
    return originalJson(body);
  };
  next();
});


const { runPharmacyFields } = require('./db/migrations/006_pharmacy_fields');

// Initialize Database
console.log('📦 Inicializando base de datos...');
try {
  const db = getDb();
  runMigrations();
  
  // Run additional migrations sequentially
  try { runIntegracionesMigrations(); } catch (e) { console.error('⚠️ Error running integraciones migration:', e); }
  try { runSupplierProducts(db); } catch (e) { console.error('⚠️ Error running supplier_products migration:', e); }
  try { runAddSupplierFields(db); } catch (e) { console.error('⚠️ Error running add_supplier_fields migration:', e); }
  try { runCleanRoles(); } catch (e) { console.error('⚠️ Error running clean_roles migration:', e); }
  try { runPharmacyFields(db); } catch (e) { console.error('⚠️ Error running pharmacy_fields migration:', e); }
  try { runLoyaltyFields(db); } catch (e) { console.error('⚠️ Error running loyalty_fields migration:', e); }
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
app.use('/api/productos', productosRoutes);
app.use('/api/inventory', inventarioRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/clients', clientesRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/purchases', comprasRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/suppliers', proveedoresRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/services', serviciosRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/invoices', facturacionRoutes);
app.use('/api/facturacion', facturacionRoutes);
app.use('/api/employees', rrhhRoutes);
app.use('/api/rrhh', rrhhRoutes);
app.use('/api/cash-registers', cajasRoutes);
app.use('/api/cajas', cajasRoutes);
app.use('/api/users', usuariosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/audit', auditoriaRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/reports', reportesRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/notifications', notificacionesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/ai', iaRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/settings', configuracionRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/integrations', integracionesRoutes);
app.use('/api/integraciones', integracionesRoutes);

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
