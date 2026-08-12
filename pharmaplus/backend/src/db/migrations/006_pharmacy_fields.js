const { getDb } = require('../database');

function runPharmacyFields(dbParam) {
  const db = dbParam || getDb();
  const columns = [
    { name: 'supplier_id', type: 'INTEGER' },
    { name: 'expiry_date', type: 'TEXT' },
    { name: 'batch_number', type: 'TEXT' },
    { name: 'sanitary_register', type: 'TEXT' },
    { name: 'administration_route', type: 'TEXT' },
    { name: 'location', type: 'TEXT' }
  ];

  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  const existingCols = tableInfo.map(c => c.name);

  columns.forEach(col => {
    if (!existingCols.includes(col.name)) {
      try {
        db.prepare(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`).run();
        console.log(`✅ Columna ${col.name} agregada a la tabla products`);
      } catch (e) {
        console.error(`⚠️ Error agregando columna ${col.name}:`, e.message);
      }
    }
  });
}

module.exports = { runPharmacyFields };
