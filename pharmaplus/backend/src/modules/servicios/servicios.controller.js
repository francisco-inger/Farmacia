const { getDb } = require('../../db/database');

function getServices(req, res) {
  const db = getDb();
  const services = db.prepare(`SELECT * FROM services ORDER BY id DESC`).all();
  return res.json({ success: true, data: services });
}

function getRecords(req, res) {
  const db = getDb();
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const records = db.prepare(`
    SELECT sr.*, s.name as service_name, c.name as client_name, u.name as employee_name
    FROM service_records sr JOIN services s ON sr.service_id = s.id LEFT JOIN clients c ON sr.client_id = c.id LEFT JOIN users u ON sr.employee_id = u.id
    ORDER BY sr.performed_at DESC LIMIT ? OFFSET ?
  `).all([parseInt(limit), offset]);
  return res.json({ success: true, data: records });
}

function createService(req, res) {
  const db = getDb();
  const { name, description, price, duration_minutes, client_id } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Nombre requerido' });

  let service_id;
  db.transaction(() => {
    const result = db.prepare(`INSERT INTO services (name, description, price, duration_minutes) VALUES (?, ?, ?, ?)`).run(name, description||null, price||0, duration_minutes||15);
    service_id = result.lastInsertRowid;

    if (client_id) {
      db.prepare(`INSERT INTO service_records (client_id, service_id, employee_id, price, notes) VALUES (?, ?, ?, ?, ?)`).run(client_id, service_id, req.user?.id || 1, price||0, description||null);
    }
  })();

  return res.status(201).json({ success: true, data: db.prepare(`SELECT * FROM services WHERE id = ?`).get(service_id) });
}

function updateService(req, res) {
  const db = getDb();
  const { id } = req.params;
  const { name, description, price, is_active } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'ID de servicio requerido' });

  db.prepare(`
    UPDATE services 
    SET name = COALESCE(?, name), 
        description = COALESCE(?, description), 
        price = COALESCE(?, price),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(name, description, price, is_active !== undefined ? is_active : 1, id);

  const updated = db.prepare(`SELECT * FROM services WHERE id = ?`).get(id);
  return res.json({ success: true, data: updated });
}

function deleteService(req, res) {
  const db = getDb();
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });
  db.prepare(`DELETE FROM services WHERE id = ?`).run(id);
  return res.json({ success: true, message: 'Servicio eliminado correctamente' });
}

function createRecord(req, res) {
  const db = getDb();
  const { client_id, service_id, price, notes } = req.body;
  const result = db.prepare(`INSERT INTO service_records (client_id, service_id, employee_id, price, notes) VALUES (?, ?, ?, ?, ?)`).run(client_id||null, service_id, req.user.id, price, notes||null);
  return res.status(201).json({ success: true, data: db.prepare(`SELECT * FROM service_records WHERE id = ?`).get(result.lastInsertRowid) });
}

module.exports = { getServices, getRecords, createService, updateService, deleteService, createRecord };

