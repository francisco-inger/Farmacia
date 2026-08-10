/**
 * Main UI Controller — Módulo Inventario y Vencimientos
 * Responsable: Ana María Tiburcio
 */

import { InventoryService } from './services/inventoryService.js';
import { AlertService } from './services/alertService.js';
import { DemandPredictorAI } from './services/demandPredictorAI.js';
import { StockDeductionContract } from './contracts/stockDeductionContract.js';

import { renderKpiCards } from './components/kpiCards.js';
import { renderBatchTable } from './components/batchTable.js';
import { renderAlertPanel } from './components/alertPanel.js';
import { renderDemandForecastChart } from './components/demandForecastChart.js';
import { renderAnomalyDetector } from './components/anomalyDetector.js';
import { renderReorderPanel } from './components/reorderPanel.js';

export class AppController {
  constructor() {
    this.inventoryService = new InventoryService();
    this.alertService = new AlertService(this.inventoryService);
    this.demandPredictorAI = new DemandPredictorAI(this.inventoryService);
    this.stockDeductionContract = new StockDeductionContract(this.inventoryService);

    this.selectedMedicationForBatch = null;
    this.activeSeasonOverride = null;
  }

  init() {
    this._bindTabs();
    this._bindModals();
    this._bindTestStockDeduction();
    this.refreshAll();
  }

