const fs = require('fs');
const path = require('path');
const { getDb } = require('./database');
const { runMigrations } = require('./migrations/001_initial');
const { runIntegracionesMigrations } = require('./migrations/002_integraciones');
const { runSupplierProducts } = require('./migrations/003_create_supplier_products');
const { runAddSupplierFields } = require('./migrations/004_add_supplier_fields');
const { runCleanRoles } = require('./migrations/005_clean_roles');
const { runPharmacyFields } = require('./migrations/006_pharmacy_fields');
const { runLoyaltyFields } = require('./migrations/007_add_loyalty_fields');
const { runEmployeeFields } = require('./migrations/008_employee_fields');

async function importDatabase() {
  const db = getDb();
  console.log('🔄 Iniciando sincronización e importación de datos PharmaPlus...');

  const snapshotsDir = path.join(__dirname, 'snapshots');
  const jsonPath = path.join(snapshotsDir, 'pharmaplus_data.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ No se encontró el archivo de snapshot en: ${jsonPath}`);
    console.log('👉 Ejecuta primero "npm run db:export" o haz "git pull" para obtener los datos.');
    process.exit(1);
  }

  // 1. Asegurar migraciones
  console.log('📦 Verificando estructura y migraciones...');
  try {
    runMigrations();
    try { runIntegracionesMigrations(); } catch (e) {}
    try { runSupplierProducts(db); } catch (e) {}
    try { runAddSupplierFields(db); } catch (e) {}
    try { runCleanRoles(); } catch (e) {}
    try { runPharmacyFields(db); } catch (e) {}
    try { runLoyaltyFields(db); } catch (e) {}
    try { runEmployeeFields(db); } catch (e) {}
  } catch (err) {
    console.warn('⚠️ Nota sobre migraciones:', err.message);
  }

  // 2. Cargar snapshot
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const snapshot = JSON.parse(content);
  const tables = snapshot.tables || {};

  console.log(`📅 Fecha del snapshot: ${snapshot.exported_at}`);

  // 3. Desactivar llaves foráneas temporalmente durante la carga
  db.pragma('foreign_keys = OFF');

  const transaction = db.transaction(() => {
    const tableKeys = Object.keys(tables);

    for (const table of tableKeys) {
      const rows = tables[table];
      if (!rows || rows.length === 0) continue;

      // Limpiar tabla existente
      try {
        db.prepare(`DELETE FROM "${table}"`).run();
      } catch (e) {
        continue;
      }

      // Obtener columnas no generadas (hidden === 0)
      let validColNames;
      try {
        const tableCols = db.prepare(`PRAGMA table_xinfo("${table}")`).all();
        validColNames = new Set(tableCols.filter(c => c.hidden === 0).map(c => c.name));
      } catch (e) {
        validColNames = new Set(Object.keys(rows[0]));
      }

      const sampleRow = rows[0];
      const columns = Object.keys(sampleRow).filter(col => validColNames.has(col));
      
      if (columns.length === 0) continue;

      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT OR REPLACE INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
      
      const insertStmt = db.prepare(sql);

      for (const row of rows) {
        const values = columns.map(c => row[c]);
        insertStmt.run(values);
      }

      console.log(`  ✓ ${table}: ${rows.length} registros sincronizados`);
    }
  });

  try {
    transaction();
    console.log('\n✅ Base de datos sincronizada e importada con éxito.');
  } catch (err) {
    console.error('❌ Error durante la transacción de importación:', err);
  } finally {
    db.pragma('foreign_keys = ON');
  }

  // Verificación de totales clave
  try {
    const salesCount = db.prepare('SELECT COUNT(*) as c FROM sales').get()?.c || 0;
    const prodCount = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_active = 1').get()?.c || 0;
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get()?.c || 0;
    console.log(`\n📊 Verificación: ${salesCount} ventas, ${prodCount} productos, ${userCount} usuarios listos.`);
  } catch (e) {}
}

if (require.main === module) {
  importDatabase().catch(err => {
    console.error('❌ Error durante la importación:', err);
    process.exit(1);
  });
}

module.exports = { importDatabase };
