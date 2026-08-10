/**
 * POS Farmacia — Main Application (Adrian Felipe)
 * Point of Sale: product search, cart, checkout, receipts
 */

class PosApp {
  constructor() {
    this.cart = [];
    this.salesHistory = [];
    this.dailyTotalCents = 0;
    this.salesCount = 0;

    this.products = [
      { product_id: crypto.randomUUID(), name: "Paracetamol 500mg", active_ingredient: "Acetaminofén", price_cents: 15000, stock: 120, requires_prescription: false, is_controlled: false },
      { product_id: crypto.randomUUID(), name: "Amoxicilina 875mg", active_ingredient: "Amoxicilina", price_cents: 35000, stock: 45, requires_prescription: true, is_controlled: false },
      { product_id: crypto.randomUUID(), name: "Ibuprofeno 400mg", active_ingredient: "Ibuprofeno", price_cents: 12000, stock: 200, requires_prescription: false, is_controlled: false },
      { product_id: crypto.randomUUID(), name: "Losartán 50mg", active_ingredient: "Losartán Potásico", price_cents: 28000, stock: 80, requires_prescription: true, is_controlled: false },
      { product_id: crypto.randomUUID(), name: "Omeprazol 20mg", active_ingredient: "Omeprazol", price_cents: 18000, stock: 95, requires_prescription: false, is_controlled: false },
      { product_id: crypto.randomUUID(), name: "Metformina 850mg", active_ingredient: "Metformina HCl", price_cents: 22000, stock: 60, requires_prescription: true, is_controlled: false },
      { product_id: crypto.randomUUID(), name: "Clonazepam 2mg", active_ingredient: "Clonazepam", price_cents: 45000, stock: 15, requires_prescription: true, is_controlled: true },
      { product_id: crypto.randomUUID(), name: "Loratadina 10mg", active_ingredient: "Loratadina", price_cents: 9500, stock: 150, requires_prescription: false, is_controlled: false },
      { product_id: crypto.randomUUID(), name: "Diclofenaco 50mg", active_ingredient: "Diclofenaco Sódico", price_cents: 11000, stock: 110, requires_prescription: false, is_controlled: false },
      { product_id: crypto.randomUUID(), name: "Alprazolam 0.5mg", active_ingredient: "Alprazolam", price_cents: 52000, stock: 10, requires_prescription: true, is_controlled: true },
      { product_id: crypto.randomUUID(), name: "Cetirizina 10mg", active_ingredient: "Cetirizina", price_cents: 8500, stock: 180, requires_prescription: false, is_controlled: false },
      { product_id: crypto.randomUUID(), name: "Atorvastatina 20mg", active_ingredient: "Atorvastatina Cálcica", price_cents: 32000, stock: 55, requires_prescription: true, is_controlled: false }
    ];

    this.initUI();
    this.renderProducts(this.products);
  }

