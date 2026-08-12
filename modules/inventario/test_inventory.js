/**
 * Test Suite — Módulo Inventario y Vencimientos
 * Automated verification runner for Ana María's module.
 */

import { InventoryService } from './services/inventoryService.js';
import { AlertService } from './services/alertService.js';
import { DemandPredictorAI } from './services/demandPredictorAI.js';
import { StockDeductionContract } from './contracts/stockDeductionContract.js';

function runTests() {
  console.log('----------------------------------------------------');
  console.log('🧪 EJECUTANDO SUITE DE PRUEBAS DE INVENTARIO');
  console.log('----------------------------------------------------\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  // Test 1: Inventory Service & Seed Data
  const invService = new InventoryService();
  const medications = invService.getAllMedications();
  assert(medications.length >= 5, `Se cargaron los medicamentos iniciales de prueba (${medications.length})`);

  // Test 2: FEFO Deduction Strategy
  const paracetamol = medications.find(m => m.tradeName.includes('Paracetamol'));
  assert(Boolean(paracetamol), 'Medicamento Paracetamol encontrado');

  const initialStock = invService.getValidStockQuantity(paracetamol.id);
  const contract = new StockDeductionContract(invService);
  const deductQty = 15;

  const deductResult = contract.deductStock(paracetamol.id, deductQty);
  assert(deductResult.success === true, `Descuento FEFO de ${deductQty} unidades exitoso`);
  assert(deductResult.deductedQuantity === deductQty, `Cantidad descontada exactamente igual a la solicitada (${deductQty} u.)`);
  
  const remainingStock = invService.getValidStockQuantity(paracetamol.id);
  assert(remainingStock === initialStock - deductQty, `Stock restante validado correctamente (${remainingStock} u.)`);

  // Verify FEFO batch deduction order
  const firstBatchDeducted = deductResult.batchDeductions[0];
  assert(firstBatchDeducted.lotNumber === 'PAR-2026-A1', `FEFO: Se consumió primero el lote más próximo a vencer (${firstBatchDeducted.lotNumber})`);

  // Test 3: Alert System (30, 60, 90 days & Critical color #D64550)
  const alertService = new AlertService(invService);
  const alerts = alertService.generateAllAlerts();
  assert(alerts.length > 0, `Sistema generó ${alerts.length} alertas automáticas`);

  const exp30Alerts = alerts.filter(a => a.alertType === 'EXPIRATION_CRITICAL_30' || a.alertType === 'EXPIRED');
  assert(exp30Alerts.length > 0, `Detección exitosa de lotes en ventana ≤ 30 días (${exp30Alerts.length} alertas)`);
  assert(exp30Alerts.every(a => a.colorCode === '#D64550'), 'Regla de diseño cumplida: Alertas críticas usan código de color reservado #D64550');

  const exp60Alerts = alerts.filter(a => a.alertType === 'EXPIRATION_WARNING_60');
  assert(exp60Alerts.length > 0, `Detección de ventana de vencimiento ≤ 60 días (${exp60Alerts.length} alertas)`);

  const exp90Alerts = alerts.filter(a => a.alertType === 'EXPIRATION_NOTICE_90');
  assert(exp90Alerts.length > 0, `Detección de ventana de vencimiento ≤ 90 días (${exp90Alerts.length} alertas)`);

  // Test 4: AI Demand Predictor & Seasonal Multipliers
  const predictorAI = new DemandPredictorAI(invService);
  const predictionsWinter = predictorAI.predictSeasonalDemand('WINTER_FLU');
  const fluPrediction = predictionsWinter.find(p => p.tradeName.includes('Paracetamol'));
  assert(fluPrediction.seasonalMultiplier > 1.5, `IA: Multiplicador de demanda de gripe invernal aplicado correctamente (${fluPrediction.seasonalMultiplier}x)`);

  // Test 5: Anomaly Detector (Z-Scores)
  const anomalies = predictorAI.detectRotationAnomalies();
  const spikeAnomaly = anomalies.find(a => a.anomalyType === 'UNUSUAL_HIGH_SPIKE');
  assert(Boolean(spikeAnomaly), `IA: Detección de pico anómalo de demanda exitosa (${spikeAnomaly?.tradeName}, Z=${spikeAnomaly?.zScore})`);

  const stagnantAnomaly = anomalies.find(a => a.anomalyType === 'STAGNANT_STOCK');
  assert(Boolean(stagnantAnomaly), `IA: Detección de stock estancado exitosa (${stagnantAnomaly?.tradeName}, Z=${stagnantAnomaly?.zScore})`);

  // Test 6: Reorder Suggestions
  const reorders = predictorAI.generateReorderSuggestions();
  assert(reorders.length > 0, `IA: Generación de sugerencias de reorden de compra exitosa (${reorders.length} sugerencias)`);

  console.log('\n----------------------------------------------------');
  console.log(`📊 RESULTADO FINAL: ${passed} PASADAS | ${failed} FALLADAS`);
  console.log('----------------------------------------------------\n');

  if (failed > 0) process.exit(1);
}

runTests();
