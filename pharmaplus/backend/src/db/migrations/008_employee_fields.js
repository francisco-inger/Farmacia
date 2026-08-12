const { getDb } = require('../database');

function up() {
  const db = getDb();
  const columns = db.prepare(`PRAGMA table_info(employees)`).all();
  const colNames = columns.map(c => c.name);

  if (!colNames.includes('birth_date')) {
    db.prepare(`ALTER TABLE employees ADD COLUMN birth_date TEXT`).run();
  }
  if (!colNames.includes('address')) {
    db.prepare(`ALTER TABLE employees ADD COLUMN address TEXT`).run();
  }
  if (!colNames.includes('civil_status')) {
    db.prepare(`ALTER TABLE employees ADD COLUMN civil_status TEXT`).run();
  }
  if (!colNames.includes('emergency_contact')) {
    db.prepare(`ALTER TABLE employees ADD COLUMN emergency_contact TEXT`).run();
  }
}

module.exports = { up };