  initUI() {
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = this.products.filter(p =>
        p.name.toLowerCase().includes(q) || p.active_ingredient.toLowerCase().includes(q)
      );
      this.renderProducts(filtered);
    });

    document.getElementById('btnClearCart')?.addEventListener('click', () => this.clearCart());
    document.getElementById('btnPayCash')?.addEventListener('click', () => this.checkout('cash'));
    document.getElementById('btnPayCard')?.addEventListener('click', () => this.checkout('card'));
    document.getElementById('btnPayInsurance')?.addEventListener('click', () => this.checkout('insurance'));
  }

  renderProducts(list) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = '';
    list.forEach(p => {
      const card = document.createElement('div');
      card.className = `product-card${p.is_controlled ? ' controlled' : ''}`;
      card.innerHTML = `
        ${p.is_controlled ? '<span class="product-badge">Controlado</span>' : ''}
        <div class="product-name">${p.name}</div>
        <div class="product-active">${p.active_ingredient}</div>
        <div class="product-price">${this.formatDOP(p.price_cents)}</div>
        <div class="product-stock">Stock: ${p.stock} uds</div>
      `;
      card.addEventListener('click', () => this.addToCart(p));
      grid.appendChild(card);
    });
  }

  addToCart(product) {
    if (product.is_controlled) {
      const hasRx = confirm(`⚠️ "${product.name}" es un medicamento CONTROLADO.\n¿El cliente presenta receta médica válida?`);
      if (!hasRx) { alert('🚫 Venta bloqueada: se requiere receta para medicamentos controlados.'); return; }
    }
    const existing = this.cart.find(i => i.product_id === product.product_id);
    if (existing) { existing.quantity++; } else { this.cart.push({ ...product, quantity: 1 }); }
    this.renderCart();
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.product_id !== productId);
    this.renderCart();
  }

  updateQty(productId, delta) {
    const item = this.cart.find(i => i.product_id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) this.removeFromCart(productId);
    else this.renderCart();
  }

  clearCart() { this.cart = []; this.renderCart(); }

  renderCart() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    if (this.cart.length === 0) {
      container.innerHTML = '<div class="cart-empty">El carrito está vacío. Agrega productos del catálogo.</div>';
    } else {
      container.innerHTML = '';
      this.cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-qty">
            <button data-id="${item.product_id}" data-delta="-1">−</button>
            <span>${item.quantity}</span>
            <button data-id="${item.product_id}" data-delta="1">+</button>
          </div>
          <div class="cart-item-total">${this.formatDOP(item.price_cents * item.quantity)}</div>
        `;
        div.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => this.updateQty(btn.dataset.id, parseInt(btn.dataset.delta)));
        });
        container.appendChild(div);
      });
    }
    this.updateTotals();
  }

  updateTotals() {
    const subtotalCents = this.cart.reduce((s, i) => s + i.price_cents * i.quantity, 0);
    const taxCents = Math.round(subtotalCents * 0.18);
    const totalCents = subtotalCents + taxCents;
    document.getElementById('cartSubtotal').textContent = this.formatDOP(subtotalCents);
    document.getElementById('cartTax').textContent = this.formatDOP(taxCents);
    document.getElementById('cartTotal').textContent = this.formatDOP(totalCents);
    document.getElementById('valCartCount').textContent = this.cart.reduce((s, i) => s + i.quantity, 0);
    const controlled = this.cart.filter(i => i.is_controlled).length;
    document.getElementById('valPrescriptionAlerts').textContent = controlled;
  }

  checkout(method) {
    if (this.cart.length === 0) { alert('El carrito está vacío.'); return; }
    const subtotalCents = this.cart.reduce((s, i) => s + i.price_cents * i.quantity, 0);
    const taxCents = Math.round(subtotalCents * 0.18);
    const totalCents = subtotalCents + taxCents;

    const sale = {
      sale_id: crypto.randomUUID(),
      items: this.cart.map(i => ({ product_id: i.product_id, product_name: i.name, quantity: i.quantity, unit_price_cents: i.price_cents, subtotal_cents: i.price_cents * i.quantity })),
      total_cents: totalCents,
      currency: 'DOP',
      payment_method: method,
      created_at: new Date().toISOString()
    };

    this.salesHistory.unshift(sale);
    this.dailyTotalCents += totalCents;
    this.salesCount++;
    this.cart = [];
    this.renderCart();
    this.updateMetrics();
    this.renderSalesHistory();
    alert(`✅ Venta registrada por ${this.formatDOP(totalCents)} (${method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : 'Seguro ARS'})`);
  }

  updateMetrics() {
    document.getElementById('valDailySales').textContent = this.formatDOP(this.dailyTotalCents);
    document.getElementById('valSalesCount').textContent = `${this.salesCount} transacciones`;
    const avg = this.salesCount > 0 ? Math.round(this.dailyTotalCents / this.salesCount) : 0;
    document.getElementById('valAvgTicket').textContent = this.formatDOP(avg);
  }

  renderSalesHistory() {
    const tbody = document.getElementById('salesHistoryBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    this.salesHistory.forEach(s => {
      const tr = document.createElement('tr');
      const time = new Date(s.created_at).toLocaleTimeString('es-DO');
      const methodLabel = { cash: '💵 Efectivo', card: '💳 Tarjeta', insurance: '🏥 ARS' }[s.payment_method];
      tr.innerHTML = `<td><code>${s.sale_id.slice(0,8)}…</code></td><td>${time}</td><td>${s.items.length}</td><td><strong>${this.formatDOP(s.total_cents)}</strong></td><td>${methodLabel}</td><td style="color:var(--color-success);font-weight:600;">● paid</td>`;
      tbody.appendChild(tr);
    });
  }

  formatDOP(cents) { return 'RD$ ' + (cents / 100).toLocaleString('es-DO', { minimumFractionDigits: 2 }); }
}

document.addEventListener('DOMContentLoaded', () => { window.posApp = new PosApp(); });
