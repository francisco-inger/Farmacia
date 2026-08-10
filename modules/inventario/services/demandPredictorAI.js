/**
 * Demand Predictor AI Service
 * AI module for:
 * 1. Seasonal Demand Forecasting (gripe, alergias, virus estacionales, etc.)
 * 2. Rotation Anomaly Detection (picos inusuales de venta o estancamiento de lote)
 * 3. Purchase Reorder Recommendations
 */

export class DemandPredictorAI {
  /**
   * @param {import('./inventoryService.js').InventoryService} inventoryService 
   */
  constructor(inventoryService) {
    this.inventoryService = inventoryService;
    
    // Seasonal profiles with warm human descriptions
    this.seasonalProfiles = {
      'WINTER_FLU': {
        name: '❄️ Temporada Invernal (Gripe y Cuadros Virales)',
        categories: ['Analgesics / Seasonal Flu', 'Respiratory / Asthma', 'Antibiotics'],
        baseMultiplier: 1.85,
        confidence: 0.92,
        recommendation: 'Se pronostica un aumento del 85% en cuadros gripales y fiebre. Se sugiere asegurar existencias adicionales de analgésicos, antigripales y expectorantes.'
      },
      'SPRING_ALLERGY': {
        name: '🌸 Temporada de Primavera (Alergias y Polinización)',
        categories: ['Antihistamines / Spring Allergy', 'Respiratory / Asthma'],
        baseMultiplier: 1.65,
        confidence: 0.88,
        recommendation: 'Incremento proyectado del 65% en reacciones alérgicas por polen. Conviene abastecer antihistamínicos y colirios oftálmicos.'
      },
      'SUMMER_GASTRO': {
        name: '☀️ Temporada de Verano (Infecciones Gastrointestinales)',
        categories: ['General', 'Antibiotics'],
        baseMultiplier: 1.40,
        confidence: 0.85,
        recommendation: 'Aumento del 40% en afecciones estomacales y deshidratación. Mantener buen inventario de sueros orales y probióticos.'
      },
      'AUTUMN_RESPIRATORY': {
        name: '🍂 Temporada de Otoño (Cambio de Clima y Cuadros Respiratorios)',
        categories: ['Analgesics / Seasonal Flu', 'Antibiotics'],
        baseMultiplier: 1.50,
        confidence: 0.89,
        recommendation: 'Aumento del 50% en consultas por cambios de temperatura. Prever inventario suficiente de antibióticos pediátricos y descongestionantes.'
      }
    };
  }

  getCurrentSeasonKey() {
    const month = new Date().getUTCMonth();
    if (month >= 11 || month <= 1) return 'WINTER_FLU';
    if (month >= 2 && month <= 4) return 'SPRING_ALLERGY';
    if (month >= 5 && month <= 7) return 'SUMMER_GASTRO';
    return 'AUTUMN_RESPIRATORY';
  }

  predictSeasonalDemand(overrideSeasonKey) {
    const seasonKey = overrideSeasonKey || this.getCurrentSeasonKey();
    const profile = this.seasonalProfiles[seasonKey] || this.seasonalProfiles['WINTER_FLU'];
    const medications = this.inventoryService.getAllMedications();

    return medications.map(med => {
      const isTargetCategory = profile.categories.some(cat => med.category.toLowerCase().includes(cat.toLowerCase()));
      const multiplier = isTargetCategory ? profile.baseMultiplier : 1.05;
      
      const historicalAvgMonthlyDemand = med.minStockThreshold * 2;
      const predictedMonthlyDemand = Math.round(historicalAvgMonthlyDemand * multiplier);

      return {
        medicationId: med.id,
        tradeName: med.tradeName,
        activeIngredient: med.activeIngredient,
        seasonName: profile.name,
        historicalAvgMonthlyDemand,
        seasonalMultiplier: Number(multiplier.toFixed(2)),
        predictedMonthlyDemand,
        confidenceScore: isTargetCategory ? profile.confidence : 0.75,
        recommendation: isTargetCategory 
          ? profile.recommendation 
          : `Demanda proyectada estable sin variaciones estacionales significativas.`
      };
    });
  }

  detectRotationAnomalies() {
    const medications = this.inventoryService.getAllMedications();

    const simulatedVelocities = {
      'Paracetamol Grip- 500mg': { normal: 10, current: 32 },
      'Loratadina Alerg- 10mg': { normal: 5, current: 16 },
      'Amoxicilina 500mg': { normal: 8, current: 7 },
      'Clonazepam 2mg (Controlado)': { normal: 3, current: 0.1 },
      'Ibuprofeno 400mg': { normal: 12, current: 11 },
      'Salbutamol Inhalador 100mcg': { normal: 4, current: 14 }
    };

    return medications.map(med => {
      const data = simulatedVelocities[med.tradeName] || { normal: 5, current: 5 };
      const diff = data.current - data.normal;
      const stdDev = Math.max(1, data.normal * 0.3);
      const zScore = Number((diff / stdDev).toFixed(2));

      let anomalyType = 'NORMAL';
      let description = 'La velocidad de venta en mostrador se mantiene en los niveles habituales esperados.';

      if (zScore >= 2.0) {
        anomalyType = 'UNUSUAL_HIGH_SPIKE';
        description = `🔥 ¡Demanda inusualmente alta! Este producto se está vendiendo a ${data.current} u/día (un +${Math.round((diff / data.normal) * 100)}% por encima de lo habitual). Posible incremento en la zona o compra masiva.`;
      } else if (zScore <= -1.8 || (data.current < 0.5 && data.normal >= 3)) {
        anomalyType = 'STAGNANT_STOCK';
        description = `💤 ¡Producto de baja rotación! La venta cayó a ${data.current} u/día (normalmente se venden ${data.normal} u/día). Se sugiere revisar la ubicación en exhibidor o considerar promociones antes de su vencimiento.`;
      }

      return {
        medicationId: med.id,
        tradeName: med.tradeName,
        normalDailyRate: data.normal,
        currentDailyRate: data.current,
        zScore,
        anomalyType,
        description
      };
    });
  }

  generateReorderSuggestions() {
    const predictions = this.predictSeasonalDemand();
    const anomalies = this.detectRotationAnomalies();
    
    return predictions.map(pred => {
      const med = this.inventoryService.getMedicationById(pred.medicationId);
      if (!med) return null;

      const currentStock = this.inventoryService.getValidStockQuantity(med.id);
      const anomaly = anomalies.find(a => a.medicationId === med.id);
      
      const safetyMargin = Math.ceil(med.minStockThreshold * 0.3);
      let targetStock = pred.predictedMonthlyDemand + safetyMargin;

      if (anomaly && anomaly.anomalyType === 'UNUSUAL_HIGH_SPIKE') {
        targetStock = Math.ceil(targetStock * 1.3);
      }

      const deficit = targetStock - currentStock;
      const suggestedOrderQuantity = Math.max(0, deficit);
      const estimatedCostCents = suggestedOrderQuantity * med.priceCents;

      let priority = 'LOW';
      if (currentStock <= med.minStockThreshold || suggestedOrderQuantity > med.minStockThreshold * 1.5) {
        priority = 'HIGH';
      } else if (suggestedOrderQuantity > 0) {
        priority = 'MEDIUM';
      }

      return {
        medicationId: med.id,
        tradeName: med.tradeName,
        currentStock,
        minStockThreshold: med.minStockThreshold,
        predictedMonthlyDemand: pred.predictedMonthlyDemand,
        suggestedOrderQuantity,
        estimatedCostCents,
        priority
      };
    }).filter(Boolean);
  }
}
