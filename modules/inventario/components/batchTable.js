/**
 * Batch Table & Management Component
 * Displays medications with expanded lot breakdown, expiration dates, and stock status in human readable format.
 */

// Helper to format ISO dates to readable human Spanish dates
function formatHumanDate(isoDateStr) {
  if (!isoDateStr) return '';
  const d = new Date(isoDateStr);
  return d.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Helper to format money in Dominican Pesos / Currency
function formatHumanMoney(cents) {
  const amount = (cents / 100);
  return `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function renderBatchTable(containerId, medications, inventoryService, onAddBatchClick) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const nowMs = Date.now();

  const rowsHtml = medications.map(med => {
    const validStock = inventoryService.getValidStockQuantity(med.id);
    const formattedPrice = formatHumanMoney(med.priceCents);
    
    const batchesHtml = med.batches.map(b => {
      const expMs = new Date(b.expirationDate).getTime();
      const diffDays = Math.ceil((expMs - nowMs) / (1000 * 60 * 60 * 24));
      
      let badgeClass = 'badge-success';
      let statusText = `🟢 Vigente (${diffDays} días)`;
      
      if (diffDays <= 0) {
        badgeClass = 'badge-alert';
        statusText = `⛔ VENCIDO (Hace ${Math.abs(diffDays)} días)`;
      } else if (diffDays <= 30) {
        badgeClass = 'badge-alert';
        statusText = `🔴 Vence pronto (${diffDays} días)`;
      } else if (diffDays <= 60) {
        badgeClass = 'badge-warning';
        statusText = `🟠 Vence en ${diffDays} días`;
      } else if (diffDays <= 90) {
        badgeClass = 'badge-success';
        statusText = `🟡 Vence en ${diffDays} días`;
      }

      const formattedExpDate = formatHumanDate(b.expirationDate);

      return `
        <tr style="background-color: #F9FAF9; font-size: 13px;">
          <td style="padding-left: 36px; border-left: 3px solid var(--color-primary);">
            ↳ Lote: <strong>${b.lotNumber}</strong>
          </td>
          <td><strong>${b.quantity.toLocaleString('es-DO')}</strong> unidades</td>
          <td>📅 <strong>${formattedExpDate}</strong></td>
          <td><span class="badge ${badgeClass}">${statusText}</span></td>
          <td><span style="font-size: 11px; color: var(--color-text-muted);">Lote Registrado</span></td>
        </tr>
      `;
    }).join('');

    const isLowStock = validStock <= med.minStockThreshold;

    return `
      <tr style="border-top: 2px solid var(--color-border);">
        <td style="font-weight: 700; color: var(--color-primary-dark); font-size: 15px;">
          ${med.tradeName}
          <br><span style="font-size: 13px; font-weight: 400; color: var(--color-text-muted);">Principio Activo: ${med.activeIngredient} · Categoría: ${med.category}</span>
        </td>
        <td>
          <span style="font-size: 16px; font-weight: 700;">${validStock.toLocaleString('es-DO')} u.</span>
          ${isLowStock ? '<span class="badge badge-warning" style="margin-left:8px;">⚠️ Stock Bajo</span>' : '<span class="badge badge-success" style="margin-left:8px;">✔ Con Stock</span>'}
        </td>
        <td style="font-weight: 600;">${formattedPrice}</td>
        <td>
          ${med.requiresPrescription ? '<span class="badge badge-warning">📋 Con Receta</span>' : '<span class="badge badge-success">🟢 Venta Libre</span>'}
          ${med.isControlled ? '<span class="badge badge-alert" style="margin-left:4px;">🔒 Controlado</span>' : ''}
        </td>
        <td style="text-align: right;">
          <button class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;" data-med-id="${med.id}">
            ➕ Registrar Nuevo Lote
          </button>
        </td>
      </tr>
      ${batchesHtml}
    `;
  }).join('');

  container.innerHTML = `
    <div class="card-title-group">
      <div>
        <h2>📦 Inventario y Control de Existencias por Lote</h2>
        <p style="font-size: 13px; color: var(--color-text-muted);">Consulta detallada de medicamentos, lotes disponibles, fechas de caducidad y estado de inventario</p>
      </div>
      <button class="btn btn-primary" id="btn-new-medication">➕ Registrar Medicamento</button>
    </div>
    
    <div class="table-responsive">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Medicamento / Lote</th>
            <th>Existencias Disponibles</th>
            <th>Precio por Unidad</th>
            <th>Clasificación</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('[data-med-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const medId = e.currentTarget.getAttribute('data-med-id');
      if (onAddBatchClick) onAddBatchClick(medId);
    });
  });
}
