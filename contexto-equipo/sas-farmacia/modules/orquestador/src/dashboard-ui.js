import { EventBusEngine } from './event-bus.js';
import { ApiGateway } from './api-gateway.js';
import { AiCrossModuleOptimizer } from './ai-optimizer.js';

export class DashboardApp {
  constructor() {
    this.bus = new EventBusEngine();
    this.gateway = new ApiGateway();
    this.ai = new AiCrossModuleOptimizer();

    this.metrics = {
      salesTotalCents: 4850000, // RD$48,500.00
      salesCount: 142,
      criticalStockCount: 3,
      appointmentsCount: 28,
      processedEventsCount: 0
    };

    this.sampleContracts = {
      'sale-created': null,
      'prescription-validated': null,
      'staff-availability': null,
      'stock-available': null
    };

    this.initSubscribers();
    this.initUI();
    this.loadContracts();
  }

  initSubscribers() {
    // Inter-module orchestration subscribers
    this.bus.subscribe('sale.created', 'Inventario', (event) => {
      console.log('[Orquestador] Venta procesada -> Reduciendo stock en Inventario:', event);
      this.metrics.salesCount++;
      this.metrics.salesTotalCents += event.total_cents;
      this.updateMetricsUI();
    });

    this.bus.subscribe('sale.created', 'Facturación', (event) => {
      console.log('[Orquestador] Venta procesada -> Solicitando NCF en Facturación:', event);
    });

    this.bus.subscribe('stock.available_updated', 'Chatbot', (event) => {
      console.log('[Orquestador] Cambio de stock -> Sincronizando catálogo WhatsApp:', event);
      if (event.is_critical) {
        this.metrics.criticalStockCount++;
        this.updateMetricsUI();
      }
    });

    this.bus.subscribe('staff.availability_updated', 'Servicios', (event) => {
      console.log('[Orquestador] Cambio disponibilidad personal -> Sincronizando agenda clínica:', event);
      if (event.is_available) {
        this.metrics.appointmentsCount++;
        this.updateMetricsUI();
      }
    });

    // Observer for live log UI stream
    this.bus.onEventProcessed((event, targetModules) => {
      this.metrics.processedEventsCount++;
      this.renderEventLogItem(event, targetModules);
      this.renderAiInsights();
      this.updateMetricsUI();
    });
  }

  initUI() {
    // Setup branch select dropdown
    const branchSelect = document.getElementById('branchSelect');
    if (branchSelect) {
      branchSelect.innerHTML = '';
      this.gateway.getBranches().forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.branch_id;
        opt.textContent = `${b.name} (${b.code})`;
        branchSelect.appendChild(opt);
      });

