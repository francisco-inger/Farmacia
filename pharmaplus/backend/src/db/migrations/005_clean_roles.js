const { getDb } = require('../database');

function runCleanRoles() {
  const db = getDb();

  // 1. Ensure only Administrador and Cajero exist
  db.exec(`
    INSERT OR IGNORE INTO roles (name, description) VALUES ('Administrador', 'Acceso total y configuración del sistema');
    INSERT OR IGNORE INTO roles (name, description) VALUES ('Cajero', 'Acceso al sistema POS y caja');
  `);

  const adminRole = db.prepare(`SELECT id FROM roles WHERE name = 'Administrador'`).get();
  const cajeroRole = db.prepare(`SELECT id FROM roles WHERE name = 'Cajero'`).get();

  if (!adminRole || !cajeroRole) {
    console.error('❌ No se pudieron crear los roles base');
    return;
  }

  // 2. Reasignar usuarios con roles no reconocidos → Administrador
  const validRoleIds = [adminRole.id, cajeroRole.id];
  const usersToFix = db.prepare(
    `SELECT id, role_id FROM users WHERE role_id NOT IN (${validRoleIds.join(',')})`
  ).all();

  if (usersToFix.length > 0) {
    console.log(`⚠️  Reasignando ${usersToFix.length} usuario(s) con roles obsoletos → Administrador`);
    db.prepare(`UPDATE users SET role_id = ? WHERE role_id NOT IN (${validRoleIds.join(',')})`)
      .run(adminRole.id);
  }

  // 3. Eliminar roles que ya no se usan
  db.prepare(`DELETE FROM roles WHERE id NOT IN (${validRoleIds.join(',')})`).run();

  console.log('✅ Migración 005: Roles simplificados a Administrador y Cajero');
}

module.exports = { runCleanRoles };
