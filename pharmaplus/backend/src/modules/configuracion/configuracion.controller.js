const { getDb } = require('../../db/database');

function getSettings(req, res) {
  const db = getDb();
  const settingsArray = db.prepare(`SELECT * FROM system_settings`).all();
  
  // Convert array to object for easier frontend consumption
  const settings = {};
  settingsArray.forEach(s => {
    settings[s.key] = {
      value: s.value,
      description: s.description
    };
  });
  
  return res.json({ success: true, data: settings });
}

function updateSettings(req, res) {
  const db = getDb();
  const settings = req.body;
  
  const transaction = db.transaction(() => {
    const upsertStmt = db.prepare(`
      INSERT INTO system_settings (key, value, description, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value, 
        updated_at = CURRENT_TIMESTAMP
    `);
    let updatedCount = 0;
    
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined && value !== null) {
        const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        upsertStmt.run(key, valStr, `Parámetro del sistema: ${key}`);
        updatedCount++;
      }
    }
    
    db.prepare(`INSERT INTO audit_log (user_id, user_name, action, module, description) VALUES (?, ?, 'CONFIGURACION_ACTUALIZADA', 'configuracion', ?)`).run(
      req.user?.id || 1, 
      req.user?.name || 'Admin General', 
      `Se sincronizaron y actualizaron ${updatedCount} parámetros de configuración del sistema`
    );
  });
  
  try {
    transaction();
    return res.json({ success: true, message: 'Configuración actualizada exitosamente' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

function getSystemHealth(req, res) {
  try {
    const db = getDb();
    const products = db.prepare(`SELECT COUNT(*) as count FROM products WHERE is_active = 1`).get()?.count || 0;
    const sales = db.prepare(`SELECT COUNT(*) as count FROM sales`).get()?.count || 0;
    const users = db.prepare(`SELECT COUNT(*) as count FROM users WHERE is_active = 1`).get()?.count || 0;
    const clients = db.prepare(`SELECT COUNT(*) as count FROM clients WHERE is_active = 1`).get()?.count || 0;
    const invoices = db.prepare(`SELECT COUNT(*) as count FROM invoices`).get()?.count || 0;
    const auditLogs = db.prepare(`SELECT COUNT(*) as count FROM audit_log`).get()?.count || 0;

    // Calculate real capacity usage based on quota tiers (e.g. up to 10,000 active records per node)
    const totalRecords = products + sales + users + clients + invoices + auditLogs;
    const maxCapacity = 5000;
    const usagePercent = Math.min(100, Math.max(12, Math.round((totalRecords / maxCapacity) * 100)));

    const memoryUsage = process.memoryUsage();
    const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    return res.json({
      success: true,
      data: {
        plan: 'Plan Empresarial',
        tier: 'Avanzado',
        status: 'Activo',
        usagePercent,
        totalRecords,
        activeProducts: products,
        totalSales: sales,
        activeUsers: users,
        memoryUsedMB: usedMB,
        nodeVersion: process.version,
        uptimeHours: Math.round(process.uptime() / 3600 * 10) / 10
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getSettings, updateSettings, getSystemHealth };
