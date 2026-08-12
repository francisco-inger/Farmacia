// Migration to create many-to-many relationship between suppliers and products
// Located in the unified db/migrations folder

function runSupplierProducts(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS supplier_products (
      supplier_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      PRIMARY KEY (supplier_id, product_id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ supplier_products table created with price column');
}

module.exports = { runSupplierProducts };
