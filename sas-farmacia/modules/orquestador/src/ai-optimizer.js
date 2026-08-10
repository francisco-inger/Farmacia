/**
 * AI Cross-Module Optimizer & Process Automation Suggester
 */

export class AiCrossModuleOptimizer {
  constructor() {
    this.automationRules = [
      {
        id: "auto-rule-01",
        name: "Auto-Reorden de Stock Crítico",
        sourceModule: "Inventario",
        targetModule: "Integraciones (ARS/Proveedores)",
        condition: "Frecuencia de ventas de Paracetamol > 50 unidades/día",
        suggestion: "Sugerencia IA: Crear orden de compra automática al proveedor cuando el stock baje del 20%.",
        impact: "Reduce riesgo de desabastecimiento en un 95%",
        status: "active"
      },
      {
        id: "auto-rule-02",
        name: "Recordatorio Automático por WhatsApp",
        sourceModule: "Facturación / POS",
        targetModule: "Chatbot WhatsApp",
        condition: "Validación de Receta Médica completada",
        suggestion: "Sugerencia IA: Enviar mensaje automático al paciente por WhatsApp con instrucciones de dosis y link de renovación.",
        impact: "Mejora la fidelización y adherencia del paciente (+40%)",
        status: "active"
      },
      {
        id: "auto-rule-03",
        name: "Ajuste Dinámico de Personal Clínico",
        sourceModule: "Servicios",
        targetModule: "Recursos Humanos",
        condition: "Citas clínicas agendadas > 15 entre 09:00 - 12:00",
        suggestion: "Sugerencia IA: Asignar automáticamente un enfermero de refuerzo en la sucursal activa.",
        impact: "Elimina tiempos de espera prolongados en enfermería",
        status: "active"
      }
    ];
  }

  analyzeEvents(eventLog) {
    const saleEvents = eventLog.filter(e => e.event_type === 'sale.created');
    const stockEvents = eventLog.filter(e => e.event_type === 'stock.available_updated');
    const prescriptionEvents = eventLog.filter(e => e.event_type === 'prescription.validated');

    const insights = [];

    if (saleEvents.length >= 3) {
      insights.push({
        title: "Alta Frecuencia de Ventas Detectada",
        detail: `Se han procesado ${saleEvents.length} ventas recientemente en la sucursal actual. Se recomienda sincro en tiempo real con Facturación NCF.`,
        priority: "medium"
      });
    }

    if (stockEvents.some(e => e.is_critical)) {
      insights.push({
        title: "Alerta de Stock Crítico Inter-Módulo",
        detail: "Se detectó producto con stock por debajo del umbral mínimo. El Orquestador notificará al Chatbot para no ofrecer el producto por WhatsApp.",
        priority: "high"
      });
    }

    if (prescriptionEvents.length > 0) {
      insights.push({
        title: "Sincronización Receta-Factura",
        detail: "Recetas validadas listas para cobro prioritario en caja POS.",
        priority: "low"
      });
    }

    return {
      rules: this.automationRules,
      insights: insights
    };
  }
}
