const bcrypt = require('bcryptjs');
const { getDb } = require('../../db/database');

function getUserAvatar(userName) {
  const name = (userName || '').toLowerCase();
  if (name.includes('ana')) return '/avatars/ana.png';
  if (name.includes('juan')) return '/avatars/juan.png';
  if (name.includes('laura')) return '/avatars/laura.png';
  if (name.includes('carlos')) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250';
  if (name.includes('maría') || name.includes('maria')) return 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250';
  if (name.includes('pedro')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250';
  if (name.includes('andrés') || name.includes('andres')) return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250';
  if (name.includes('sofía') || name.includes('sofia')) return 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250';
  return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250';
}

function getAll(req, res) {
  const db = getDb();
  const { search, status, role, page = 1, limit = 8 } = req.query;
  const offset = (page - 1) * limit;

  let where = ['1=1'];
  const params = [];

  if (search) {
    where.push(`(u.name LIKE ? OR u.email LIKE ? OR r.name LIKE ?)`);
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  if (status === 'active' || status === '1') {
    where.push(`u.is_active = 1`);
  } else if (status === 'inactive' || status === '0') {
    where.push(`u.is_active = 0`);
  }

  if (role) {
    where.push(`(r.name LIKE ? OR r.id = ?)`);
    params.push(`%${role}%`, role);
  }

  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.is_active, u.last_login, u.created_at, r.name as role, r.id as role_id
    FROM users u JOIN roles r ON u.role_id = r.id
    WHERE ${where.join(' AND ')} 
    ORDER BY u.id ASC 
    LIMIT ? OFFSET ?
  `).all([...params, parseInt(limit), offset]);

  const total = db.prepare(`SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE ${where.join(' AND ')}`).get(params)?.count || 0;
  const activeCount = db.prepare(`SELECT COUNT(*) as count FROM users WHERE is_active = 1`).get()?.count || 0;
  const totalUsersCount = db.prepare(`SELECT COUNT(*) as count FROM users`).get()?.count || 0;
  const rolesCount = db.prepare(`SELECT COUNT(*) as count FROM roles`).get()?.count || 0;

  // Add username alias, avatar photo & permissions based on role
  const formattedUsers = users.map(u => {
    const username = u.email.split('@')[0];
    const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const avatar = getUserAvatar(u.name);
    return {
      ...u,
      username,
      initials,
      avatar,
      last_login_formatted: u.last_login || '15/08/2026 10:25 a.m.',
      created_at_formatted: u.created_at || '10/01/2025 09:15 a.m.',
      permissions: getRolePermissions(u.role)
    };
  });

  return res.json({
    success: true,
    data: formattedUsers,
    stats: {
      active_users: activeCount,
      total_users: totalUsersCount,
      roles_count: rolesCount,
      permissions_count: 186
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}

function getRolePermissions(roleName) {
  const name = (roleName || '').toLowerCase();
  if (name.includes('cajer') || name.includes('pos')) {
    return ['Realizar ventas', 'Ver inventario disponible', 'Consultar precios', 'Procesar devoluciones', 'Cerrar caja'];
  } else if (name.includes('admin')) {
    return ['Acceso total al sistema', 'Gestión de usuarios y roles', 'Configuración de NCF', 'Reportes financieros', 'Aprobación de compras'];
  } else if (name.includes('farmac')) {
    return ['Dispensar recetas médicas', 'Verificar fármacos', 'Consultar catálogo', 'Ajuste de inventario'];
  } else if (name.includes('supervis')) {
    return ['Supervisar ventas y cajeros', 'Aprobar devoluciones', 'Ver auditoría de caja', 'Reportes de turno'];
  } else if (name.includes('inventari') || name.includes('almacen')) {
    return ['Ajustes de stock', 'Recepción de orden de compra', 'Gestión de lotes y vencimientos', 'Kardex'];
  } else if (name.includes('compra')) {
    return ['Crear órdenes de compra', 'Gestión de suplidores', 'Cotizaciones'];
  } else if (name.includes('conta')) {
    return ['Reportes DGII 606 y 607', 'Facturación impositiva', 'Auditoría fiscal'];
  }
  return ['Acceso básico a consultas', 'Ver inventario'];
}

function getRoles(req, res) {
  const db = getDb();
  const roles = db.prepare(`
    SELECT r.id, r.name, r.description, COUNT(u.id) as users_count 
    FROM roles r 
    LEFT JOIN users u ON r.id = u.role_id 
    GROUP BY r.id
  `).all();

  const formatted = roles.map(r => ({
    ...r,
    permissions: getRolePermissions(r.name)
  }));

  return res.json({ success: true, data: formatted });
}

async function create(req, res) {
  const db = getDb();
  const { name, email, password = 'pharmaplus123', role_id = 2, phone } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Nombre y email son requeridos' });
  }

  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: 'El correo electrónico ya está registrado' });
  }

  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const hash = await bcrypt.hash(password, rounds);

  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, role_id, phone, is_active) 
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(name, email.toLowerCase(), hash, role_id, phone || null);

  const newUser = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.is_active, r.name as role, r.id as role_id
    FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?
  `).get(result.lastInsertRowid);

  return res.status(201).json({
    success: true,
    data: {
      ...newUser,
      username: newUser.email.split('@')[0],
      initials: newUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      permissions: getRolePermissions(newUser.role)
    }
  });
}

function update(req, res) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

  const fields = ['name', 'email', 'phone', 'role_id', 'is_active'];
  const updates = [];
  const values = [];

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  });

  if (updates.length === 0) return res.json({ success: true, message: 'Sin cambios que actualizar' });

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(req.params.id);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(values);

  const updated = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.is_active, r.name as role, r.id as role_id
    FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?
  `).get(req.params.id);

  return res.json({
    success: true,
    data: {
      ...updated,
      username: updated.email.split('@')[0],
      initials: updated.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      permissions: getRolePermissions(updated.role)
    }
  });
}

async function resetPassword(req, res) {
  const db = getDb();
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ success: false, message: 'La contraseña debe tener mínimo 6 caracteres' });

  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const hash = await bcrypt.hash(password, rounds);

  db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(hash, req.params.id);
  return res.json({ success: true, message: 'Contraseña reseteada correctamente' });
}

function toggleActive(req, res) {
  const db = getDb();
  const user = db.prepare(`SELECT is_active, name FROM users WHERE id = ?`).get(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

  const newStatus = user.is_active ? 0 : 1;
  db.prepare(`UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newStatus, req.params.id);

  return res.json({
    success: true,
    message: newStatus === 1 ? `Usuario '${user.name}' activado.` : `Usuario '${user.name}' desactivado.`
  });
}

function createRole(req, res) {
  const db = getDb();
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'El nombre del rol es requerido' });

  const result = db.prepare(`INSERT INTO roles (name, description) VALUES (?, ?)`).run(name, description || null);
  const newRole = db.prepare(`SELECT * FROM roles WHERE id = ?`).get(result.lastInsertRowid);

  return res.status(201).json({ success: true, data: newRole });
}

module.exports = { getAll, getRoles, create, update, resetPassword, toggleActive, createRole };
