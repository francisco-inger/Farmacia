/**
 * Automatic Expiration & Stock Alert Panel Component
 * Displays interactive alert feed filterable by 90, 60, and 30 day windows in warm, clear Spanish.
 */

export function renderAlertPanel(containerId, alerts, onFilterChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const currentFilter = container.getAttribute('data-active-filter') || 'ALL';

  const filteredAlerts = alerts.filter(alert => {
    if (currentFilter === 'ALL') return true;
    if (currentFilter === '30_DAYS') return alert.alertType === 'EXPIRATION_CRITICAL_30' || alert.alertType === 'EXPIRED';
    if (currentFilter === '60_DAYS') return alert.alertType === 'EXPIRATION_WARNING_60';
    if (currentFilter === '90_DAYS') return alert.alertType === 'EXPIRATION_NOTICE_90';
    if (currentFilter === 'LOW_STOCK') return alert.alertType === 'LOW_STOCK' || alert.alertType === 'CRITICAL_STOCK';
    return true;
  });

  const alertItemsHtml = filteredAlerts.map(alert => {
    let icon = '🔔';
    let humanBadgeText = 'Aviso de Inventario';
    
    if (alert.alertType === 'EXPIRED') {
      icon = '⛔';
      humanBadgeText = 'Lote Vencido (Retirar)';
    } else if (alert.alertType === 'EXPIRATION_CRITICAL_30') {
      icon = '🔴';
      humanBadgeText = 'Vence en ≤ 30 Días';
    } else if (alert.alertType === 'EXPIRATION_WARNING_60') {
      icon = '🟠';
      humanBadgeText = 'Vence en 31-60 Días';
    } else if (alert.alertType === 'EXPIRATION_NOTICE_90') {
      icon = '🟡';
      humanBadgeText = 'Vence en 61-90 Días';
    } else if (alert.alertType === 'CRITICAL_STOCK') {
      icon = '🚨';
      humanBadgeText = 'Agotado / Crítico';
    } else if (alert.alertType === 'LOW_STOCK') {
      icon = '📉';
      humanBadgeText = 'Stock Bajo';
    }

    const formattedTime = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `
      <div class="alert-item severity-${alert.severity}">
        <div class="alert-icon">${icon}</div>
        <div class="alert-details" style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
            <h4 style="font-size: 16px;">${alert.tradeName} ${alert.lotNumber ? `<span style="font-weight:400; font-size:13px; color:var(--color-text-muted);">(Lote ${alert.lotNumber})</span>` : ''}</h4>
            <span class="badge" style="background:${alert.colorCode}; color:white; font-size:12px; font-weight:700; padding:4px 10px;">${humanBadgeText}</span>
          </div>
          <p style="font-size: 14px; color: var(--color-text); line-height: 1.4; margin-bottom: 8px;">${alert.message}</p>
          <div class="alert-meta">
            <span>📦 Cantidad afectada: <strong>${alert.currentQuantity} u.</strong></span>
            ${alert.daysToExpiration < 9000 ? `<span>⏳ Tiempo restante: <strong>${alert.daysToExpiration} días</strong></span>` : ''}
            <span>🕒 Notificado a las ${formattedTime}</span>
          </div>
        </div>
      </div>
    `;
  }).join('') || '<div style="padding: 40px; text-align: center; color: var(--color-text-muted); font-size: 15px;">No hay alertas pendientes bajo esta categoría.</div>';

  container.innerHTML = `
    <div class="card-title-group">
      <div>
        <h2>🚨 Panel de Alertas y Semáforo de Vencimiento</h2>
        <p style="font-size: 13px; color: var(--color-text-muted);">Monitoreo preventivo a 90, 60 y 30 días antes de caducar. El color rojo (#D64550) indica retiros urgentes o existencias agotadas.</p>
      </div>
      <span class="tab-badge badge-alert" style="font-size: 13px; padding: 4px 12px;">${alerts.length} Alertas Activas</span>
    </div>

    <div class="alert-filters">
      <button class="filter-chip ${currentFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">Todas las Alertas (${alerts.length})</button>
      <button class="filter-chip chip-critical ${currentFilter === '30_DAYS' ? 'active' : ''}" data-filter="30_DAYS">🔴 Urgente (≤ 30 Días / Vencidos)</button>
      <button class="filter-chip ${currentFilter === '60_DAYS' ? 'active' : ''}" data-filter="60_DAYS">🟠 Advertencia (31-60 Días)</button>
      <button class="filter-chip ${currentFilter === '90_DAYS' ? 'active' : ''}" data-filter="90_DAYS">🟡 Preventivo (61-90 Días)</button>
      <button class="filter-chip ${currentFilter === 'LOW_STOCK' ? 'active' : ''}" data-filter="LOW_STOCK">📉 Productos por Agotarse</button>
    </div>

    <div class="alert-list">
      ${alertItemsHtml}
    </div>
  `;

  container.querySelectorAll('[data-filter]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const filter = e.currentTarget.getAttribute('data-filter');
      container.setAttribute('data-active-filter', filter);
      renderAlertPanel(containerId, alerts, onFilterChange);
    });
  });
}