  refreshAll() {
    // 1. KPI Cards
    const kpiSummary = this.alertService.getKpiSummary();
    renderKpiCards('kpi-container', kpiSummary);

    // Update tab badges
    const alertBadge = document.getElementById('badge-alert-count');
    if (alertBadge) alertBadge.textContent = kpiSummary.criticalCount + kpiSummary.exp60Count + kpiSummary.exp90Count;

    // 2. Batch Table
    const medications = this.inventoryService.getAllMedications();
    renderBatchTable('batch-table-container', medications, this.inventoryService, (medId) => {
      this.openAddBatchModal(medId);
    });

    // 3. Alerts Panel
    const alerts = this.alertService.generateAllAlerts();
    renderAlertPanel('alert-panel-container', alerts, (filter) => {
      console.log('Alert filter applied:', filter);
    });

    // 4. AI Demand Forecast
    const predictions = this.demandPredictorAI.predictSeasonalDemand(this.activeSeasonOverride);
    renderDemandForecastChart('demand-chart-container', predictions, this.demandPredictorAI, (seasonKey) => {
      this.activeSeasonOverride = seasonKey;
      this.refreshAll();
    });

    // 5. Anomaly Detector
    const anomalies = this.demandPredictorAI.detectRotationAnomalies();
    renderAnomalyDetector('anomaly-container', anomalies);

    // 6. Reorder Panel
    const suggestions = this.demandPredictorAI.generateReorderSuggestions();
    renderReorderPanel('reorder-container', suggestions, (suggs) => {
      this.showToast(`🛒 Orden de Compra Generada Exitosamente. Total estimado: DOP $${(suggs.reduce((a, b) => a + b.estimatedCostCents, 0) / 100).toFixed(2)}`, 'success');
    });
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'error' ? '❌' : '✅';
    toast.innerHTML = `<span style="font-size:18px;">${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-closing');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  _bindTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');

        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));

        e.currentTarget.classList.add('active');
        const activePanel = document.getElementById(`tab-${targetTab}`);
        if (activePanel) activePanel.classList.add('active');
      });
    });
  }

  _bindModals() {
    // Add Batch Modal
    const modalBatch = document.getElementById('modal-add-batch');
    const btnCloseBatch = document.getElementById('btn-close-modal-batch');
    const formBatch = document.getElementById('form-add-batch');

    if (btnCloseBatch) {
      btnCloseBatch.addEventListener('click', () => {
        if (modalBatch) modalBatch.classList.remove('active');
      });
    }

    if (formBatch) {
      formBatch.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!this.selectedMedicationForBatch) return;

        const lotNumber = document.getElementById('input-lot-number').value.trim();
        const quantity = parseInt(document.getElementById('input-quantity').value, 10);
        const expDateStr = document.getElementById('input-exp-date').value;

        try {
          // Pre-validations
          if (!lotNumber) throw new Error("El número de lote es requerido.");
          if (quantity <= 0) throw new Error("La cantidad debe ser mayor a 0.");
          if (!expDateStr) throw new Error("La fecha de vencimiento es requerida.");

          this.inventoryService.addBatch(this.selectedMedicationForBatch, {
            lotNumber,
            quantity,
            expirationDate: new Date(expDateStr).toISOString()
          });

          if (modalBatch) modalBatch.classList.remove('active');
          formBatch.reset();
          this.refreshAll();
          this.showToast(`Lote ${lotNumber} registrado correctamente.`, 'success');
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      });
    }

    // New Medication Modal
    const modalMed = document.getElementById('modal-add-medication');
    const btnCloseMed = document.getElementById('btn-close-modal-med');
    const formMed = document.getElementById('form-add-medication');

    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'btn-new-medication') {
        if (modalMed) modalMed.classList.add('active');
      }
    });

    if (btnCloseMed) {
      btnCloseMed.addEventListener('click', () => {
        if (modalMed) modalMed.classList.remove('active');
      });
    }

    if (formMed) {
      formMed.addEventListener('submit', (e) => {
        e.preventDefault();
        const tradeName = document.getElementById('input-trade-name').value.trim();
        const activeIngredient = document.getElementById('input-active-ingredient').value.trim();
        const priceCents = Math.round(parseFloat(document.getElementById('input-price').value) * 100);
        const minStockThreshold = parseInt(document.getElementById('input-min-stock').value, 10);
        const category = document.getElementById('input-category').value;
        const requiresPrescription = document.getElementById('check-prescription').checked;
        const isControlled = document.getElementById('check-controlled').checked;

        try {
          // Pre-validations
          if (!tradeName) throw new Error("El nombre comercial es requerido.");
          if (!activeIngredient) throw new Error("El principio activo es requerido.");
          if (isNaN(priceCents) || priceCents <= 0) throw new Error("El precio debe ser un número válido mayor a 0.");
          if (isNaN(minStockThreshold) || minStockThreshold < 1) throw new Error("El punto de reorden debe ser al menos 1.");

          this.inventoryService.addMedication({
            tradeName,
            activeIngredient,
            priceCents,
            minStockThreshold,
            category,
            requiresPrescription,
            isControlled
          });

          if (modalMed) modalMed.classList.remove('active');
          formMed.reset();
          this.refreshAll();
          this.showToast(`Medicamento "${tradeName}" registrado en el catálogo.`, 'success');
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      });
    }
  }

  openAddBatchModal(medicationId) {
    this.selectedMedicationForBatch = medicationId;
    const med = this.inventoryService.getMedicationById(medicationId);
    if (!med) return;

    const titleEl = document.getElementById('modal-batch-med-name');
    if (titleEl) titleEl.textContent = med.tradeName;

    // Set default expiration date to +90 days
    const expInput = document.getElementById('input-exp-date');
    if (expInput) {
      const d = new Date();
      d.setDate(d.getDate() + 90);
      expInput.value = d.toISOString().split('T')[0];
    }

    const modalBatch = document.getElementById('modal-add-batch');
    if (modalBatch) modalBatch.classList.add('active');
  }

  _bindTestStockDeduction() {
    const btnTestFefo = document.getElementById('btn-test-fefo');
    if (!btnTestFefo) return;

    btnTestFefo.addEventListener('click', () => {
      const meds = this.inventoryService.getAllMedications();
      if (meds.length === 0) return;
      const targetMed = meds[0]; // Paracetamol

      const result = this.stockDeductionContract.deductStock(targetMed.id, 10);
      this.refreshAll();

      if (result.success) {
        this.showToast(`🧪 PRUEBA FEFO Exitosa: Descontadas 10 unidades de ${targetMed.tradeName}.`, 'success');
      } else {
        this.showToast(`🧪 PRUEBA FEFO Fallida: ${result.errorMessage}`, 'error');
      }
    });
  }
}

// Global initialization on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
  window.app.init();
});
