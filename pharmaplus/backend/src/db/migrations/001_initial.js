const { getDb } = require('../database');

function runMigrations() {
  const db = getDb();

  // ─── ROLES & PERMISOS ────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      UNIQUE(module, action)
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );

    -- ─── USUARIOS ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role_id INTEGER NOT NULL DEFAULT 2,
      phone TEXT,
      avatar TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login DATETIME,
      login_attempts INTEGER DEFAULT 0,
      locked_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    -- ─── CATEGORÍAS ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT DEFAULT '#16a085',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ─── PROVEEDORES ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      rnc TEXT UNIQUE,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      payment_terms INTEGER DEFAULT 30,
      credit_limit REAL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ─── PRODUCTOS ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      barcode TEXT UNIQUE,
      category_id INTEGER,
      active_ingredient TEXT,
      laboratory TEXT,
      presentation TEXT,
      concentration TEXT,
      cost_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      margin_percent REAL GENERATED ALWAYS AS (
        CASE WHEN cost_price > 0 THEN ROUND(((sale_price - cost_price) / cost_price) * 100, 2) ELSE 0 END
      ) STORED,
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 5,
      max_stock INTEGER NOT NULL DEFAULT 100,
      requires_recipe INTEGER NOT NULL DEFAULT 0,
      is_controlled INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      image_url TEXT,
      notes TEXT,
      supplier_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- ─── LOTES ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS product_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      batch_number TEXT NOT NULL,
      expiry_date DATE,
      quantity INTEGER NOT NULL DEFAULT 0,
      cost_price REAL,
      supplier_id INTEGER,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- ─── MOVIMIENTOS DE INVENTARIO ───────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      batch_id INTEGER,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('entrada','salida','ajuste','transferencia','devolucion')),
      quantity INTEGER NOT NULL,
      previous_stock INTEGER,
      new_stock INTEGER,
      reference_type TEXT,
      reference_id INTEGER,
      notes TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- ─── CLIENTES ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cedula TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      address TEXT,
      birth_date DATE,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ─── RECETAS ────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      doctor_name TEXT,
      recipe_number TEXT,
      recipe_date DATE,
      diagnosis TEXT,
      status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente','parcial','dispensada','vencida','cancelada')),
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS recipe_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      product_id INTEGER,
      medication_name TEXT,
      dose TEXT,
      frequency TEXT,
      duration TEXT,
      quantity INTEGER,
      dispensed_quantity INTEGER DEFAULT 0,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- ─── SERVICIOS ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      duration_minutes INTEGER DEFAULT 15,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      service_id INTEGER NOT NULL,
      employee_id INTEGER,
      sale_id INTEGER,
      price REAL NOT NULL,
      status TEXT DEFAULT 'completado',
      notes TEXT,
      performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (service_id) REFERENCES services(id),
      FOREIGN KEY (employee_id) REFERENCES users(id)
    );

    -- ─── NCF SECUENCIAS ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS ncf_sequences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ncf_type TEXT NOT NULL UNIQUE,
      ncf_type_name TEXT,
      prefix TEXT NOT NULL,
      current_sequence INTEGER NOT NULL DEFAULT 0,
      max_sequence INTEGER NOT NULL DEFAULT 999999,
      expiry_date DATE,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ─── VENTAS ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_number TEXT UNIQUE,
      client_id INTEGER,
      user_id INTEGER NOT NULL,
      cash_register_id INTEGER,
      recipe_id INTEGER,
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completada' CHECK(status IN ('completada','anulada','devuelta','suspendida')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      batch_id INTEGER,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      subtotal REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS sale_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('efectivo','tarjeta','transferencia','otro')),
      amount REAL NOT NULL,
      reference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sale_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reason TEXT,
      total REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- ─── FACTURAS ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE,
      sale_id INTEGER,
      client_id INTEGER,
      ncf TEXT,
      ncf_type TEXT,
      rnc_cedula TEXT,
      client_name TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'emitida' CHECK(status IN ('pendiente','emitida','anulada','pagada')),
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    -- ─── COMPRAS ────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_number TEXT UNIQUE,
      supplier_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_date DATE DEFAULT CURRENT_DATE,
      expected_date DATE,
      received_date DATE,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'borrador' CHECK(status IN ('borrador','pendiente','enviada','recibida','parcial','cancelada')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      received_quantity INTEGER DEFAULT 0,
      unit_cost REAL NOT NULL,
      subtotal REAL NOT NULL,
      batch_number TEXT,
      expiry_date DATE,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- ─── EMPLEADOS ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      cedula TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      position TEXT,
      department TEXT,
      hire_date DATE,
      salary REAL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date DATE NOT NULL,
      check_in TIME,
      check_out TIME,
      status TEXT DEFAULT 'presente' CHECK(status IN ('presente','ausente','tardanza','permiso','vacaciones')),
      notes TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- ─── CAJAS ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS cash_registers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT 'Caja Principal',
      user_id INTEGER NOT NULL,
      initial_amount REAL NOT NULL DEFAULT 0,
      expected_amount REAL DEFAULT 0,
      counted_amount REAL,
      difference REAL,
      status TEXT NOT NULL DEFAULT 'abierta' CHECK(status IN ('abierta','cerrada')),
      opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cash_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cash_register_id INTEGER NOT NULL,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('venta','retiro','ingreso','devolucion','gasto','apertura','cierre')),
      amount REAL NOT NULL,
      payment_method TEXT,
      reference_id INTEGER,
      description TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- ─── NOTIFICACIONES ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      module TEXT,
      reference_id INTEGER,
      priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      stock_alerts INTEGER DEFAULT 1,
      expiry_alerts INTEGER DEFAULT 1,
      purchase_alerts INTEGER DEFAULT 1,
      sales_alerts INTEGER DEFAULT 1,
      system_alerts INTEGER DEFAULT 1,
      alert_days_before_expiry INTEGER DEFAULT 30,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- ─── AUDITORÍA ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      description TEXT,
      reference_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- ─── CONVERSACIONES IA ──────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT DEFAULT 'Nueva conversación',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
    );

    -- ─── CONFIGURACIÓN ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ─── ÍNDICES ────────────────────────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
    CREATE INDEX IF NOT EXISTS idx_batches_product ON product_batches(product_id);
    CREATE INDEX IF NOT EXISTS idx_batches_expiry ON product_batches(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_log(module);
  `);

  console.log('✅ Migrations completed successfully');
}

module.exports = { runMigrations };
