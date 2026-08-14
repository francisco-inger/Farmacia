// Migration to add city, country, and type columns to suppliers table
// Located in the unified db/migrations folder

function runAddSupplierFields(db) {
  const database = db || require('../database').getDb();
  const columns = database.prepare(`PRAGMA table_info(suppliers)`).all().map(c => c.name);
  
  if (!columns.includes('city')) {
    database.exec(`ALTER TABLE suppliers ADD COLUMN city TEXT DEFAULT 'Santo Domingo';`);
    console.log('  ✅ Added city column to suppliers');
  }
  if (!columns.includes('country')) {
    database.exec(`ALTER TABLE suppliers ADD COLUMN country TEXT DEFAULT 'República Dominicana';`);
    console.log('  ✅ Added country column to suppliers');
  }
  if (!columns.includes('type')) {
    database.exec(`ALTER TABLE suppliers ADD COLUMN type TEXT DEFAULT 'Nacional';`);
    console.log('  ✅ Added type column to suppliers');
  }
  console.log('✅ suppliers table updated with city, country, type columns');
}

module.exports = { runAddSupplierFields };
