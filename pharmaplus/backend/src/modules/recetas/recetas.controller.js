const { getDb } = require('../../db/database');

function getAll(req, res) {
  const db = getDb();
  const { status, client_id, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1']; const params = [];
  if (status) { where.push(`r.status = ?`); params.push(status); }
  if (client_id) { where.push(`r.client_id = ?`); params.push(client_id); }
  const recipes = db.prepare(`
    SELECT r.*, c.name as client_name, u.name as created_by_name
    FROM recipes r LEFT JOIN clients c ON r.client_id = c.id LEFT JOIN users u ON r.created_by = u.id
    WHERE ${where.join(' AND ')} ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all([...params, parseInt(limit), offset]);
  const total = db.prepare(`SELECT COUNT(*) as count FROM recipes r WHERE ${where.join(' AND ')}`).get(params).count;
  return res.json({ success: true, data: recipes, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
}

function getById(req, res) {
  const db = getDb();
  const recipe = db.prepare(`SELECT r.*, c.name as client_name FROM recipes r LEFT JOIN clients c ON r.client_id = c.id WHERE r.id = ?`).get(req.params.id);
  if (!recipe) return res.status(404).json({ success: false, message: 'Receta no encontrada' });
  recipe.items = db.prepare(`SELECT ri.*, p.name as product_name FROM recipe_items ri LEFT JOIN products p ON ri.product_id = p.id WHERE ri.recipe_id = ?`).all(req.params.id);
  return res.json({ success: true, data: recipe });
}

function create(req, res) {
  const db = getDb();
  const { client_id, doctor_name, recipe_number, recipe_date, diagnosis, items, notes } = req.body;
  const transaction = db.transaction(() => {
    const result = db.prepare(`INSERT INTO recipes (client_id, doctor_name, recipe_number, recipe_date, diagnosis, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(client_id||null, doctor_name||null, recipe_number||null, recipe_date||null, diagnosis||null, notes||null, req.user.id);
    const recipeId = result.lastInsertRowid;
    if (items && items.length > 0) {
      for (const item of items) {
        db.prepare(`INSERT INTO recipe_items (recipe_id, product_id, medication_name, dose, frequency, duration, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(recipeId, item.product_id||null, item.medication_name||null, item.dose||null, item.frequency||null, item.duration||null, item.quantity||null);
      }
    }
    return db.prepare(`SELECT * FROM recipes WHERE id = ?`).get(recipeId);
  });
  try {
    const result = transaction();
    return res.status(201).json({ success: true, data: result });
  } catch (err) { return res.status(400).json({ success: false, message: err.message }); }
}

function updateStatus(req, res) {
  const db = getDb();
  const { status } = req.body;
  db.prepare(`UPDATE recipes SET status = ? WHERE id = ?`).run(status, req.params.id);
  return res.json({ success: true, message: 'Estado actualizado' });
}

module.exports = { getAll, getById, create, updateStatus };
