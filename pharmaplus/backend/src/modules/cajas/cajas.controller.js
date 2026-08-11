const { getDb } = require('../../db/database');

function getAll(req, res) {
  const db = getDb();
  const { status, page = 1, limit = 50 } = req.query;
  let where = ['1=1']; const params = [];
  if (status) { where.push(`cr.status = ?`); params.push(status); }
  const cashes = db.prepare(`
    SELECT cr.*, u.name as user_name FROM cash_registers cr JOIN users u ON cr.user_id = u.id
    WHERE ${where.join(' AND ')} ORDER BY cr.opened_at DESC LIMIT ? OFFSET ?
  `).all([...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
  return res.json({ success: true, data: cashes });
}

function openCash(req, res) {
  const db = getDb();
  const { initial_amount = 0, name = 'Caja Principal' } = req.body;
  const existingOpen = db.prepare(`SELECT id FROM cash_registers WHERE user_id = ? AND status = 'abierta'`).get(req.user.id);
  if (existingOpen) return res.status(400).json({ success: false, message: 'Ya tienes una caja abierta' });
  const result = db.prepare(`INSERT INTO cash_registers (name, user_id, initial_amount, expected_amount) VALUES (?, ?, ?, ?)`).run(name, req.user.id, initial_amount, initial_amount);
  db.prepare(`INSERT INTO cash_movements (cash_register_id, movement_type, amount, description, user_id) VALUES (?, 'apertura', ?, 'Apertura de caja', ?)`).run(result.lastInsertRowid, initial_amount, req.user.id);
  db.prepare(`INSERT INTO audit_log (user_id, user_name, action, module, description) VALUES (?, ?, 'CAJA_ABIERTA', 'cajas', ?)`).run(req.user.id, req.user.name, `Caja abierta con monto inicial: RD$ ${initial_amount}`);
  return res.status(201).json({ success: true, data: db.prepare(`SELECT * FROM cash_registers WHERE id = ?`).get(result.lastInsertRowid) });
}

function closeCash(req, res) {
  const db = getDb();
  const { counted_amount, notes } = req.body;
  const cash = db.prepare(`SELECT * FROM cash_registers WHERE id = ? AND user_id = ? AND status = 'abierta'`).get(req.params.id, req.user.id);
  if (!cash) return res.status(404).json({ success: false, message: 'Caja no encontrada o no autorizado' });
  // Calculate expected
  const movements = db.prepare(`SELECT movement_type, COALESCE(SUM(amount),0) as total FROM cash_movements WHERE cash_register_id = ? GROUP BY movement_type`).all(req.params.id);
  let expected = cash.initial_amount;
  for (const m of movements) {
    if (['venta','ingreso','apertura'].includes(m.movement_type)) expected += m.total;
    else if (['retiro','devolucion','gasto'].includes(m.movement_type)) expected -= m.total;
  }
  expected = expected - cash.initial_amount; // remove apertura double-count
  expected = cash.initial_amount + (movements.find(m => m.movement_type === 'venta')?.total || 0) + (movements.find(m => m.movement_type === 'ingreso')?.total || 0) - (movements.find(m => m.movement_type === 'retiro')?.total || 0) - (movements.find(m => m.movement_type === 'devolucion')?.total || 0) - (movements.find(m => m.movement_type === 'gasto')?.total || 0);
  const difference = (counted_amount || 0) - expected;
  db.prepare(`UPDATE cash_registers SET status = 'cerrada', expected_amount = ?, counted_amount = ?, difference = ?, closed_at = CURRENT_TIMESTAMP, notes = ? WHERE id = ?`).run(expected, counted_amount||0, difference, notes||null, req.params.id);
  db.prepare(`INSERT INTO cash_movements (cash_register_id, movement_type, amount, description, user_id) VALUES (?, 'cierre', ?, 'Cierre de caja', ?)`).run(req.params.id, counted_amount||0, req.user.id);
  db.prepare(`INSERT INTO audit_log (user_id, user_name, action, module, description) VALUES (?, ?, 'CAJA_CERRADA', 'cajas', ?)`).run(req.user.id, req.user.name, `Caja cerrada. Esperado: RD$ ${expected.toFixed(2)}, Contado: RD$ ${(counted_amount||0).toFixed(2)}, Diferencia: RD$ ${difference.toFixed(2)}`);
  return res.json({ success: true, message: 'Caja cerrada', data: { expected, counted: counted_amount, difference } });
}

function getMovements(req, res) {
  const db = getDb();
  const movements = db.prepare(`SELECT cm.*, u.name as user_name FROM cash_movements cm LEFT JOIN users u ON cm.user_id = u.id WHERE cm.cash_register_id = ? ORDER BY cm.created_at`).all(req.params.id);
  return res.json({ success: true, data: movements });
}

function addMovement(req, res) {
  const db = getDb();
  const { movement_type, amount, description } = req.body;
  if (!['ingreso','retiro','gasto'].includes(movement_type)) return res.status(400).json({ success: false, message: 'Tipo de movimiento inválido' });
  const cash = db.prepare(`SELECT * FROM cash_registers WHERE id = ? AND status = 'abierta'`).get(req.params.id);
  if (!cash) return res.status(404).json({ success: false, message: 'Caja no encontrada o cerrada' });
  db.prepare(`INSERT INTO cash_movements (cash_register_id, movement_type, amount, description, user_id) VALUES (?, ?, ?, ?, ?)`).run(req.params.id, movement_type, amount, description||null, req.user.id);
  return res.json({ success: true, message: 'Movimiento registrado' });
}

module.exports = { getAll, openCash, closeCash, getMovements, addMovement };
