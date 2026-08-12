const bcrypt = require('bcryptjs');
const { getDb } = require('./database');

async function runSeed() {
  const db = getDb();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;

  // ─── ROLES ───────────────────────────────────────────────────────────────
  const roles = [
    { name: 'Administrador', description: 'Acceso total y configuración del sistema' },
    { name: 'Cajero', description: 'Acceso a ventas POS, clientes y cobros en caja' },
    { name: 'Farmacéutico', description: 'Dispensación de recetas y verificación médica' },
    { name: 'Supervisor', description: 'Supervisión de operaciones, cierres y reportes' },
    { name: 'Encargado de Inventario', description: 'Gestión de stock, reabastecimiento y kardex' },
    { name: 'Compras', description: 'Órdenes de compra y contacto con suplidores' },
    { name: 'Contabilidad', description: 'Facturación fiscal, auditoría y reportes impositivos' },
    { name: 'admin', description: 'Administrador legacy' },
    { name: 'cajero', description: 'Cajero legacy' }
  ];
  const insertRole = db.prepare(`INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)`);
  roles.forEach(r => insertRole.run(r.name, r.description));

  // ─── USUARIOS ─────────────────────────────────────────────────────────────
  const defaultHash = await bcrypt.hash('pharmaplus123', rounds);
  const adminHash = await bcrypt.hash('admin123', rounds);
  const cajeroHash = await bcrypt.hash('cajero123', rounds);
  const getRoleId = (roleName) => db.prepare(`SELECT id FROM roles WHERE name = ? OR name LIKE ?`).get(roleName, `%${roleName}%`)?.id || 1;

  const sampleUsers = [
    { name: 'Ana Cajera', email: 'ana.cajera@pharmaplus.com', phone: '809-555-1234', role: 'Cajero', is_active: 1 },
    { name: 'Juan Martínez', email: 'juan.martinez@pharmaplus.com', phone: '809-555-5678', role: 'Farmacéutico', is_active: 1 },
    { name: 'Laura Sánchez', email: 'laura.sanchez@pharmaplus.com', phone: '809-555-9012', role: 'Administrador', is_active: 1 },
    { name: 'Carlos Rodríguez', email: 'carlos.rodriguez@pharmaplus.com', phone: '809-555-3456', role: 'Supervisor', is_active: 1 },
    { name: 'María Vargas', email: 'maria.vargas@pharmaplus.com', phone: '809-555-7890', role: 'Encargado de Inventario', is_active: 1 },
    { name: 'Pedro Díaz', email: 'pedro.diaz@pharmaplus.com', phone: '809-555-2345', role: 'Compras', is_active: 1 },
    { name: 'Andrés Mejía', email: 'andres.mejia@pharmaplus.com', phone: '809-555-6789', role: 'Contabilidad', is_active: 0 },
    { name: 'Sofía Ramírez', email: 'sofia.ramirez@pharmaplus.com', phone: '809-555-0123', role: 'Cajero', is_active: 1 },
    { name: 'Admin Farmacia', email: 'admin@pharmaplus.do', phone: '809-000-0001', role: 'Administrador', is_active: 1 },
    { name: 'Juan Pérez (Cajero)', email: 'cajero@pharmaplus.do', phone: '809-000-0002', role: 'Cajero', is_active: 1 }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password_hash, role_id, phone, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  sampleUsers.forEach(u => {
    const hash = u.email === 'admin@pharmaplus.do' ? adminHash :
                 u.email === 'cajero@pharmaplus.do' ? cajeroHash : defaultHash;
    insertUser.run(u.name, u.email, hash, getRoleId(u.role), u.phone, u.is_active);
  });

  // ─── CATEGORÍAS ──────────────────────────────────────────────────────────
  const categories = [
    { name: 'Analgésicos', color: '#e74c3c' },
    { name: 'Antibióticos', color: '#3498db' },
    { name: 'Antiinflamatorios', color: '#e67e22' },
    { name: 'Vitaminas', color: '#27ae60' },
    { name: 'Antialérgicos', color: '#9b59b6' },
    { name: 'Antigripales', color: '#1abc9c' },
    { name: 'Dermatológicos', color: '#f39c12' },
    { name: 'Higiene Personal', color: '#2ecc71' },
    { name: 'Bebés', color: '#fd79a8' },
    { name: 'Equipos Médicos', color: '#636e72' },
    { name: 'Cuidado Personal', color: '#a29bfe' },
    { name: 'Otros', color: '#b2bec3' },
  ];
  const insertCat = db.prepare(`INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)`);
  categories.forEach(c => insertCat.run(c.name, c.color));

  // ─── PROVEEDORES ─────────────────────────────────────────────────────────
  const suppliers = [
    { company_name: 'Laboratorios Ramos', rnc: '101-12345-6', contact_name: 'Carlos Ramos', phone: '809-555-0101', email: 'ventas@ramos.do' },
    { company_name: 'Distribuidora Médica del Caribe', rnc: '101-67890-1', contact_name: 'Ana García', phone: '809-555-0102', email: 'ventas@dmc.do' },
    { company_name: 'Farmacéutica Nacional S.A.', rnc: '101-24680-2', contact_name: 'Pedro Martínez', phone: '809-555-0103', email: 'pedidos@farmnacional.do' },
  ];
  const insertSup = db.prepare(`INSERT OR IGNORE INTO suppliers (company_name, rnc, contact_name, phone, email) VALUES (?, ?, ?, ?, ?)`);
  suppliers.forEach(s => insertSup.run(s.company_name, s.rnc, s.contact_name, s.phone, s.email));

  // ─── PRODUCTOS ───────────────────────────────────────────────────────────
  const analgesicosId = db.prepare(`SELECT id FROM categories WHERE name = 'Analgésicos'`).get()?.id;
  const antibioticosId = db.prepare(`SELECT id FROM categories WHERE name = 'Antibióticos'`).get()?.id;
  const vitaminasId = db.prepare(`SELECT id FROM categories WHERE name = 'Vitaminas'`).get()?.id;
  const antigripalesId = db.prepare(`SELECT id FROM categories WHERE name = 'Antigripales'`).get()?.id;
  const supId1 = db.prepare(`SELECT id FROM suppliers WHERE rnc = '101-12345-6'`).get()?.id;

  const products = [
    { name: 'Paracetamol 500mg', code: 'PAR500', barcode: '7890001', cat: analgesicosId, ingredient: 'Paracetamol', lab: 'Laboratorios Ramos', presentation: 'Tabletas', concentration: '500mg', cost: 45, price: 75, stock: 450, min_stock: 50 },
    { name: 'Losartán 50mg', code: 'LOS050', barcode: '7890002', cat: analgesicosId, ingredient: 'Losartán potásico', lab: 'Farmacéutica Nacional', presentation: 'Tabletas', concentration: '50mg', cost: 150, price: 280, stock: 320, min_stock: 30 },
    { name: 'Ibuprofeno 400mg', code: 'IBU400', barcode: '7890003', cat: analgesicosId, ingredient: 'Ibuprofeno', lab: 'Laboratorios Ramos', presentation: 'Tabletas', concentration: '400mg', cost: 35, price: 65, stock: 280, min_stock: 40 },
    { name: 'Amoxicilina 500mg', code: 'AMO500', barcode: '7890004', cat: antibioticosId, ingredient: 'Amoxicilina', lab: 'Distribuidora Médica', presentation: 'Cápsulas', concentration: '500mg', cost: 180, price: 350, stock: 180, min_stock: 20, recipe: 1 },
    { name: 'Omeprazol 20mg', code: 'OME020', barcode: '7890005', cat: analgesicosId, ingredient: 'Omeprazol', lab: 'Farmacéutica Nacional', presentation: 'Cápsulas', concentration: '20mg', cost: 60, price: 120, stock: 200, min_stock: 30 },
    { name: 'Vitamina C 500mg', code: 'VTC500', barcode: '7890006', cat: vitaminasId, ingredient: 'Ácido Ascórbico', lab: 'Laboratorios Ramos', presentation: 'Tabletas masticables', concentration: '500mg', cost: 120, price: 220, stock: 350, min_stock: 50 },
    { name: 'Complejo B', code: 'COMB01', barcode: '7890007', cat: vitaminasId, ingredient: 'Complejo B', lab: 'Distribuidora Médica', presentation: 'Tabletas', concentration: 'Vitaminas B', cost: 85, price: 180, stock: 8, min_stock: 20 },
    { name: 'Loratadina 10mg', code: 'LOR010', barcode: '7890008', cat: analgesicosId, ingredient: 'Loratadina', lab: 'Farmacéutica Nacional', presentation: 'Tabletas', concentration: '10mg', cost: 40, price: 80, stock: 3, min_stock: 25 },
    { name: 'Ambroxol Jarabe', code: 'AMBJR1', barcode: '7890009', cat: antigripalesId, ingredient: 'Ambroxol', lab: 'Laboratorios Ramos', presentation: 'Jarabe 120ml', concentration: '15mg/5ml', cost: 95, price: 185, stock: 0, min_stock: 15 },
    { name: 'Metformina 850mg', code: 'MET850', barcode: '7890010', cat: analgesicosId, ingredient: 'Metformina HCl', lab: 'Farmacéutica Nacional', presentation: 'Tabletas', concentration: '850mg', cost: 70, price: 140, stock: 250, min_stock: 30, recipe: 1 },
    { name: 'Enalapril 10mg', code: 'ENA010', barcode: '7890011', cat: analgesicosId, ingredient: 'Enalapril maleato', lab: 'Laboratorios Ramos', presentation: 'Tabletas', concentration: '10mg', cost: 55, price: 110, stock: 175, min_stock: 25 },
    { name: 'Vitamina D3 1000UI', code: 'VTD001', barcode: '7890012', cat: vitaminasId, ingredient: 'Colecalciferol', lab: 'Distribuidora Médica', presentation: 'Cápsulas blandas', concentration: '1000UI', cost: 200, price: 380, stock: 120, min_stock: 20 },
  ];

  const insertProd = db.prepare(`
    INSERT OR IGNORE INTO products (name, code, barcode, category_id, active_ingredient, laboratory, presentation, concentration, cost_price, sale_price, stock, min_stock, requires_recipe, supplier_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  products.forEach(p => insertProd.run(
    p.name, p.code, p.barcode, p.cat, p.ingredient, p.lab, p.presentation,
    p.concentration, p.cost, p.price, p.stock, p.min_stock, p.recipe || 0, supId1
  ));

  // ─── LOTES ───────────────────────────────────────────────────────────────
  const par = db.prepare(`SELECT id FROM products WHERE code = 'PAR500'`).get();
  const amo = db.prepare(`SELECT id FROM products WHERE code = 'AMO500'`).get();
  const vtc = db.prepare(`SELECT id FROM products WHERE code = 'VTC500'`).get();
  const insertBatch = db.prepare(`INSERT OR IGNORE INTO product_batches (product_id, batch_number, expiry_date, quantity) VALUES (?, ?, ?, ?)`);
  if (par) insertBatch.run(par.id, 'LOT-2026-001', '2027-06-30', 450);
  if (amo) insertBatch.run(amo.id, 'LOT-2026-002', '2026-10-15', 180);
  if (vtc) insertBatch.run(vtc.id, 'LOT-2026-003', '2027-12-31', 350);

  // ─── CLIENTES ─────────────────────────────────────────────────────────────
  const clients = [
    { name: 'María González', cedula: '001-2345678-9', phone: '829-555-1001', email: 'maria@email.com' },
    { name: 'José Martínez', cedula: '001-3456789-0', phone: '829-555-1002', email: 'jose@email.com' },
    { name: 'Ana Rodríguez', cedula: '001-4567890-1', phone: '829-555-1003', email: 'ana@email.com' },
    { name: 'Carlos Pérez', cedula: '001-5678901-2', phone: '829-555-1004' },
    { name: 'Carmen Jiménez', cedula: '001-6789012-3', phone: '829-555-1005', email: 'carmen@email.com' },
  ];
  const insertClient = db.prepare(`INSERT OR IGNORE INTO clients (name, cedula, phone, email) VALUES (?, ?, ?, ?)`);
  clients.forEach(c => insertClient.run(c.name, c.cedula, c.phone, c.email || null));

  // ─── SERVICIOS ───────────────────────────────────────────────────────────
  const services = [
    { name: 'Toma de presión arterial', price: 50, duration: 10 },
    { name: 'Medición de glucosa', price: 150, duration: 10 },
    { name: 'Nebulización', price: 300, duration: 20 },
    { name: 'Aplicación de inyección', price: 200, duration: 15 },
    { name: 'Consulta farmacéutica', price: 0, duration: 15 },
  ];
  const insertSvc = db.prepare(`INSERT OR IGNORE INTO services (name, price, duration_minutes) VALUES (?, ?, ?)`);
  services.forEach(s => insertSvc.run(s.name, s.price, s.duration));

  // ─── NCF SECUENCIAS ──────────────────────────────────────────────────────
  const ncfTypes = [
    { type: 'B01', name: 'Factura de Crédito Fiscal', prefix: 'B01', max: 999999, expiry: '2027-12-31' },
    { type: 'B02', name: 'Factura de Consumo', prefix: 'B02', max: 999999, expiry: '2027-12-31' },
    { type: 'B04', name: 'Nota de Débito', prefix: 'B04', max: 999999, expiry: '2027-12-31' },
    { type: 'B14', name: 'Regímenes Especiales', prefix: 'B14', max: 999999, expiry: '2027-12-31' },
    { type: 'B15', name: 'Gubernamentales', prefix: 'B15', max: 999999, expiry: '2027-12-31' },
  ];
  const insertNcf = db.prepare(`INSERT OR IGNORE INTO ncf_sequences (ncf_type, ncf_type_name, prefix, max_sequence, expiry_date) VALUES (?, ?, ?, ?, ?)`);
  ncfTypes.forEach(n => insertNcf.run(n.type, n.name, n.prefix, n.max, n.expiry));

  // ─── CONFIGURACIÓN ───────────────────────────────────────────────────────
  const settings = [
    { key: 'pharmacy_name', value: 'PharmaPlus', desc: 'Nombre de la farmacia' },
    { key: 'pharmacy_rnc', value: '130-00001-1', desc: 'RNC de la farmacia' },
    { key: 'pharmacy_phone', value: '809-555-0000', desc: 'Teléfono principal' },
    { key: 'pharmacy_address', value: 'Av. 27 de Febrero #123, Santo Domingo', desc: 'Dirección' },
    { key: 'pharmacy_email', value: 'info@pharmaplus.do', desc: 'Correo de contacto' },
    { key: 'currency', value: 'RD$', desc: 'Moneda del sistema' },
    { key: 'itbis_rate', value: '0.18', desc: 'Tasa ITBIS (18%)' },
    { key: 'allow_sale_without_stock', value: 'false', desc: 'Permitir ventas sin stock' },
    { key: 'days_before_expiry_alert', value: '30', desc: 'Días antes del vencimiento para alertar' },
    { key: 'min_stock_alert', value: 'true', desc: 'Alertas de stock mínimo activas' },
    { key: 'session_timeout', value: '480', desc: 'Timeout de sesión en minutos' },
    { key: 'password_min_length', value: '6', desc: 'Longitud mínima de contraseña' },
  ];
  const insertSetting = db.prepare(`INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)`);
  settings.forEach(s => insertSetting.run(s.key, s.value, s.desc));

  // ─── VENTAS DE MUESTRA ───────────────────────────────────────────────────
  const adminUser = db.prepare(`SELECT id FROM users WHERE email = 'admin@pharmaplus.do'`).get();
  const cajeroUser = db.prepare(`SELECT id FROM users WHERE email = 'cajero@pharmaplus.do'`).get();
  const insertSale = db.prepare(`INSERT OR IGNORE INTO sales (sale_number, client_id, user_id, subtotal, total, status) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertSaleItem = db.prepare(`INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)`);
  const insertPayment = db.prepare(`INSERT INTO sale_payments (sale_id, payment_method, amount) VALUES (?, ?, ?)`);

  const client1 = db.prepare(`SELECT id FROM clients WHERE cedula = '001-2345678-9'`).get();
  const parProd = db.prepare(`SELECT id, sale_price FROM products WHERE code = 'PAR500'`).get();
  const vtcProd = db.prepare(`SELECT id, sale_price FROM products WHERE code = 'VTC500'`).get();

  if (parProd && client1 && adminUser) {
    const existingSale = db.prepare(`SELECT id FROM sales WHERE sale_number = 'VTA-2026-0001'`).get();
    if (!existingSale) {
      const saleResult = insertSale.run('VTA-2026-0001', client1.id, adminUser.id, 760, 760, 'completada');
      // Create cash register for admin if not exists
      const cashRegInsert = db.prepare(`INSERT OR IGNORE INTO cash_registers (name, user_id, initial_amount, status) VALUES (?, ?, ?, ?)`);
      cashRegInsert.run('Caja Principal', adminUser.id, 0, 'abierta');
      const cashReg = db.prepare(`SELECT id FROM cash_registers WHERE user_id = ?`).get(adminUser.id);
      // Associate sale with cash register
      if (cashReg) {
        db.prepare(`UPDATE sales SET cash_register_id = ? WHERE id = ?`).run(cashReg.id, saleResult.lastInsertRowid);
        // Record cash movement for the sale
        const cashMoveInsert = db.prepare(`INSERT INTO cash_movements (cash_register_id, movement_type, amount, payment_method, reference_id, description, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        cashMoveInsert.run(cashReg.id, 'venta', 760, 'efectivo', saleResult.lastInsertRowid, 'Venta VTA-2026-0001', adminUser.id);
      }
      if (saleResult.lastInsertRowid) {
        insertSaleItem.run(saleResult.lastInsertRowid, parProd.id, 2, parProd.sale_price, parProd.sale_price * 2);
        if (vtcProd) insertSaleItem.run(saleResult.lastInsertRowid, vtcProd.id, 2, vtcProd.sale_price, vtcProd.sale_price * 2);
        insertPayment.run(saleResult.lastInsertRowid, 'efectivo', 760);
      }
    }
  }

  // ─── NOTIFICACIONES DE MUESTRA ───────────────────────────────────────────
  if (adminUser) {
    const insertNotif = db.prepare(`INSERT OR IGNORE INTO notifications (user_id, type, title, message, module, priority) VALUES (?, ?, ?, ?, ?, ?)`);
    insertNotif.run(adminUser.id, 'stock_low', 'Stock bajo: Complejo B', 'El producto Complejo B tiene solo 8 unidades (mínimo: 20)', 'inventario', 'HIGH');
    insertNotif.run(adminUser.id, 'stock_low', 'Stock bajo: Loratadina 10mg', 'El producto Loratadina 10mg tiene solo 3 unidades (mínimo: 25)', 'inventario', 'HIGH');
    insertNotif.run(adminUser.id, 'out_of_stock', 'Producto agotado: Ambroxol Jarabe', 'El producto Ambroxol Jarabe está agotado', 'inventario', 'CRITICAL');
    insertNotif.run(adminUser.id, 'purchase_pending', 'Compra pendiente de recibir', 'Existe una orden de compra pendiente de recepción', 'compras', 'MEDIUM');
    insertNotif.run(adminUser.id, 'system', '¡Bienvenido a PharmaPlus!', 'El sistema ha sido configurado correctamente. Complete su perfil en Configuración.', 'sistema', 'LOW');
  }

  // ─── EMPLEADOS ───────────────────────────────────────────────────────────
  if (adminUser && cajeroUser) {
    const insertEmp = db.prepare(`INSERT OR IGNORE INTO employees (user_id, name, cedula, phone, position, department, hire_date, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    insertEmp.run(adminUser.id, 'Admin Farmacia', '001-0000001-1', '809-000-0001', 'Administrador', 'Administración', '2024-01-01', 75000);
    insertEmp.run(cajeroUser.id, 'Juan Pérez', '001-0000002-2', '809-000-0002', 'Cajero', 'Ventas', '2024-03-15', 35000);
  }

  console.log('✅ Seed data inserted successfully');
  console.log('   👤 admin@pharmaplus.do / admin123');
  console.log('   👤 cajero@pharmaplus.do / cajero123');
}

module.exports = { runSeed };
