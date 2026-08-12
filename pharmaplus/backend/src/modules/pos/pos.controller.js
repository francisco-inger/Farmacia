const { getDb } = require('../../db/database');

function createSale(req, res) {
  const db = getDb();
  const { client_id, items, payments, discount = 0, points_discount = 0, notes } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Se requiere al menos un producto' });
  if (!payments || payments.length === 0) return res.status(400).json({ success: false, message: 'Se requiere al menos un método de pago' });

  const transaction = db.transaction(() => {
    // Generar número de venta
    const lastSale = db.prepare(`SELECT sale_number FROM sales ORDER BY id DESC LIMIT 1`).get();
    let nextNum = 1;
    if (lastSale && lastSale.sale_number) {
      const parts = lastSale.sale_number.split('-');
      nextNum = parseInt(parts[parts.length - 1]) + 1;
    }
    const saleNumber = `VTA-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;

    // Calcular totales
    let subtotal = 0;
    const processedItems = [];
    for (const item of items) {
      const product = db.prepare(`SELECT * FROM products WHERE id = ? AND is_active = 1`).get(item.product_id);
      if (!product) throw new Error(`Producto ID ${item.product_id} no encontrado`);
      if (product.stock < item.quantity) throw new Error(`Stock insuficiente para ${product.name} (Disponible: ${product.stock})`);
      const itemSubtotal = product.sale_price * item.quantity;
      const itemDiscount = item.discount || 0;
      subtotal += itemSubtotal - itemDiscount;
      processedItems.push({ ...item, unit_price: product.sale_price, subtotal: itemSubtotal - itemDiscount, product });
    }

    // Total: subtotal minus item discounts, minus points discount
    const totalDiscount = parseFloat(discount) + parseFloat(points_discount);
    const total = Math.max(0, subtotal - totalDiscount);

    // Verificar pagos (puntos ya descontados del total)
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPayments < total - 0.01) throw new Error('El monto pagado es insuficiente');

    // Buscar caja abierta del usuario
    const cashRegister = db.prepare(`SELECT id FROM cash_registers WHERE user_id = ? AND status = 'abierta' ORDER BY opened_at DESC LIMIT 1`).get(req.user.id);

    // Crear venta
    const saleResult = db.prepare(`
      INSERT INTO sales (sale_number, client_id, user_id, cash_register_id, subtotal, discount, total, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(saleNumber, client_id || null, req.user.id, cashRegister?.id || null, subtotal, totalDiscount, total, notes || null);
    const saleId = saleResult.lastInsertRowid;

    // Crear items y descontar inventario
    for (const item of processedItems) {
      db.prepare(`INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount, subtotal) VALUES (?, ?, ?, ?, ?, ?)`).run(saleId, item.product_id, item.quantity, item.unit_price, item.discount || 0, item.subtotal);
      const newStock = item.product.stock - item.quantity;
      db.prepare(`UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newStock, item.product_id);
      db.prepare(`INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, user_id) VALUES (?, 'salida', ?, ?, ?, 'venta', ?, ?)`).run(item.product_id, -item.quantity, item.product.stock, newStock, saleId, req.user.id);

      // Alertas de stock bajo
      if (newStock <= item.product.min_stock && newStock > 0) {
        db.prepare(`INSERT INTO notifications (user_id, type, title, message, module, priority) SELECT u.id, 'stock_low', ?, ?, 'inventario', 'HIGH' FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'admin'`).run(`Stock bajo: ${item.product.name}`, `El producto ${item.product.name} tiene ${newStock} unidades (mínimo: ${item.product.min_stock})`);
      } else if (newStock === 0) {
        db.prepare(`INSERT INTO notifications (user_id, type, title, message, module, priority) SELECT u.id, 'out_of_stock', ?, ?, 'inventario', 'CRITICAL' FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'admin'`).run(`Agotado: ${item.product.name}`, `El producto ${item.product.name} se ha agotado`);
      }
    }

    // Registrar pagos
    for (const payment of payments) {
      db.prepare(`INSERT INTO sale_payments (sale_id, payment_method, amount, reference) VALUES (?, ?, ?, ?)`).run(saleId, payment.method, payment.amount, payment.reference || null);
      if (cashRegister) {
        db.prepare(`INSERT INTO cash_movements (cash_register_id, movement_type, amount, payment_method, reference_id, description, user_id) VALUES (?, 'venta', ?, ?, ?, ?, ?)`).run(cashRegister.id, payment.amount, payment.method, saleId, `Venta ${saleNumber}`, req.user.id);
      }
    }

    // Actualizar puntos y nivel de fidelización del cliente
    if (client_id) {
      const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(client_id);
      if (client) {
        const pointsEarned = Math.floor(total / 100); // 1 punto por cada RD$ 100
        const pointsRedeemed = parseFloat(points_discount) || 0;
        const newPoints = Math.max(0, (client.points || 0) - pointsRedeemed) + pointsEarned;
        const newTotalSpent = (client.total_spent || 0) + total;
        const newTotalPurchases = (client.total_purchases || 0) + 1;
        const newTier = newTotalSpent >= 1500 ? 'Oro' : newTotalSpent >= 500 ? 'Plata' : 'Bronce';
        db.prepare(
          `UPDATE clients SET points = ?, tier = ?, total_spent = ?, total_purchases = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).run(newPoints, newTier, newTotalSpent, newTotalPurchases, client_id);
      }
    }

    // Auditoría
    db.prepare(`INSERT INTO audit_log (user_id, user_name, action, module, description, reference_id) VALUES (?, ?, 'VENTA_CREADA', 'pos', ?, ?)`).run(req.user.id, req.user.name, `Venta ${saleNumber} por RD$ ${total.toFixed(2)}`, saleId);

    const sale = db.prepare(`SELECT * FROM sales WHERE id = ?`).get(saleId);
    const saleItems = db.prepare(`SELECT si.*, p.name as product_name FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`).all(saleId);
    const salePayments = db.prepare(`SELECT * FROM sale_payments WHERE sale_id = ?`).all(saleId);
    // Return updated client points if applicable
    const updatedClient = client_id ? db.prepare(`SELECT id, points, tier, total_spent, total_purchases FROM clients WHERE id = ?`).get(client_id) : null;
    return { ...sale, items: saleItems, payments: salePayments, change: totalPayments - total, updatedClient };
  });


  try {
    const result = transaction();
    return res.status(201).json({ success: true, message: 'Venta creada exitosamente', data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

function getSales(req, res) {
  const db = getDb();
  const { date, status, user_id, client_id, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1']; const params = [];
  if (date) { where.push(`DATE(s.created_at) = ?`); params.push(date); }
  if (status) { where.push(`s.status = ?`); params.push(status); }
  if (user_id) { where.push(`s.user_id = ?`); params.push(user_id); }
  if (client_id) { where.push(`s.client_id = ?`); params.push(client_id); }
  const sales = db.prepare(`
    SELECT s.*, u.name as user_name, c.name as client_name
    FROM sales s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN clients c ON s.client_id = c.id
    WHERE ${where.join(' AND ')} ORDER BY s.created_at DESC LIMIT ? OFFSET ?
  `).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM sales s WHERE ${where.join(' AND ')}`).get(params).count;
  return res.json({ success: true, data: sales, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
}

function getSaleById(req, res) {
  const db = getDb();
  const sale = db.prepare(`SELECT s.*, u.name as user_name, c.name as client_name FROM sales s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN clients c ON s.client_id = c.id WHERE s.id = ?`).get(req.params.id);
  if (!sale) return res.status(404).json({ success: false, message: 'Venta no encontrada' });
  sale.items = db.prepare(`SELECT si.*, p.name as product_name, p.code FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`).all(req.params.id);
  sale.payments = db.prepare(`SELECT * FROM sale_payments WHERE sale_id = ?`).all(req.params.id);
  return res.json({ success: true, data: sale });
}

function cancelSale(req, res) {
  const db = getDb();
  const sale = db.prepare(`SELECT * FROM sales WHERE id = ?`).get(req.params.id);
  if (!sale) return res.status(404).json({ success: false, message: 'Venta no encontrada' });
  if (sale.status !== 'completada') return res.status(400).json({ success: false, message: 'Solo se pueden anular ventas completadas' });

  const transaction = db.transaction(() => {
    db.prepare(`UPDATE sales SET status = 'anulada', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);
    const items = db.prepare(`SELECT * FROM sale_items WHERE sale_id = ?`).all(req.params.id);
    for (const item of items) {
      const product = db.prepare(`SELECT stock FROM products WHERE id = ?`).get(item.product_id);
      const newStock = product.stock + item.quantity;
      db.prepare(`UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newStock, item.product_id);
      db.prepare(`INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, user_id) VALUES (?, 'devolucion', ?, ?, ?, 'anulacion', ?, 'Anulación de venta', ?)`).run(item.product_id, item.quantity, product.stock, newStock, req.params.id, req.user.id);
    }
    db.prepare(`INSERT INTO audit_log (user_id, user_name, action, module, description, reference_id) VALUES (?, ?, 'VENTA_ANULADA', 'pos', ?, ?)`).run(req.user.id, req.user.name, `Venta ${sale.sale_number} anulada. Motivo: ${req.body.reason || 'No especificado'}`, req.params.id);
  });

  try {
    transaction();
    return res.json({ success: true, message: 'Venta anulada exitosamente' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { createSale, getSales, getSaleById, cancelSale };
