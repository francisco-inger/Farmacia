const { getDb } = require('../../db/database');

function getAll(req, res) {
  const db = getDb();
  const { status, supplier_id, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1']; const params = [];
  if (status) { where.push(`p.status = ?`); params.push(status); }
  if (supplier_id) { where.push(`p.supplier_id = ?`); params.push(supplier_id); }
  const purchases = db.prepare(`
    SELECT p.*, s.company_name as supplier_name, u.name as user_name
    FROM purchases p JOIN suppliers s ON p.supplier_id = s.id JOIN users u ON p.user_id = u.id
    WHERE ${where.join(' AND ')} ORDER BY p.order_date DESC LIMIT ? OFFSET ?
  `).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM purchases p WHERE ${where.join(' AND ')}`).get(params).count;
  return res.json({ success: true, data: purchases, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
}

function getById(req, res) {
  const db = getDb();
  const purchase = db.prepare(`SELECT p.*, s.company_name as supplier_name FROM purchases p JOIN suppliers s ON p.supplier_id = s.id WHERE p.id = ?`).get(req.params.id);
  if (!purchase) return res.status(404).json({ success: false, message: 'Compra no encontrada' });
  purchase.items = db.prepare(`SELECT pi.*, pr.name as product_name, pr.code FROM purchase_items pi JOIN products pr ON pi.product_id = pr.id WHERE pi.purchase_id = ?`).all(req.params.id);
  return res.json({ success: true, data: purchase });
}

function create(req, res) {
  const db = getDb();
  const { supplier_id, items, expected_date, notes, status = 'recibida' } = req.body;
  if (!supplier_id || !items || items.length === 0) return res.status(400).json({ success: false, message: 'Proveedor y productos requeridos' });

  const userId = req.user?.id || 1;
  const initialStatus = (status || 'recibida').toLowerCase();

  const transaction = db.transaction(() => {
    const lastPurchase = db.prepare(`SELECT purchase_number FROM purchases ORDER BY id DESC LIMIT 1`).get();
    let nextNum = 1;
    if (lastPurchase && lastPurchase.purchase_number) {
      const parts = lastPurchase.purchase_number.split('-');
      nextNum = parseInt(parts[parts.length - 1]) + 1;
    }
    const purchaseNumber = `COM-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;

    let subtotal = 0;
    for (const item of items) {
      subtotal += Number(item.unit_cost) * Number(item.quantity);
    }

    const result = db.prepare(`
      INSERT INTO purchases (purchase_number, supplier_id, user_id, expected_date, subtotal, total, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(purchaseNumber, supplier_id, userId, expected_date||null, subtotal, subtotal, notes||null, initialStatus);

    const purchaseId = result.lastInsertRowid;

    for (const item of items) {
      const qty = Number(item.quantity);
      const cost = Number(item.unit_cost);
      
      db.prepare(`
        INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, subtotal, batch_number, expiry_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(purchaseId, item.product_id, qty, cost, cost * qty, item.batch_number||null, item.expiry_date||null);

      // IF PURCHASE IS RECEIVED IMMEDIATELY, UPDATE STOCK IN INVENTORY
      if (initialStatus === 'recibida') {
        const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(item.product_id);
        if (product) {
          const prevStock = product.stock || 0;
          const newStock = prevStock + qty;

          // Update stock and cost_price on product
          db.prepare(`
            UPDATE products 
            SET stock = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).run(newStock, cost, item.product_id);

          // Log inventory movement
          db.prepare(`
            INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, user_id)
            VALUES (?, 'entrada', ?, ?, ?, 'compra', ?, ?)
          `).run(item.product_id, qty, prevStock, newStock, purchaseId, userId);
        }
      }
    }

    return db.prepare(`SELECT * FROM purchases WHERE id = ?`).get(purchaseId);
  });

  try {
    const result = transaction();
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('Error creando compra:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
}

function receivePurchase(req, res) {
  const db = getDb();
  const purchase = db.prepare(`SELECT * FROM purchases WHERE id = ?`).get(req.params.id);
  if (!purchase) return res.status(404).json({ success: false, message: 'Compra no encontrada' });

  const currentStatus = (purchase.status || '').toLowerCase();
  if (currentStatus === 'cancelada') {
    return res.status(400).json({ success: false, message: 'No se puede recibir una compra cancelada' });
  }
  // Prevent double processing: if already marked recibida AND has a received_date, skip stock update
  if (currentStatus === 'recibida' && purchase.received_date) {
    return res.status(400).json({ success: false, message: 'Esta compra ya fue recibida y el inventario fue actualizado' });
  }

  const userId = req.user?.id || 1;
  const transaction = db.transaction(() => {
    const items = db.prepare(`SELECT * FROM purchase_items WHERE purchase_id = ?`).all(req.params.id);
    for (const item of items) {
      const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(item.product_id);
      if (!product) continue;
      const prevStock = product.stock || 0;
      const newStock = prevStock + item.quantity;
      db.prepare(`UPDATE products SET stock = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newStock, item.unit_cost, item.product_id);
      db.prepare(`UPDATE purchase_items SET received_quantity = ? WHERE id = ?`).run(item.quantity, item.id);
      if (item.batch_number || item.expiry_date) {
        db.prepare(`INSERT INTO product_batches (product_id, batch_number, expiry_date, quantity, cost_price, supplier_id) VALUES (?, ?, ?, ?, ?, ?)`).run(item.product_id, item.batch_number || `LOT-${Date.now()}`, item.expiry_date||null, item.quantity, item.unit_cost, purchase.supplier_id);
      }
      db.prepare(`INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, user_id) VALUES (?, 'entrada', ?, ?, ?, 'compra', ?, ?)`).run(item.product_id, item.quantity, prevStock, newStock, req.params.id, userId);
    }
    db.prepare(`UPDATE purchases SET status = 'recibida', received_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);
    db.prepare(`INSERT INTO audit_log (user_id, user_name, action, module, description, reference_id) VALUES (?, ?, 'COMPRA_RECIBIDA', 'compras', ?, ?) ON CONFLICT DO NOTHING`).run(userId, req.user?.name || 'Sistema', `Compra ${purchase.purchase_number} recibida`, req.params.id);
  });
  try {
    transaction();
    return res.json({ success: true, message: 'Compra recibida exitosamente e inventario actualizado' });
  } catch (err) {
    console.error('Error en receivePurchase:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
}

function updateStatus(req, res) {
  const db = getDb();
  const { id } = req.params;
  const { status } = req.body;
  if (!id || !status) return res.status(400).json({ success: false, message: 'ID y estado requeridos' });

  const purchase = db.prepare(`SELECT * FROM purchases WHERE id = ?`).get(id);
  if (!purchase) return res.status(404).json({ success: false, message: 'Compra no encontrada' });

  const normStatus = status.toLowerCase();
  const currentStatus = (purchase.status || '').toLowerCase();

  // If changing to recibida and it hasn't been fully received yet, process stock
  if (normStatus === 'recibida' && !(currentStatus === 'recibida' && purchase.received_date)) {
    return receivePurchase(req, res);
  }

  // Otherwise just update the status field
  db.prepare(`UPDATE purchases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(normStatus, id);
  return res.json({ success: true, message: `Estado actualizado a ${status}` });
}

module.exports = { getAll, getById, create, receivePurchase, updateStatus };

