const { encrypt, decrypt } = require('../../utils/encryption');
const { getDb } = require('../../db/database');

function getEmployees(req, res) {
  const db = getDb();
  const { search, department, status, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = ['1=1'];
  const params = [];

  if (search) {
    where.push(`(e.name LIKE ? OR e.cedula LIKE ? OR e.position LIKE ? OR e.department LIKE ?)`);
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (department && department !== 'ALL') {
    where.push(`e.department = ?`);
    params.push(department);
  }
  if (status === 'activo') {
    where.push(`e.is_active = 1`);
  } else if (status === 'inactivo') {
    where.push(`e.is_active = 0`);
  }

  const whereClause = where.join(' AND ');

  let employees = db.prepare(`
    SELECT e.*, u.email as user_email, u.is_active as user_active
    FROM employees e
    LEFT JOIN users u ON e.user_id = u.id
    WHERE ${whereClause}
    ORDER BY e.name
    LIMIT ? OFFSET ?
  `).all([...params, parseInt(limit), offset]);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM employees e WHERE ${whereClause}
  `).get(params).count;

  employees = employees.map(emp => ({ ...emp, cedula: decrypt(emp.cedula), phone: decrypt(emp.phone), address: decrypt(emp.address), emergency_phone: decrypt(emp.emergency_phone) }));
  return res.json({ success: true, data: employees, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
}

function getStats(req, res) {
  const db = getDb();

  const total      = db.prepare(`SELECT COUNT(*) as c FROM employees`).get().c;
  const activos    = db.prepare(`SELECT COUNT(*) as c FROM employees WHERE is_active = 1`).get().c;
  const inactivos  = db.prepare(`SELECT COUNT(*) as c FROM employees WHERE is_active = 0`).get().c;

  // Asistencias de hoy
  const today = new Date().toISOString().split('T')[0];
  const presentesHoy = db.prepare(`
    SELECT COUNT(*) as c FROM attendance WHERE date = ? AND status IN ('presente','tarde')
  `).get(today).c;

  // Vacaciones activas (fechas aproximadas de hire_date como referencia)
  const deVacaciones = 0; // sin tabla de vacaciones aún

  // Documentos próximos a vencer (simulado con empleados con hire_date > 1 año)
  const proximosVencer = db.prepare(`
    SELECT COUNT(*) as c FROM employees WHERE is_active = 1 AND hire_date IS NOT NULL AND hire_date != ''
  `).get().c;

  // Cumpleaños esta semana (birth_date comparación de mes/día)
  const now = new Date();
  const weekStart = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const weekEnd7  = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekEnd = `${String(weekEnd7.getMonth() + 1).padStart(2, '0')}-${String(weekEnd7.getDate()).padStart(2, '0')}`;
  const cumple = db.prepare(`
    SELECT COUNT(*) as c FROM employees WHERE is_active = 1
    AND birth_date IS NOT NULL AND birth_date != ''
    AND (
      substr(birth_date, 4, 5) BETWEEN ? AND ?
      OR substr(birth_date, 6, 5) BETWEEN ? AND ?
      OR substr(birth_date, 4, 2) || '-' || substr(birth_date, 7, 2) BETWEEN ? AND ?
    )
  `).get(weekStart, weekEnd, weekStart, weekEnd, weekStart, weekEnd).c;

  // Departamentos con conteo
  const departments = db.prepare(`
    SELECT department, COUNT(*) as count
    FROM employees WHERE is_active = 1 AND department IS NOT NULL
    GROUP BY department ORDER BY count DESC
  `).all();

  // Nómina total
  const nominaTotal = db.prepare(`
    SELECT COALESCE(SUM(CAST(salary as REAL)), 0) as total FROM employees WHERE is_active = 1
  `).get().total;

  return res.json({
    success: true,
    data: {
      total,
      activos,
      inactivos,
      presentes_hoy: presentesHoy,
      de_vacaciones: deVacaciones,
      proximos_vencer: proximosVencer,
      cumpleanos_semana: cumple,
      departments,
      nomina_total: nominaTotal
    }
  });
}

function getById(req, res) {
  const db = getDb();
  const employee = db.prepare(`
    SELECT e.*, u.email as user_email, u.is_active as user_active, r.name as role_name
    FROM employees e
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE e.id = ?
  `).get(req.params.id);

  if (!employee) return res.status(404).json({ success: false, message: 'Empleado no encontrado' });

  const attendance = db.prepare(`
    SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 30
  `).all(req.params.id);

  return res.json({ success: true, data: { ...employee, attendance } });
}

function create(req, res) {
  const db = getDb();
  const { user_id, name, cedula, phone, email, position, department, hire_date, birth_date, salary, address, civil_status, emergency_contact, notes } = req.body;

  if (!name) return res.status(400).json({ success: false, message: 'Nombre requerido' });

  const existing = cedula ? db.prepare(`SELECT id FROM employees WHERE cedula = ?`).get(cedula) : null;
  if (existing) return res.status(400).json({ success: false, message: 'Ya existe un empleado con esa cédula' });

  const result = db.prepare(`
    INSERT INTO employees (user_id, name, cedula, phone, email, position, department, hire_date, birth_date, salary, address, civil_status, emergency_contact, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    user_id || null, name, cedula || null, phone || null, email || null,
    position || null, department || null, hire_date || null, birth_date || null,
    salary || 0, address || null, civil_status || null, emergency_contact || null, notes || null
  );

  return res.status(201).json({
    success: true,
    data: db.prepare(`SELECT * FROM employees WHERE id = ?`).get(result.lastInsertRowid)
  });
}

function update(req, res) {
  const db = getDb();
  const fields = ['name', 'cedula', 'phone', 'email', 'position', 'department', 'hire_date', 'birth_date', 'salary', 'is_active', 'address', 'civil_status', 'emergency_contact', 'notes'];
  const updates = [];
  const values = [];

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  });

  if (updates.length === 0) return res.status(400).json({ success: false, message: 'Sin cambios' });

  values.push(req.params.id);
  db.prepare(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`).run(values);

  return res.json({ success: true, data: db.prepare(`SELECT * FROM employees WHERE id = ?`).get(req.params.id) });
}

function deleteEmployee(req, res) {
  const db = getDb();
  const employee = db.prepare(`SELECT * FROM employees WHERE id = ?`).get(req.params.id);
  if (!employee) return res.status(404).json({ success: false, message: 'Empleado no encontrado' });

  // Soft delete — solo desactiva
  db.prepare(`UPDATE employees SET is_active = 0 WHERE id = ?`).run(req.params.id);
  return res.json({ success: true, message: 'Empleado desactivado correctamente' });
}

function registerAttendance(req, res) {
  const db = getDb();
  const { employee_id, date, check_in, check_out, status, notes } = req.body;

  if (!employee_id) return res.status(400).json({ success: false, message: 'employee_id requerido' });

  const dateStr = date || new Date().toISOString().split('T')[0];

  // Verificar si ya existe registro para este empleado hoy
  const existing = db.prepare(`SELECT * FROM attendance WHERE employee_id = ? AND date = ?`).get(employee_id, dateStr);
  if (existing) {
    // Update checkout si ya existe
    db.prepare(`UPDATE attendance SET check_out = ?, status = ?, notes = ? WHERE id = ?`).run(
      check_out || new Date().toTimeString().substring(0, 5),
      status || existing.status,
      notes || existing.notes,
      existing.id
    );
    return res.json({ success: true, data: db.prepare(`SELECT * FROM attendance WHERE id = ?`).get(existing.id), updated: true });
  }

  const result = db.prepare(`
    INSERT INTO attendance (employee_id, date, check_in, check_out, status, notes)
    VALUES (?,?,?,?,?,?)
  `).run(
    employee_id, dateStr,
    check_in || new Date().toTimeString().substring(0, 5),
    check_out || null,
    status || 'presente',
    notes || null
  );

  return res.status(201).json({
    success: true,
    data: db.prepare(`SELECT * FROM attendance WHERE id = ?`).get(result.lastInsertRowid)
  });
}

function getAttendance(req, res) {
  const db = getDb();
  const { date, employee_id } = req.query;
  const today = date || new Date().toISOString().split('T')[0];

  let where = ['a.date = ?'];
  const params = [today];

  if (employee_id) {
    where.push('a.employee_id = ?');
    params.push(employee_id);
  }

  const records = db.prepare(`
    SELECT a.*, e.name as employee_name, e.position, e.department
    FROM attendance a
    LEFT JOIN employees e ON a.employee_id = e.id
    WHERE ${where.join(' AND ')}
    ORDER BY a.check_in ASC
  `).all(params);

  return res.json({ success: true, data: records });
}

function getDepartments(req, res) {
  const db = getDb();
  const departments = db.prepare(`
    SELECT department as name,
           COUNT(*) as total,
           SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activos,
           COALESCE(AVG(CAST(salary as REAL)), 0) as salario_promedio
    FROM employees
    WHERE department IS NOT NULL
    GROUP BY department
    ORDER BY total DESC
  `).all();

  return res.json({ success: true, data: departments });
}

function getPositions(req, res) {
  const db = getDb();
  const positions = db.prepare(`
    SELECT position as name,
           department,
           COUNT(*) as empleados,
           COALESCE(AVG(CAST(salary as REAL)), 0) as salario_promedio,
           'Activo' as estado
    FROM employees
    WHERE position IS NOT NULL AND is_active = 1
    GROUP BY position, department
    ORDER BY empleados DESC
  `).all();

  return res.json({ success: true, data: positions });
}

function getNomina(req, res) {
  const db = getDb();
  const nomina = db.prepare(`
    SELECT id, name, position, department,
           CAST(salary as REAL) as salario_base,
           CAST(salary as REAL) * 0.0591 as deduccion_sfs,
           CAST(salary as REAL) * 0.0287 as deduccion_afp,
           CAST(salary as REAL) - (CAST(salary as REAL) * 0.0591) - (CAST(salary as REAL) * 0.0287) as salario_neto,
           'Pendiente' as estado
    FROM employees
    WHERE is_active = 1
    ORDER BY name
  `).all();

  return res.json({ success: true, data: nomina });
}

module.exports = {
  getEmployees,
  getStats,
  getById,
  create,
  update,
  deleteEmployee,
  registerAttendance,
  getAttendance,
  getDepartments,
  getPositions,
  getNomina
};
