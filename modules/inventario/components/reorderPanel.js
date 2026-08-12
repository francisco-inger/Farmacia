/**
 * Reorder Suggestion Panel Component
 * Displays dynamic purchase reorder recommendations calculated from AI demand predictions in clear human Spanish.
 */

function formatHumanMoney(cents) {
  const amount = (cents / 100);
  return `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function renderReorderPanel(containerId, suggestions, onGenerateOrderClick) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalCostCents = suggestions.reduce((sum, s) => sum + s.estimatedCostCents, 0);
  const formattedTotalCost = formatHumanMoney(totalCostCents);

  const rowsHtml = suggestions.map(s => {
    const formattedCost = formatHumanMoney(s.estimatedCostCents);
    
    let priorityBadge = '<span class="badge badge-success">🟢 Opcional</span>';
    if (s.priority === 'HIGH') priorityBadge = '<span class="badge badge-alert" style="font-weight:700;">🔴 Inmediata / Urgente</span>';
    else if (s.priority === 'MEDIUM') priorityBadge = '<span class="badge badge-warning" style="font-weight:700;">🟠 Recomendada</span>';

    return `
      <tr>
        <td style="font-weight: 700; color: var(--color-text); font-size: 15px;">${s.tradeName}</td>
        <td><strong>${s.currentStock.toLocaleString('es-DO')} u.</strong></td>
        <td>${s.minStockThreshold.toLocaleString('es-DO')} u.</td>
        <td><strong>${s.predictedMonthlyDemand.toLocaleString('es-DO')} u.</strong></td>
        <td style="font-weight: 700; color: var(--color-primary-dark); font-size: 16px;">+${s.suggestedOrderQuantity.toLocaleString('es-DO')} u.</td>
        <td style="font-weight: 600; font-size: 14px;">${formattedCost}</td>
        <td>${priorityBadge}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card-title-group">
      <div>
        <h2>🛒 Sugerencias Inteligentes de Reorden y Pedidos de Compra</h2>
        <p style="font-size: 13px; color: var(--color-text-muted);">Cálculo sugerido de unidades a pedir a proveedores para evitar desabastecimiento, ajustado por los modelos de IA</p>
      </div>
      <div style="text-align: right; background: var(--color-primary-soft); padding: 10px 16px; border-radius: var(--radius-md); border: 1px solid rgba(14, 143, 126, 0.2);">
        <div style="font-size: 12px; color: var(--color-text-muted);">Monto Total Estimado del Pedido</div>
        <div style="font-family: var(--font-heading); font-size: 22px; font-weight: 700; color: var(--color-primary-dark);">${formattedTotalCost}</div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Medicamento</th>
            <th>Stock Actual</th>
            <th>Mínimo Seguro</th>
            <th>Venta Est. (Mes)</th>
            <th>Cantidad a Pedir</th>
            <th>Inversión Estimada</th>
            <th>Prioridad</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <div style="margin-top: 24px; text-align: right;">
      <button class="btn btn-primary" id="btn-export-purchase-order" style="padding: 12px 24px; font-size: 15px;">
        🛒 Generar Orden de Compra Sugerida
      </button>
    </div>
  `;

  const btnExport = container.querySelector('#btn-export-purchase-order');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      if (onGenerateOrderClick) onGenerateOrderClick(suggestions);
    });
  }
}
