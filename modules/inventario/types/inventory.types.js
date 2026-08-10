/**
 * Data Types and Models for Inventory & Expiration Module
 * All monetary amounts in cents (integer).
 * All dates in UTC / ISO 8601 string format.
 * All IDs in UUID v4 format.
 */

/**
 * @typedef {Object} Batch
 * @property {string} id - UUID v4
 * @property {string} medicationId - UUID v4
 * @property {string} lotNumber - Manufacturer lot number string
 * @property {number} quantity - Available units count
 * @property {string} expirationDate - ISO 8601 UTC date string
 * @property {string} supplierId - UUID v4
 * @property {string} createdAt - ISO 8601 UTC date string
 */

/**
 * @typedef {Object} Medication
 * @property {string} id - UUID v4
 * @property {string} tradeName - Commercial name (nombre_comercial)
 * @property {string} activeIngredient - Active substance (principio_activo)
 * @property {boolean} requiresPrescription - (requiere_receta)
 * @property {boolean} isControlled - (es_controlado)
 * @property {number} priceCents - Unit price in cents (precio)
 * @property {string} category - Therapeutic category (e.g. Analgesics, Antibiotics, Antihistamines)
 * @property {number} minStockThreshold - Minimum safety stock level
 * @property {Batch[]} batches - Array of associated batches
 */

/**
 * @typedef {'EXPIRATION_CRITICAL_30' | 'EXPIRATION_WARNING_60' | 'EXPIRATION_NOTICE_90' | 'EXPIRED' | 'LOW_STOCK' | 'CRITICAL_STOCK'} AlertType
 */

/**
 * @typedef {Object} StockAlert
 * @property {string} id - UUID v4
 * @property {string} medicationId - UUID v4
 * @property {string} tradeName - Commercial name
 * @property {string} [batchId] - UUID v4 (if batch specific)
 * @property {string} [lotNumber] - Lot identifier
 * @property {AlertType} alertType - Type of alert
 * @property {number} daysToExpiration - Remaining days until expiration
 * @property {number} currentQuantity - Current quantity remaining
 * @property {string} message - Human-readable alert description
 * @property {string} severity - 'CRITICAL' | 'WARNING' | 'NOTICE'
 * @property {string} colorCode - Hex code (#D64550 for CRITICAL, #E6A23C for WARNING, #0E8F7E for NOTICE)
 * @property {string} timestamp - ISO 8601 UTC timestamp
 */

/**
 * @typedef {Object} SeasonalDemandPrediction
 * @property {string} medicationId - UUID v4
 * @property {string} tradeName - Commercial name
 * @property {string} activeIngredient - Active substance
 * @property {string} seasonName - 'WINTER_FLU' | 'SPRING_ALLERGY' | 'SUMMER_GASTRO' | 'AUTUMN_RESPIRATORY'
 * @property {number} historicalAvgMonthlyDemand - Baseline demand in units
 * @property {number} seasonalMultiplier - Seasonal surge multiplier (e.g. 1.85)
 * @property {number} predictedMonthlyDemand - Predicted monthly demand in units
 * @property {number} confidenceScore - Confidence score 0.0 - 1.0
 * @property {string} recommendation - Strategic recommendation text
 */

/**
 * @typedef {Object} RotationAnomaly
 * @property {string} medicationId - UUID v4
 * @property {string} tradeName - Commercial name
 * @property {number} normalDailyRate - Expected sales velocity (units/day)
 * @property {number} currentDailyRate - Observed sales velocity (units/day)
 * @property {number} zScore - Statistical anomaly score
 * @property {'UNUSUAL_HIGH_SPIKE' | 'STAGNANT_STOCK' | 'NORMAL'} anomalyType
 * @property {string} description - Explanation of anomaly
 */

/**
 * @typedef {Object} ReorderSuggestion
 * @property {string} medicationId - UUID v4
 * @property {string} tradeName - Commercial name
 * @property {number} currentStock - Total stock across non-expired batches
 * @property {number} minStockThreshold - Minimum safety stock
 * @property {number} predictedMonthlyDemand - Demand predicted by AI
 * @property {number} suggestedOrderQuantity - Recommended units to purchase
 * @property {number} estimatedCostCents - Total cost in cents
 * @property {string} priority - 'HIGH' | 'MEDIUM' | 'LOW'
 */

// Export dummy object for ES module compatibility
export const InventoryTypes = {
  VERSION: '1.0.0'
};
