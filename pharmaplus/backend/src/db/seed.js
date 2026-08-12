const bcrypt = require('bcryptjs');
const { getDb } = require('./database');

async function runSeed() {
  const db = getDb();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;

  // ─── ROLES ────────────────────────────────────────────────────────────────
  const roles = [
    { name: 'Administrador', description: 'Acceso total y configuración del sistema' },
    { name: 'Cajero',        description: 'Acceso exclusivo al sistema POS y caja' },
  ];
  const insertRole = db.prepare(`INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)`);
  roles.forEach(r => insertRole.run(r.name, r.description));

  const adminRole  = db.prepare(`SELECT id FROM roles WHERE name = 'Administrador'`).get();
  const cajeroRole = db.prepare(`SELECT id FROM roles WHERE name = 'Cajero'`).get();

  // ─── USUARIOS (cuentas de login) ─────────────────────────────────────────
  const adminHash  = await bcrypt.hash('admin123', rounds);
  const cajeroHash = await bcrypt.hash('cajero123', rounds);

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password_hash, role_id, phone, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertUser.run('Admin Farmacia',    'admin@pharmaplus.do',  adminHash,  adminRole.id,  '809-000-0001', 1);
  insertUser.run('Juan Pérez Cajero', 'cajero@pharmaplus.do', cajeroHash, cajeroRole.id, '809-000-0002', 1);

  // ─── CATEGORÍAS ──────────────────────────────────────────────────────────
  const categories = [
    { name: 'Analgésicos',      color: '#e74c3c' },
    { name: 'Antibióticos',     color: '#3498db' },
    { name: 'Antiinflamatorios',color: '#e67e22' },
    { name: 'Vitaminas',        color: '#27ae60' },
    { name: 'Antialérgicos',    color: '#9b59b6' },
    { name: 'Antigripales',     color: '#1abc9c' },
    { name: 'Dermatológicos',   color: '#f39c12' },
    { name: 'Higiene Personal', color: '#2ecc71' },
    { name: 'Bebés',            color: '#fd79a8' },
    { name: 'Equipos Médicos',  color: '#636e72' },
    { name: 'Cuidado Personal', color: '#a29bfe' },
    { name: 'Otros',            color: '#b2bec3' },
  ];
  const insertCat = db.prepare(`INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)`);
  categories.forEach(c => insertCat.run(c.name, c.color));

  // ─── PROVEEDORES ─────────────────────────────────────────────────────────
  const suppliers = [
    { company_name: 'Laboratorios Ramos',            rnc: '101-12345-6', contact_name: 'Carlos Ramos',    phone: '809-555-0101', email: 'ventas@ramos.do' },
    { company_name: 'Distribuidora Médica del Caribe',rnc: '101-67890-1', contact_name: 'Ana García',      phone: '809-555-0102', email: 'ventas@dmc.do' },
    { company_name: 'Farmacéutica Nacional S.A.',    rnc: '101-24680-2', contact_name: 'Pedro Martínez',  phone: '809-555-0103', email: 'pedidos@farmnacional.do' },
  ];
  const insertSup = db.prepare(`INSERT OR IGNORE INTO suppliers (company_name, rnc, contact_name, phone, email) VALUES (?, ?, ?, ?, ?)`);
  suppliers.forEach(s => insertSup.run(s.company_name, s.rnc, s.contact_name, s.phone, s.email));

  // ─── PRODUCTOS ───────────────────────────────────────────────────────────
  const analgesicosId  = db.prepare(`SELECT id FROM categories WHERE name = 'Analgésicos'`).get()?.id;
  const antibioticosId = db.prepare(`SELECT id FROM categories WHERE name = 'Antibióticos'`).get()?.id;
  const vitaminasId    = db.prepare(`SELECT id FROM categories WHERE name = 'Vitaminas'`).get()?.id;
  const antigripalesId = db.prepare(`SELECT id FROM categories WHERE name = 'Antigripales'`).get()?.id;
  const supId1         = db.prepare(`SELECT id FROM suppliers WHERE rnc = '101-12345-6'`).get()?.id;

  const products = [
    { name: 'Paracetamol 500mg',  code: 'PAR500', barcode: '7890001', cat: analgesicosId,  ingredient: 'Paracetamol',       lab: 'Laboratorios Ramos',     presentation: 'Tabletas',           concentration: '500mg',      cost: 45,  price: 75,  stock: 450, min_stock: 50 },
    { name: 'Losartán 50mg',      code: 'LOS050', barcode: '7890002', cat: analgesicosId,  ingredient: 'Losartán potásico', lab: 'Farmacéutica Nacional',  presentation: 'Tabletas',           concentration: '50mg',       cost: 150, price: 280, stock: 320, min_stock: 30 },
    { name: 'Ibuprofeno 400mg',   code: 'IBU400', barcode: '7890003', cat: analgesicosId,  ingredient: 'Ibuprofeno',        lab: 'Laboratorios Ramos',     presentation: 'Tabletas',           concentration: '400mg',      cost: 35,  price: 65,  stock: 280, min_stock: 40 },
    { name: 'Amoxicilina 500mg',  code: 'AMO500', barcode: '7890004', cat: antibioticosId, ingredient: 'Amoxicilina',       lab: 'Distribuidora Médica',   presentation: 'Cápsulas',           concentration: '500mg',      cost: 180, price: 350, stock: 180, min_stock: 20, recipe: 1 },
    { name: 'Omeprazol 20mg',     code: 'OME020', barcode: '7890005', cat: analgesicosId,  ingredient: 'Omeprazol',         lab: 'Farmacéutica Nacional',  presentation: 'Cápsulas',           concentration: '20mg',       cost: 60,  price: 120, stock: 200, min_stock: 30 },
    { name: 'Vitamina C 500mg',   code: 'VTC500', barcode: '7890006', cat: vitaminasId,    ingredient: 'Ácido Ascórbico',   lab: 'Laboratorios Ramos',     presentation: 'Tabletas masticables', concentration: '500mg',    cost: 120, price: 220, stock: 350, min_stock: 50 },
    { name: 'Complejo B',         code: 'COMB01', barcode: '7890007', cat: vitaminasId,    ingredient: 'Complejo B',        lab: 'Distribuidora Médica',   presentation: 'Tabletas',           concentration: 'Vitaminas B', cost: 85, price: 180, stock: 8,   min_stock: 20 },
    { name: 'Loratadina 10mg',    code: 'LOR010', barcode: '7890008', cat: analgesicosId,  ingredient: 'Loratadina',        lab: 'Farmacéutica Nacional',  presentation: 'Tabletas',           concentration: '10mg',       cost: 40,  price: 80,  stock: 3,   min_stock: 25 },
    { name: 'Ambroxol Jarabe',    code: 'AMBJR1', barcode: '7890009', cat: antigripalesId, ingredient: 'Ambroxol',          lab: 'Laboratorios Ramos',     presentation: 'Jarabe 120ml',       concentration: '15mg/5ml',   cost: 95,  price: 185, stock: 0,   min_stock: 15 },
    { name: 'Metformina 850mg',   code: 'MET850', barcode: '7890010', cat: analgesicosId,  ingredient: 'Metformina HCl',    lab: 'Farmacéutica Nacional',  presentation: 'Tabletas',           concentration: '850mg',      cost: 70,  price: 140, stock: 250, min_stock: 30, recipe: 1 },
    { name: 'Enalapril 10mg',     code: 'ENA010', barcode: '7890011', cat: analgesicosId,  ingredient: 'Enalapril maleato', lab: 'Laboratorios Ramos',     presentation: 'Tabletas',           concentration: '10mg',       cost: 55,  price: 110, stock: 175, min_stock: 25 },
    { name: 'Vitamina D3 1000UI', code: 'VTD001', barcode: '7890012', cat: vitaminasId,    ingredient: 'Colecalciferol',    lab: 'Distribuidora Médica',   presentation: 'Cápsulas blandas',   concentration: '1000UI',     cost: 200, price: 380, stock: 120, min_stock: 20 },
  ];
  const insertProd = db.prepare(`
    INSERT OR IGNORE INTO products (name, code, barcode, category_id, active_ingredient, laboratory, presentation, concentration, cost_price, sale_price, stock, min_stock, requires_recipe, supplier_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  products.forEach(p => insertProd.run(
    p.name, p.code, p.barcode, p.cat, p.ingredient, p.lab, p.presentation,
    p.concentration, p.cost, p.price, p.stock, p.min_stock, p.recipe || 0, supId1
  ));

  // ─── CLIENTES ─────────────────────────────────────────────────────────────
  const clients = [
    { name: 'María González',  cedula: '001-2345678-9', phone: '829-555-1001', email: 'maria@email.com' },
    { name: 'José Martínez',   cedula: '001-3456789-0', phone: '829-555-1002', email: 'jose@email.com' },
    { name: 'Ana Rodríguez',   cedula: '001-4567890-1', phone: '829-555-1003', email: 'ana@email.com' },
    { name: 'Carlos Pérez',    cedula: '001-5678901-2', phone: '829-555-1004' },
    { name: 'Carmen Jiménez',  cedula: '001-6789012-3', phone: '829-555-1005', email: 'carmen@email.com' },
  ];
  const insertClient = db.prepare(`INSERT OR IGNORE INTO clients (name, cedula, phone, email) VALUES (?, ?, ?, ?)`);
  clients.forEach(c => insertClient.run(c.name, c.cedula, c.phone, c.email || null));

  // ─── SERVICIOS ───────────────────────────────────────────────────────────
  const services = [
    { name: 'Toma de presión arterial',  price: 50,  duration: 10 },
    { name: 'Medición de glucosa',        price: 150, duration: 10 },
    { name: 'Nebulización',               price: 300, duration: 20 },
    { name: 'Aplicación de inyección',    price: 200, duration: 15 },
    { name: 'Consulta farmacéutica',      price: 0,   duration: 15 },
  ];
  const insertSvc = db.prepare(`INSERT OR IGNORE INTO services (name, price, duration_minutes) VALUES (?, ?, ?)`);
  services.forEach(s => insertSvc.run(s.name, s.price, s.duration));

  // ─── NCF SECUENCIAS ──────────────────────────────────────────────────────
  const ncfTypes = [
    { type: 'B01', name: 'Factura de Crédito Fiscal',    prefix: 'B010000', current: 234, max: 1000, expiry: '2026-12-31' },
    { type: 'B02', name: 'Factura de Consumo',          prefix: 'B020000', current: 919, max: 1000, expiry: '2026-12-31' },
    { type: 'B03', name: 'Nota de Débito',              prefix: 'B030000', current: 124, max: 500,  expiry: '2026-12-31' },
    { type: 'B04', name: 'Nota de Crédito',             prefix: 'B040000', current: 44,  max: 500,  expiry: '2026-12-31' },
    { type: 'B11', name: 'Reg. Único de Ingresos',      prefix: 'B110000', current: 29,  max: 200,  expiry: '2026-12-31' },
    { type: 'B14', name: 'Regímenes Especiales',        prefix: 'B140000', current: 10,  max: 500,  expiry: '2026-12-31' },
    { type: 'B15', name: 'Gubernamentales',             prefix: 'B150000', current: 5,   max: 500,  expiry: '2026-12-31' },
  ];
  const insertNcf = db.prepare(`INSERT OR IGNORE INTO ncf_sequences (ncf_type, ncf_type_name, prefix, current_sequence, max_sequence, expiry_date) VALUES (?, ?, ?, ?, ?, ?)`);
  ncfTypes.forEach(n => insertNcf.run(n.type, n.name, n.prefix, n.current, n.max, n.expiry));

  // ─── CONFIGURACIÓN ───────────────────────────────────────────────────────
  const settings = [
    { key: 'pharmacy_name',            value: 'PharmaPlus',                          desc: 'Nombre de la farmacia' },
    { key: 'pharmacy_rnc',             value: '130-00001-1',                         desc: 'RNC de la farmacia' },
    { key: 'pharmacy_phone',           value: '809-555-0000',                        desc: 'Teléfono principal' },
    { key: 'pharmacy_address',         value: 'Av. 27 de Febrero #123, Santo Domingo', desc: 'Dirección' },
    { key: 'pharmacy_email',           value: 'info@pharmaplus.do',                  desc: 'Correo de contacto' },
    { key: 'currency',                 value: 'RD$',                                 desc: 'Moneda del sistema' },
    { key: 'itbis_rate',               value: '0.18',                                desc: 'Tasa ITBIS (18%)' },
    { key: 'allow_sale_without_stock', value: 'false',                               desc: 'Permitir ventas sin stock' },
    { key: 'days_before_expiry_alert', value: '30',                                  desc: 'Días antes del vencimiento para alertar' },
    { key: 'min_stock_alert',          value: 'true',                                desc: 'Alertas de stock mínimo activas' },
    { key: 'session_timeout',          value: '480',                                 desc: 'Timeout de sesión en minutos' },
    { key: 'password_min_length',      value: '6',                                   desc: 'Longitud mínima de contraseña' },
  ];
  const insertSetting = db.prepare(`INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)`);
  settings.forEach(s => insertSetting.run(s.key, s.value, s.desc));

  // ─── EMPLEADOS (ficha de RRHH de la farmacia) ────────────────────────────
  const adminUser  = db.prepare(`SELECT id FROM users WHERE email = 'admin@pharmaplus.do'`).get();
  const cajeroUser = db.prepare(`SELECT id FROM users WHERE email = 'cajero@pharmaplus.do'`).get();

  const employeeSeeds = [
    { user_id: adminUser?.id, name: 'Admin Farmacia', cedula: '001-0000001-1', phone: '809-000-0001', email: 'admin@pharmaplus.do', position: 'Administrador General', department: 'Administración', hire_date: '2024-01-01', birth_date: '1988-06-15', salary: 75000, civil_status: 'Casado', emergency_contact: 'Esposa: 809-555-0199' },
    { user_id: cajeroUser?.id, name: 'Juan Pérez', cedula: '001-0000002-2', phone: '809-000-0002', email: 'cajero@pharmaplus.do', position: 'Cajero Principal', department: 'Caja', hire_date: '2024-03-15', birth_date: '1995-10-22', salary: 35000, civil_status: 'Soltero', emergency_contact: 'Madre: 809-555-0288' },
    { name: 'Luisa Suárez', cedula: '001-1754320-9', phone: '809-650-5714', email: 'luisasuarez@pharmaplus.do', position: 'Cajera Nocturna', department: 'Caja', hire_date: '2024-05-10', birth_date: '1997-04-12', salary: 28000, civil_status: 'Soltera', emergency_contact: 'Padre: 809-555-0377' },
    { name: 'Dra. Carolina Peralta', cedula: '001-0847392-1', phone: '809-555-0104', email: 'cperalta@pharmaplus.do', position: 'Farmacéutica Titular', department: 'Dispensación', hire_date: '2023-01-15', birth_date: '1985-09-08', salary: 65000, civil_status: 'Casada', emergency_contact: 'Esposo: 809-555-0466' },
    { name: 'Dr. Miguel Alcántara', cedula: '001-0938210-4', phone: '809-555-0105', email: 'malcantara@pharmaplus.do', position: 'Farmacéutico Regente', department: 'Dispensación', hire_date: '2023-04-01', birth_date: '1986-11-19', salary: 60000, civil_status: 'Casado', emergency_contact: 'Esposa: 809-555-0555' },
    { name: 'Ana María Gómez', cedula: '001-1122334-5', phone: '809-555-0106', email: 'agomez@pharmaplus.do', position: 'Auxiliar de Farmacia', department: 'Dispensación', hire_date: '2023-06-20', birth_date: '1996-03-30', salary: 30000, civil_status: 'Soltera', emergency_contact: 'Madre: 809-555-0644' },
    { name: 'Roberto Fernández', cedula: '001-2233445-6', phone: '809-555-0107', email: 'rfernandez@pharmaplus.do', position: 'Encargado de Almacén', department: 'Almacén', hire_date: '2023-02-10', birth_date: '1990-07-14', salary: 38000, civil_status: 'Unión Libre', emergency_contact: 'Hermano: 809-555-0733' },
    { name: 'Carlos Eduardo Reyes', cedula: '001-3344556-7', phone: '809-555-0108', email: 'creyes@pharmaplus.do', position: 'Auxiliar de Almacén', department: 'Almacén', hire_date: '2023-08-15', birth_date: '1998-01-05', salary: 25000, civil_status: 'Soltero', emergency_contact: 'Padre: 809-555-0822' },
    { name: 'Lic. Carmen Rosario', cedula: '001-4455667-8', phone: '809-555-0109', email: 'crosario@pharmaplus.do', position: 'Contable General', department: 'Administración', hire_date: '2022-11-01', birth_date: '1989-02-25', salary: 55000, civil_status: 'Casada', emergency_contact: 'Esposo: 809-555-0911' },
    { name: 'Pedro José Tavárez', cedula: '001-5566778-9', phone: '809-555-0110', email: 'ptavarez@pharmaplus.do', position: 'Mensajero / Delivery', department: 'Logística', hire_date: '2024-02-01', birth_date: '1999-12-17', salary: 22000, civil_status: 'Soltero', emergency_contact: 'Madre: 809-555-1010' },
    { name: 'José Luis Castillo', cedula: '001-6677889-0', phone: '809-555-0111', email: 'jcastillo@pharmaplus.do', position: 'Soporte Técnico & IT', department: 'Sistemas', hire_date: '2023-09-01', birth_date: '1993-05-03', salary: 45000, civil_status: 'Casado', emergency_contact: 'Esposa: 809-555-1121' },
    { name: 'Ramón Antonio Batista', cedula: '001-7788990-1', phone: '809-555-0112', email: 'rbatista@pharmaplus.do', position: 'Oficial de Seguridad', department: 'Seguridad', hire_date: '2023-03-01', birth_date: '1982-11-11', salary: 24000, civil_status: 'Casado', emergency_contact: 'Esposa: 809-555-1232' },
    { name: 'Elena Mercedes Ruiz', cedula: '001-8899001-2', phone: '809-555-0113', email: 'eruiz@pharmaplus.do', position: 'Auxiliar de Limpieza', department: 'Mantenimiento', hire_date: '2023-07-01', birth_date: '1987-08-28', salary: 20000, civil_status: 'Soltera', emergency_contact: 'Hija: 809-555-1343' },
    { name: 'Francisco Javier Peña', cedula: '001-9900112-3', phone: '809-555-0114', email: 'fpena@pharmaplus.do', position: 'Cajero Fin de Semana', department: 'Caja', hire_date: '2024-04-15', birth_date: '2000-06-09', salary: 26000, civil_status: 'Soltero', emergency_contact: 'Madre: 809-555-1454' },
    { name: 'María Teresa Díaz', cedula: '001-1029384-5', phone: '809-555-0115', email: 'mdiaz@pharmaplus.do', position: 'Supervisora de Atención', department: 'Servicio al Cliente', hire_date: '2023-10-01', birth_date: '1994-01-21', salary: 32000, civil_status: 'Unión Libre', emergency_contact: 'Madre: 809-555-1565' },
  ];

  const insertEmp = db.prepare(`
    INSERT OR IGNORE INTO employees (user_id, name, cedula, phone, email, position, department, hire_date, birth_date, salary, civil_status, emergency_contact, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  employeeSeeds.forEach(e => {
    insertEmp.run(
      e.user_id || null, e.name, e.cedula, e.phone, e.email, e.position, e.department,
      e.hire_date, e.birth_date, e.salary, e.civil_status, e.emergency_contact
    );
  });

  // ─── ASISTENCIAS DE HOY ──────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
  const allEmps = db.prepare(`SELECT id FROM employees WHERE is_active = 1`).all();
  const insertAtt = db.prepare(`INSERT OR IGNORE INTO attendance (employee_id, date, check_in, status) VALUES (?, ?, ?, ?)`);

  allEmps.slice(0, 10).forEach((e, idx) => {
    const times = ['07:45', '07:55', '08:00', '08:02', '08:14', '08:25'];
    const time = times[idx % times.length];
    const status = idx === 4 ? 'tarde' : 'presente';
    insertAtt.run(e.id, todayStr, time, status);
  });

  console.log('✅ Seed completado exitosamente con plantilla completa de empleados');
}

module.exports = { runSeed };
