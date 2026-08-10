/**
 * Anomaly Detector Component
 * Visualizes products with unusual rotation rates (unusual spikes or stagnant stock) in human-understandable terms.
 */

export function renderAnomalyDetector(containerId, anomalies) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const itemsHtml = anomalies.map(anom => {
    let badgeStyle = 'background: var(--color-primary-soft); color: var(--color-primary-dark); font-weight: 700;';
    let humanBadgeText = 'Venta Regular (Normal)';
    
    if (anom.anomalyType === 'UNUSUAL_HIGH_SPIKE') {
      badgeStyle = 'background: var(--color-alert-soft); color: var(--color-alert); font-weight:700;';
      humanBadgeText = '🔥 Demanda Inusual (Salida Acelerada)';
    } else if (anom.anomalyType === 'STAGNANT_STOCK') {
      badgeStyle = 'background: var(--color-warning-soft); color: var(--color-warning); font-weight:700;';
      humanBadgeText = '💤 Producto Estancado (Baja Rotación)';
    }

    return `
      <div class="content-card" style="margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h4 style="font-family: var(--font-heading); font-size: 16px; font-weight: 700;">${anom.tradeName}</h4>
          <span class="badge" style="${badgeStyle}; padding: 6px 12px; font-size: 13px;">${humanBadgeText}</span>
        </div>
        <p style="font-size: 14px; color: var(--color-text); line-height: 1.5; margin-bottom: 12px;">${anom.description}</p>
        
        <div style="font-size: 13px; color: var(--color-text-muted); display: flex; gap: 24px; background: var(--color-bg); padding: 10px 14px; border-radius: var(--radius-sm);">
          <span>📊 Promedio Habitual: <strong>${anom.normalDailyRate} unidades/día</strong></span>
          <span>⚡ Venta Real Detectada Hoy: <strong>${anom.currentDailyRate} unidades/día</strong></span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card-title-group">
      <div>
        <h2>⚡ Inteligencia Artificial — Detección de Rotación Anómala</h2>
        <p style="font-size: 13px; color: var(--color-text-muted);">Alertas automáticas cuando la velocidad de venta de un medicamento se acelera inesperadamente o se queda estancada en estantería</p>
      </div>
    </div>
    <div>
      ${itemsHtml}
    </div>
  `;
}
