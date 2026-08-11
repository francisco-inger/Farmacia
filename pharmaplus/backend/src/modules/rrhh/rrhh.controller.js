const { getDb } = require('../../db/database');

function getEmployees(req, res) {
  const db = getDb();
  const { search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1']; const params = [];
  if (search) { where.push(`(e.name LIKE ? OR e.cedula LIKE ? OR e.position LIKE ?)`); const s = `%${search}%`; params.push(s,s,s); }
  const employees = db.prepare(`SELECT e.*, u.email, u.is_active as user_active FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE ${where.join(' AND ')} ORDER BY e.name LIMIT ? OFFSET ?`).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM employees e WHERE ${where.join(' AND ')}`).get(params).count;
  return res.json({ success: true, data: employees, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
}

function getById(req, res) {
  const db = getDb();
  const employee = db.prepare(`SELECT e.*, u.email, u.is_active as user_active, r.name as role_name FROM employees e LEFT JOIN users u ON e.user_id = u.id LEFT JOIN roles r ON u.role_id = r.id WHERE e.id = ?`).get(req.params.id);
  if (!employee) return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
  const attendance = db.prepare(`SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 30`).all(req.params.id);
  return res.json({ success: true, data: { ...employee, attendance } });
}

function create(req, res) {
  const db = getDb();
  const { user_id, name, cedula, phone, email, position, department, hire_date, salary, notes } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Nombre requerido' });
  const result = db.prepare(`INSERT INTO employees (user_id, name, cedula, phone, email, position, department, hire_date, salary, notes) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(user_id||null, name, cedula||null, phone||null, email||null, position||null, department||null, hire_date||null, salary||0, notes||null);
  return res.status(201).json({ success: true, data: db.prepare(`SELECT * FROM employees WHERE id = ?`).get(result.lastInsertRowid) });
}

function update(req, res) {
  const db = getDb();
  const fields = ['name','cedula','phone','email','position','department','hire_date','salary','is_active','notes'];
  const updates = []; const values = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } });
  if (updates.length === 0) return res.status(400).json({ success: false, message: 'Sin cambios' });
  values.push(req.params.id);
  db.prepare(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`).run(values);
  return res.json({ success: true, data: db.prepare(`SELECT * FROM employees WHERE id = ?`).get(req.params.id) });
}

function registerAttendance(req, res) {
  const db = getDb();
  const { employee_id, date, check_in, check_out, status, notes } = req.body;
  const result = db.prepare(`INSERT INTO attendance (employee_id, date, check_in, check_out, status, notes) VALUES (?,?,?,?,?,?)`).run(employee_id, date, check_in||null, check_out||null, status||'presente', notes||null);
  return res.status(201).json({ success: true, data: db.prepare(`SELECT * FROM attendance WHERE id = ?`).get(result.lastInsertRowid) });
}

module.exports = { getEmployees, getById, create, update, registerAttendance };
