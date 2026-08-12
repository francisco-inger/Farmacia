/**
 * Alert Service
 * Evaluates inventory batches and generates automatic alerts for:
 * 1. Expiration windows (90 / 60 / 30 days before expiration)
 * 2. Expired batches
 * 3. Low stock & Critical stock thresholds
 * 
 * Strict Color Code Policy:
 * #D64550 -> Exclusively reserved for CRITICAL alerts (Expired, <=30 days to expire, or critical stock).
 * #E6A23C -> WARNING alerts (31-60 days to expire, low stock).
 * #0E8F7E -> NOTICE alerts (61-90 days to expire, informatory).
 */

export class AlertService {
  /**
   * @param {import('./inventoryService.js').InventoryService} inventoryService 
   */
  constructor(inventoryService) {
    this.inventoryService = inventoryService;
  }

  /**
   * Evaluates all medications and batches to generate complete alerts list
   * @returns {import('../types/inventory.types.js').StockAlert[]}
   */
  generateAllAlerts() {
    const alerts = [];
    const medications = this.inventoryService.getAllMedications();
    const nowMs = Date.now();

    medications.forEach(med => {
      const validStock = this.inventoryService.getValidStockQuantity(med.id);

      // Check overall medication low stock
      if (validStock <= med.minStockThreshold) {
        const isZeroOrCritical = validStock <= Math.ceil(med.minStockThreshold * 0.25);
        alerts.push({
          id: this.inventoryService.generateUUID(),
          medicationId: med.id,
          tradeName: med.tradeName,
          alertType: isZeroOrCritical ? 'CRITICAL_STOCK' : 'LOW_STOCK',
          daysToExpiration: 9999,
          currentQuantity: validStock,
          message: isZeroOrCritical
            ? `Quedan solo ${validStock} unidades disponibles en almacén. El nivel mínimo de seguridad es de ${med.minStockThreshold} unidades. Es necesario realizar un pedido de compra inmediato.`
            : `El inventario disponible (${validStock} u.) ha alcanzado el punto de reorden recomendado (${med.minStockThreshold} u.). Se sugiere solicitar reposición a los proveedores.`,
          severity: isZeroOrCritical ? 'CRITICAL' : 'WARNING',
          colorCode: isZeroOrCritical ? '#D64550' : '#E6A23C',
          timestamp: new Date().toISOString()
        });
      }

      // Check per-batch expiration windows
      med.batches.forEach(batch => {
        if (batch.quantity <= 0) return;

        const expMs = new Date(batch.expirationDate).getTime();
        const diffDays = Math.ceil((expMs - nowMs) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          // Expired
          alerts.push({
            id: this.inventoryService.generateUUID(),
            medicationId: med.id,
            tradeName: med.tradeName,
            batchId: batch.id,
            lotNumber: batch.lotNumber,
            alertType: 'EXPIRED',
            daysToExpiration: diffDays,
            currentQuantity: batch.quantity,
            message: `El lote número ${batch.lotNumber} venció hace ${Math.abs(diffDays)} días (hay ${batch.quantity} unidades en estante). Por normas sanitarias, debe ser retirado de la venta de inmediato.`,
            severity: 'CRITICAL',
            colorCode: '#D64550',
            timestamp: new Date().toISOString()
          });
        } else if (diffDays <= 30) {
          // Critical 30-day window
          alerts.push({
            id: this.inventoryService.generateUUID(),
            medicationId: med.id,
            tradeName: med.tradeName,
            batchId: batch.id,
            lotNumber: batch.lotNumber,
            alertType: 'EXPIRATION_CRITICAL_30',
            daysToExpiration: diffDays,
            currentQuantity: batch.quantity,
            message: `Le quedan solo ${diffDays} días de vigencia al lote ${batch.lotNumber} (${batch.quantity} unidades). Se recomienda priorizar su despacho en mostrador antes de su fecha límite.`,
            severity: 'CRITICAL',
            colorCode: '#D64550',
            timestamp: new Date().toISOString()
          });
        } else if (diffDays <= 60) {
          // Warning 60-day window
          alerts.push({
            id: this.inventoryService.generateUUID(),
            medicationId: med.id,
            tradeName: med.tradeName,
            batchId: batch.id,
            lotNumber: batch.lotNumber,
            alertType: 'EXPIRATION_WARNING_60',
            daysToExpiration: diffDays,
            currentQuantity: batch.quantity,
            message: `El lote ${batch.lotNumber} vencerá en aproximadamente ${diffDays} días (${batch.quantity} unidades). Mantener bajo seguimiento de rotación.`,
            severity: 'WARNING',
            colorCode: '#E6A23C',
            timestamp: new Date().toISOString()
          });
        } else if (diffDays <= 90) {
          // Notice 90-day window
          alerts.push({
            id: this.inventoryService.generateUUID(),
            medicationId: med.id,
            tradeName: med.tradeName,
            batchId: batch.id,
            lotNumber: batch.lotNumber,
            alertType: 'EXPIRATION_NOTICE_90',
            daysToExpiration: diffDays,
            currentQuantity: batch.quantity,
            message: `Aviso preventivo a 3 meses: El lote ${batch.lotNumber} vence en ${diffDays} días (${batch.quantity} unidades).`,
            severity: 'NOTICE',
            colorCode: '#0E8F7E',
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    const severityOrder = { CRITICAL: 1, WARNING: 2, NOTICE: 3 };
    return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Get KPI metrics summary
   */
  getKpiSummary() {
    const allAlerts = this.generateAllAlerts();
    const medications = this.inventoryService.getAllMedications();

    let totalBatches = 0;
    let totalStockUnits = 0;
    medications.forEach(m => {
      totalBatches += m.batches.length;
      totalStockUnits += this.inventoryService.getValidStockQuantity(m.id);
    });

    const criticalCount = allAlerts.filter(a => a.severity === 'CRITICAL').length;
    const exp30Count = allAlerts.filter(a => a.alertType === 'EXPIRATION_CRITICAL_30' || a.alertType === 'EXPIRED').length;
    const exp60Count = allAlerts.filter(a => a.alertType === 'EXPIRATION_WARNING_60').length;
    const exp90Count = allAlerts.filter(a => a.alertType === 'EXPIRATION_NOTICE_90').length;
    const lowStockCount = allAlerts.filter(a => a.alertType === 'LOW_STOCK' || a.alertType === 'CRITICAL_STOCK').length;

    return {
      totalMedications: medications.length,
      totalBatches,
      totalStockUnits,
      criticalCount,
      exp30Count,
      exp60Count,
      exp90Count,
      lowStockCount
    };
  }
}
