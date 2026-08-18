const fs = require('fs');
const path = require('path');
const { getDb } = require('./database');

async function exportDatabase() {
  const db = getDb();
  console.log('📦 Iniciando exportación de base de datos PharmaPlus...');

  const snapshotsDir = path.join(__dirname, 'snapshots');
  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }

  // Obtenemos todas las tablas de usuario
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(t => t.name);
  
  const exportedData = {
    exported_at: new Date().toISOString(),
    version: '1.0.0',
    tables: {}
  };

  let totalRecords = 0;

  for (const table of tables) {
    try {
      const rows = db.prepare(`SELECT * FROM "${table}"`).all();
      exportedData.tables[table] = rows;
      totalRecords += rows.length;
      console.log(`  ✓ ${table}: ${rows.length} registros`);
    } catch (err) {
      console.warn(`  ⚠️ Error al exportar tabla ${table}:`, err.message);
    }
  }

  // Guardar archivo JSON portable compatible con Git
  const jsonPath = path.join(snapshotsDir, 'pharmaplus_data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(exportedData, null, 2), 'utf-8');

  console.log('\n✅ Base de datos exportada exitosamente.');
  console.log(`📁 Archivo generado: ${jsonPath}`);
  console.log(`📊 Total de registros exportados: ${totalRecords}`);
  console.log('\n💡 Para compartir con tus colaboradores:');
  console.log('   1. git add backend/src/db/snapshots/');
  console.log('   2. git commit -m "db: sincronizar datos de farmacia"');
  console.log('   3. git push');
}

if (require.main === module) {
  exportDatabase().catch(err => {
    console.error('❌ Error durante la exportación:', err);
    process.exit(1);
  });
}

module.exports = { exportDatabase };
