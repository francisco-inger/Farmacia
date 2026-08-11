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
    const updateStmt = db.prepare(`UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?`);
    let updatedCount = 0;
    
    for (const [key, value] of Object.entries(settings)) {
      const result = updateStmt.run(String(value), key);
      updatedCount += result.changes;
    }
    
    db.prepare(`INSERT INTO audit_log (user_id, user_name, action, module, description) VALUES (?, ?, 'CONFIGURACION_ACTUALIZADA', 'configuracion', ?)`).run(req.user.id, req.user.name, `Se actualizaron ${updatedCount} parámetros de configuración`);
  });
  
  try {
    transaction();
    return res.json({ success: true, message: 'Configuración actualizada exitosamente' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { getSettings, updateSettings };
