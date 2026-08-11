const { getDb } = require('../../db/database');

function getAll(req, res) {
  const db = getDb();
  const { status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1']; const params = [];
  if (status) { where.push(`i.status = ?`); params.push(status); }
  const invoices = db.prepare(`
    SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
    WHERE ${where.join(' AND ')} ORDER BY i.issued_at DESC LIMIT ? OFFSET ?
  `).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM invoices i WHERE ${where.join(' AND ')}`).get(params).count;
  return res.json({ success: true, data: invoices, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
}

function getById(req, res) {
  const db = getDb();
  const invoice = db.prepare(`SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?`).get(req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Factura no encontrada' });
  return res.json({ success: true, data: invoice });
}

function createInvoice(req, res) {
  const db = getDb();
  const { sale_id, client_id, ncf_type, rnc_cedula, client_name, subtotal, tax, discount, total } = req.body;
  const transaction = db.transaction(() => {
    const lastInv = db.prepare(`SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1`).get();
    let nextNum = 1;
    if (lastInv && lastInv.invoice_number) { const parts = lastInv.invoice_number.split('-'); nextNum = parseInt(parts[parts.length - 1]) + 1; }
    const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(nextNum).padStart(6, '0')}`;
    let ncf = null;
    if (ncf_type) {
      const seq = db.prepare(`SELECT * FROM ncf_sequences WHERE ncf_type = ? AND is_active = 1`).get(ncf_type);
      if (seq) {
        const newSeq = seq.current_sequence + 1;
        if (newSeq > seq.max_sequence) throw new Error(`Secuencia NCF ${ncf_type} agotada`);
        ncf = `${seq.prefix}${String(newSeq).padStart(8, '0')}`;
        db.prepare(`UPDATE ncf_sequences SET current_sequence = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newSeq, seq.id);
      }
    }
    const result = db.prepare(`INSERT INTO invoices (invoice_number, sale_id, client_id, ncf, ncf_type, rnc_cedula, client_name, subtotal, tax, discount, total) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(invoiceNumber, sale_id||null, client_id||null, ncf, ncf_type||null, rnc_cedula||null, client_name||null, subtotal||0, tax||0, discount||0, total||0);
    return db.prepare(`SELECT * FROM invoices WHERE id = ?`).get(result.lastInsertRowid);
  });
  try {
    const result = transaction();
    return res.status(201).json({ success: true, data: result });
  } catch (err) { return res.status(400).json({ success: false, message: err.message }); }
}

function cancelInvoice(req, res) {
  const db = getDb();
  db.prepare(`UPDATE invoices SET status = 'anulada' WHERE id = ?`).run(req.params.id);
  db.prepare(`INSERT INTO audit_log (user_id, user_name, action, module, description, reference_id) VALUES (?, ?, 'FACTURA_ANULADA', 'facturacion', ?, ?)`).run(req.user.id, req.user.name, `Factura anulada. Motivo: ${req.body.reason || 'No especificado'}`, req.params.id);
  return res.json({ success: true, message: 'Factura anulada' });
}

function getNcfSequences(req, res) {
  const db = getDb();
  const sequences = db.prepare(`SELECT * FROM ncf_sequences ORDER BY ncf_type`).all();
  return res.json({ success: true, data: sequences });
}

module.exports = { getAll, getById, createInvoice, cancelInvoice, getNcfSequences };