      branchSelect.addEventListener('change', (e) => {
        const selected = this.gateway.setBranch(e.target.value);
        document.getElementById('currentBranchBadge').textContent = selected.name;
        this.renderModulesTable();
      });
    }

    // Setup action buttons for simulation
    document.getElementById('btnSimulateSale')?.addEventListener('click', () => this.simulateSaleEvent());
    document.getElementById('btnSimulateStock')?.addEventListener('click', () => this.simulateStockEvent());
    document.getElementById('btnSimulateStaff')?.addEventListener('click', () => this.simulateStaffEvent());
    document.getElementById('btnClearLog')?.addEventListener('click', () => {
      this.bus.clearLogs();
      const container = document.getElementById('eventLogContainer');
      if (container) container.innerHTML = '<div style="color: #64748B; padding: 0.5rem;">Esperando eventos en el bus...</div>';
    });

    this.renderModulesTable();
    this.renderAiInsights();
    this.updateMetricsUI();
  }

  async loadContracts() {
    const contracts = [
      { key: 'sale-created', path: '../../contracts/sale-created.json' },
      { key: 'prescription-validated', path: '../../contracts/prescription-validated.json' },
      { key: 'staff-availability', path: '../../contracts/staff-availability.json' },
      { key: 'stock-available', path: '../../contracts/stock-available.json' }
    ];

    for (const c of contracts) {
      try {
        const res = await fetch(c.path);
        if (res.ok) {
          this.sampleContracts[c.key] = await res.json();
        }
      } catch {
        // Fallback default definitions for demonstration
        this.sampleContracts[c.key] = { schema: c.key, status: "loaded" };
      }
    }

    this.setupContractTabs();
  }

  setupContractTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const viewer = document.getElementById('jsonViewer');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const key = btn.dataset.contract;
        if (viewer && this.sampleContracts[key]) {
          viewer.textContent = JSON.stringify(this.sampleContracts[key], null, 2);
        }
      });
    });

    // Load first contract view by default
    if (viewer && this.sampleContracts['sale-created']) {
      viewer.textContent = JSON.stringify(this.sampleContracts['sale-created'], null, 2);
    }
  }

  simulateSaleEvent() {
    const currentBranch = this.gateway.getCurrentBranch();
    const event = {
      event_id: crypto.randomUUID(),
      event_type: 'sale.created',
      sale_id: crypto.randomUUID(),
      branch_id: currentBranch.branch_id,
      cashier_id: crypto.randomUUID(),
      items: [
        { product_id: crypto.randomUUID(), product_name: "Paracetamol 500mg (Caja)", quantity: 2, unit_price_cents: 15000, subtotal_cents: 30000 }
      ],
      total_cents: 30000,
      currency: "DOP",
      created_at: new Date().toISOString()
    };

    this.bus.publish(event);
  }

  simulateStockEvent() {
    const currentBranch = this.gateway.getCurrentBranch();
    const event = {
      event_id: crypto.randomUUID(),
      event_type: 'stock.available_updated',
      product_id: crypto.randomUUID(),
      product_name: "Amoxicilina 875mg",
      sku: "MED-AMO-875",
      branch_id: currentBranch.branch_id,
      stock_quantity: 4,
      min_threshold: 10,
      is_critical: true,
      updated_at: new Date().toISOString()
    };

    this.bus.publish(event);
  }

  simulateStaffEvent() {
    const currentBranch = this.gateway.getCurrentBranch();
    const event = {
      event_id: crypto.randomUUID(),
      event_type: 'staff.availability_updated',
      staff_id: crypto.randomUUID(),
      staff_name: "Lic. María Rodríguez (Enfermería)",
      branch_id: currentBranch.branch_id,
      role: "nurse",
      shift_start: "2026-08-10T08:00:00Z",
      shift_end: "2026-08-10T17:00:00Z",
      is_available: true,
      updated_at: new Date().toISOString()
    };

    this.bus.publish(event);
  }

  renderEventLogItem(event, targetModules) {
    const container = document.getElementById('eventLogContainer');
    if (!container) return;

    if (container.firstElementChild?.textContent?.includes('Esperando eventos')) {
      container.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = 'event-log-item';

    const formattedTime = new Date(event.published_at).toLocaleTimeString('es-DO');
    const modulesText = targetModules.length ? targetModules.join(', ') : 'Ninguno';

    item.innerHTML = `
      <div class="event-meta">
        <span class="event-type-tag">${event.event_type}</span>
        <span class="event-time">${formattedTime}</span>
      </div>
      <div class="event-details">
        <strong>Origen:</strong> API Gateway (${this.gateway.getCurrentBranch().code}) → <strong>Destinatarios:</strong> [${modulesText}]
      </div>
    `;

    container.insertBefore(item, container.firstChild);
  }

  updateMetricsUI() {
    const formatDOP = (cents) => {
      return (cents / 100).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
    };

    const elemSalesVal = document.getElementById('valSalesTotal');
    const elemSalesCount = document.getElementById('valSalesCount');
    const elemCriticalStock = document.getElementById('valCriticalStock');
    const elemAppointments = document.getElementById('valAppointments');
    const elemEventsCount = document.getElementById('valEventsCount');

    if (elemSalesVal) elemSalesVal.textContent = formatDOP(this.metrics.salesTotalCents);
    if (elemSalesCount) elemSalesCount.textContent = `${this.metrics.salesCount} ventas hoy`;
    if (elemCriticalStock) elemCriticalStock.textContent = `${this.metrics.criticalStockCount} ítems`;
    if (elemAppointments) elemAppointments.textContent = `${this.metrics.appointmentsCount} hoy`;
    if (elemEventsCount) elemEventsCount.textContent = `${this.metrics.processedEventsCount} msgs`;
  }

  renderModulesTable() {
    const tbody = document.getElementById('modulesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.gateway.getModulesRegistry().forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${m.name}</strong></td>
        <td><code>${m.path}</code></td>
        <td><span style="color: var(--color-success); font-weight:600;">● ${m.status}</span></td>
        <td>${m.owner}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderAiInsights() {
    const container = document.getElementById('aiInsightsContainer');
    if (!container) return;

    const data = this.ai.analyzeEvents(this.bus.getRecentEvents());
    container.innerHTML = '';

    data.rules.forEach(rule => {
      const card = document.createElement('div');
      card.className = 'ai-card';
      card.innerHTML = `
        <div class="ai-card-title">🤖 ${rule.name}</div>
        <div class="ai-card-desc">
          <strong>Regla:</strong> ${rule.condition}<br/>
          <strong>Acción:</strong> ${rule.suggestion}<br/>
          <span style="color: var(--color-primary); font-weight:500;">💡 Impacto: ${rule.impact}</span>
        </div>
      `;
      container.appendChild(card);
    });
  }
}

// Instantiate App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new DashboardApp();
});
