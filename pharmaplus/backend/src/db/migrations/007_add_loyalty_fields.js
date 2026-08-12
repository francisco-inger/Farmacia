/**
 * Migration 007: Add loyalty/fidelization fields to clients table
 * Adds: points, tier, total_purchases, total_spent
 */
function up(db) {
  // Add points column if not exists
  const colsResult = db.prepare("PRAGMA table_info(clients)").all();
  const existingCols = colsResult.map(c => c.name);

  if (!existingCols.includes('points')) {
    db.prepare(`ALTER TABLE clients ADD COLUMN points INTEGER NOT NULL DEFAULT 0`).run();
  }
  if (!existingCols.includes('tier')) {
    // Bronce (0-499), Plata (500-1499), Oro (1500+)
    db.prepare(`ALTER TABLE clients ADD COLUMN tier TEXT NOT NULL DEFAULT 'Bronce'`).run();
  }
  if (!existingCols.includes('total_spent')) {
    db.prepare(`ALTER TABLE clients ADD COLUMN total_spent REAL NOT NULL DEFAULT 0`).run();
  }
  if (!existingCols.includes('total_purchases')) {
    db.prepare(`ALTER TABLE clients ADD COLUMN total_purchases INTEGER NOT NULL DEFAULT 0`).run();
  }

  // Backfill existing clients from their actual sales history
  const clients = db.prepare(`SELECT id FROM clients`).all();
  for (const c of clients) {
    const spent = db.prepare(
      `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as cnt FROM sales WHERE client_id = ? AND status = 'completada'`
    ).get(c.id);

    const totalSpent = spent.total || 0;
    const totalPurchases = spent.cnt || 0;
    const points = Math.floor(totalSpent / 100);
    const tier = totalSpent >= 1500 ? 'Oro' : totalSpent >= 500 ? 'Plata' : 'Bronce';

    db.prepare(
      `UPDATE clients SET points = ?, tier = ?, total_spent = ?, total_purchases = ? WHERE id = ?`
    ).run(points, tier, totalSpent, totalPurchases, c.id);
  }

  console.log('[Migration 007] Loyalty fields added to clients and backfilled from sales history.');
}

function down(db) {
  // SQLite doesn't support DROP COLUMN easily, so we note this is not easily reversible
  console.log('[Migration 007] DOWN: Cannot easily remove columns in SQLite. Manual intervention needed.');
}

module.exports = { up, down };
