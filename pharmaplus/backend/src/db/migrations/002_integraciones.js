const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

function runIntegracionesMigrations() {
  const db = getDb();

  // ─── TABLA DE CONECTORES EXTERNOS ──────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS external_connectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connector_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      provider_type TEXT NOT NULL, -- 'lab', 'ars', 'dgii', 'custom'
      endpoint_url TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
      auth_type TEXT DEFAULT 'bearer',
      config_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS insurance_coverages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coverage_id TEXT NOT NULL UNIQUE,
      patient_name TEXT NOT NULL,
      card_number TEXT NOT NULL,
      insurance_provider TEXT NOT NULL, -- 'ARS Humano', 'ARS Palic', 'Senasa', 'ARS Universal'
      coverage_percent INTEGER NOT NULL DEFAULT 80,
      max_coverage_cents INTEGER NOT NULL DEFAULT 5000000, -- en centavos (RD$50,000.00)
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS external_webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webhook_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      event_type TEXT NOT NULL, -- 'sale.created', 'stock.updated', 'ars.payment_confirmed', 'invoice.issued'
      target_url TEXT NOT NULL,
      secret TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS integration_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id TEXT NOT NULL UNIQUE,
      connector_name TEXT NOT NULL,
      event_type TEXT NOT NULL,
      status_code INTEGER NOT NULL DEFAULT 200,
      payload_json TEXT,
      response_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed datos por defecto si no existen
  const connectorCount = db.prepare('SELECT COUNT(*) as count FROM external_connectors').get().count;
  if (connectorCount === 0) {
    const insertConnector = db.prepare(`
      INSERT INTO external_connectors (connector_id, name, provider_type, endpoint_url, status, config_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertConnector.run(
      'conn-' + uuidv4().substring(0, 8),
      'Laboratorios Ramos Sync API',
      'lab',
      'https://api.laboratoriosramos.com/v1/catalog',
      'active',
      JSON.stringify({ syncFrequencyHours: 12, autoUpdatePrices: true })
    );

    insertConnector.run(
      'conn-' + uuidv4().substring(0, 8),
      'ARS Humano Cobertura en Tiempo Real',
      'ars',
      'https://api.arshumano.com.do/v2/authorization',
      'active',
      JSON.stringify({ timeoutMs: 3000, requireAuthCode: true })
    );

    insertConnector.run(
      'conn-' + uuidv4().substring(0, 8),
      'DGII Comprobantes Fiscales NCF Gateway',
      'dgii',
      'https://dgii.gov.do/ws/ncf-validation',
      'active',
      JSON.stringify({ environment: 'production', rncVerify: true })
    );

    insertConnector.run(
      'conn-' + uuidv4().substring(0, 8),
      'Distribuidora Médica del Caribe API',
      'lab',
      'https://api.dmc.do/v1/products',
      'active',
      JSON.stringify({ syncFrequencyHours: 24 })
    );
  }

  const insuranceCount = db.prepare('SELECT COUNT(*) as count FROM insurance_coverages').get().count;
  if (insuranceCount === 0) {
    const insertCoverage = db.prepare(`
      INSERT INTO insurance_coverages (coverage_id, patient_name, card_number, insurance_provider, coverage_percent, max_coverage_cents, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertCoverage.run('cov-' + uuidv4().substring(0, 8), 'María González', 'HUM-987654', 'ARS Humano', 80, 5000000, 'active');
    insertCoverage.run('cov-' + uuidv4().substring(0, 8), 'José Martínez', 'PAL-123456', 'ARS Palic', 75, 4500000, 'active');
    insertCoverage.run('cov-' + uuidv4().substring(0, 8), 'Ana Rodríguez', 'SEN-554433', 'Senasa', 90, 6000000, 'active');
    insertCoverage.run('cov-' + uuidv4().substring(0, 8), 'Carlos Pérez', 'UNI-887766', 'ARS Universal', 70, 3000000, 'active');
  }

  const webhookCount = db.prepare('SELECT COUNT(*) as count FROM external_webhooks').get().count;
  if (webhookCount === 0) {
    const insertWebhook = db.prepare(`
      INSERT INTO external_webhooks (webhook_id, name, event_type, target_url, secret, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertWebhook.run(
      'wh-' + uuidv4().substring(0, 8),
      'Notificación de Pago ARS Humano',
      'ars.payment_confirmed',
      'https://pharmaplus.do/api/integrations/webhooks/ars-callback',
      'whsec_' + uuidv4().replace(/-/g, ''),
      'active'
    );

    insertWebhook.run(
      'wh-' + uuidv4().substring(0, 8),
      'Sincronización Stock con Distribuidor',
      'stock.updated',
      'https://api.dmc.do/webhooks/pharmaplus-stock',
      'whsec_' + uuidv4().replace(/-/g, ''),
      'active'
    );
  }

  console.log('✅ Migraciones del módulo Integraciones ejecutadas correctamente.');
}

module.exports = { runIntegracionesMigrations };
