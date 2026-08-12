/**
 * KPI Summary Cards Component
 * Renders executive KPI metrics cards in clean, human-understandable Spanish.
 */

export function renderKpiCards(containerId, kpiData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <!-- Card 1: Total Stock Units -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-label">Inventario Total en Almacén</span>
        <div class="kpi-icon-badge">📦</div>
      </div>
      <div class="kpi-value">${kpiData.totalStockUnits.toLocaleString('es-DO')} <span style="font-size: 14px; font-weight: 500; color: var(--color-text-muted);">unidades</span></div>
      <div class="kpi-subtext">${kpiData.totalMedications} medicamentos registrados · ${kpiData.totalBatches} lotes activos</div>
    </div>

    <!-- Card 2: Expiration 30 Days (Critical) -->
    <div class="kpi-card ${kpiData.exp30Count > 0 ? 'kpi-alert' : ''}">
      <div class="kpi-header">
        <span class="kpi-label">Urgentes ≤ 30 Días</span>
        <div class="kpi-icon-badge">🔴</div>
      </div>
      <div class="kpi-value" style="${kpiData.exp30Count > 0 ? 'color: var(--color-alert);' : ''}">${kpiData.exp30Count} <span style="font-size: 14px; font-weight: 500;">lotes</span></div>
      <div class="kpi-subtext">Lotes por vencer este mes o ya vencidos</div>
    </div>

    <!-- Card 3: Expiration 60-90 Days (Warning / Notice) -->
    <div class="kpi-card kpi-warning">
      <div class="kpi-header">
        <span class="kpi-label">Próximos 60 a 90 Días</span>
        <div class="kpi-icon-badge">⚠️</div>
      </div>
      <div class="kpi-value">${kpiData.exp60Count + kpiData.exp90Count} <span style="font-size: 14px; font-weight: 500;">lotes</span></div>
      <div class="kpi-subtext">${kpiData.exp60Count} a 60 días · ${kpiData.exp90Count} a 90 días</div>
    </div>

    <!-- Card 4: Low Stock Alerts -->
    <div class="kpi-card ${kpiData.lowStockCount > 0 ? 'kpi-warning' : ''}">
      <div class="kpi-header">
        <span class="kpi-label">Productos por Agotarse</span>
        <div class="kpi-icon-badge">📉</div>
      </div>
      <div class="kpi-value">${kpiData.lowStockCount} <span style="font-size: 14px; font-weight: 500;">productos</span></div>
      <div class="kpi-subtext">Existencias por debajo del mínimo de seguridad</div>
    </div>
  `;
}
