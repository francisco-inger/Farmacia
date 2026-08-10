/**
 * Demand Forecast & AI Seasonal Predictor Component
 * Renders AI seasonal predictions, historical comparisons, and seasonal trend selector in human clear format.
 */

export function renderDemandForecastChart(containerId, predictions, demandPredictorAI, onSeasonSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const currentSeasonKey = demandPredictorAI.getCurrentSeasonKey();
  const seasonProfiles = demandPredictorAI.seasonalProfiles;
  const activeProfile = seasonProfiles[currentSeasonKey];

  const cardsHtml = predictions.map(pred => {
    const isSurged = pred.seasonalMultiplier > 1.2;
    const percentageInc = Math.round((pred.seasonalMultiplier - 1) * 100);
    
    return `
      <div class="content-card" style="margin-bottom: 16px; border-left: 5px solid ${isSurged ? 'var(--color-primary)' : 'var(--color-border)'};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <h4 style="font-family: var(--font-heading); font-size: 16px; font-weight: 700;">${pred.tradeName}</h4>
            <span style="font-size: 13px; color: var(--color-text-muted);">Principio Activo: ${pred.activeIngredient}</span>
          </div>
          <span class="badge ${isSurged ? 'badge-success' : ''}" style="font-weight:700; font-size:13px; padding:6px 12px;">
            ${isSurged ? `📈 +${percentageInc}% de Demanda Esperada` : '↔️ Demanda Habitual'}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 12px; background: var(--color-bg); padding: 14px; border-radius: var(--radius-sm);">
          <div>
            <div style="font-size: 12px; color: var(--color-text-muted);">Venta Promedio Mensual</div>
            <div style="font-weight: 700; font-size: 16px; color: var(--color-text);">${pred.historicalAvgMonthlyDemand.toLocaleString('es-DO')} u.</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--color-text-muted);">Impacto Estacional IA</div>
            <div style="font-weight: 700; font-size: 16px; color: var(--color-primary-dark);">${isSurged ? `+${percentageInc}% de incremento` : 'Sin variación'}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--color-text-muted);">Pronóstico de Venta (Mes)</div>
            <div style="font-weight: 700; font-size: 17px; color: var(--color-primary);">${pred.predictedMonthlyDemand.toLocaleString('es-DO')} u.</div>
          </div>
        </div>

        <div style="font-size: 13px; color: var(--color-text); background: var(--color-primary-soft); padding: 12px; border-radius: var(--radius-sm);">
          💡 <strong>Recomendación de Compra Inteligente:</strong> ${pred.recommendation}
          <div style="font-size: 11px; color: var(--color-text-muted); margin-top: 6px;">Nivel de precisión del algoritmo de IA: <strong>${Math.round(pred.confidenceScore * 100)}% de certeza</strong></div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card-title-group">
      <div>
        <h2>🤖 Inteligencia Artificial — Predicción de Demanda Estacional</h2>
        <p style="font-size: 13px; color: var(--color-text-muted);">Modelos predictivos para anticipar picos de venta según la época del año (Gripe, Alergias, Virus de temporada)</p>
      </div>
    </div>

    <!-- Active Season Banner -->
    <div class="season-banner">
      <div class="season-icon">🌡️</div>
      <div class="season-info" style="flex: 1;">
        <h3>${activeProfile.name}</h3>
        <p style="margin-top: 4px; font-size: 14px; line-height: 1.4;">${activeProfile.recommendation}</p>
      </div>
      <div>
        <label style="display:block; font-size:11px; font-weight:700; color:var(--color-primary-dark); margin-bottom:4px;">CAMBIAR TEMPORADA:</label>
        <select id="season-selector" class="form-control" style="width: auto; background: white; font-weight: 600; cursor: pointer;">
          <option value="WINTER_FLU" ${currentSeasonKey === 'WINTER_FLU' ? 'selected' : ''}>❄️ Invierno (Gripe / Fiebre)</option>
          <option value="SPRING_ALLERGY" ${currentSeasonKey === 'SPRING_ALLERGY' ? 'selected' : ''}>🌸 Primavera (Alergias)</option>
          <option value="SUMMER_GASTRO" ${currentSeasonKey === 'SUMMER_GASTRO' ? 'selected' : ''}>☀️ Verano (Gastrointestinal)</option>
          <option value="AUTUMN_RESPIRATORY" ${currentSeasonKey === 'AUTUMN_RESPIRATORY' ? 'selected' : ''}>🍂 Otoño (Respiratorio)</option>
        </select>
      </div>
    </div>

    <div>
      ${cardsHtml}
    </div>
  `;

  const selector = container.querySelector('#season-selector');
  if (selector) {
    selector.addEventListener('change', (e) => {
      if (onSeasonSelect) onSeasonSelect(e.target.value);
    });
  }
}
