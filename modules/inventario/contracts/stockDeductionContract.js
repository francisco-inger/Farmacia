/**
 * Stock Deduction Contract
 * Exposed interface for POS / external sales modules to consume.
 * Follows FEFO (First Expired, First Out) strategy to consume stock from the oldest valid batches first.
 */

/**
 * Result of stock deduction operation
 * @typedef {Object} DeductionResult
 * @property {boolean} success - Whether full quantity was deducted
 * @property {string} medicationId - UUID v4
 * @property {number} requestedQuantity - Requested units count
 * @property {number} deductedQuantity - Total units actually deducted
 * @property {Array<{batchId: string, lotNumber: string, deducted: number, remaining: number}>} batchDeductions - Breakdown per batch
 * @property {string} [errorMessage] - Present if success is false
 * @property {string} timestamp - UTC ISO 8601 string
 */

export class StockDeductionContract {
  /**
   * @param {import('../services/inventoryService.js').InventoryService} inventoryService 
   */
  constructor(inventoryService) {
    this.inventoryService = inventoryService;
  }

  /**
   * Executes a stock deduction for a given medication using FEFO (First Expired, First Out).
   * @param {string} medicationId - UUID v4 of the medication
   * @param {number} quantity - Quantity to deduct (must be integer > 0)
   * @returns {DeductionResult}
   */
  deductStock(medicationId, quantity) {
    if (!medicationId || typeof quantity !== 'number' || quantity <= 0) {
      return {
        success: false,
        medicationId: medicationId || '',
        requestedQuantity: quantity || 0,
        deductedQuantity: 0,
        batchDeductions: [],
        errorMessage: 'Invalid medication ID or requested quantity.',
        timestamp: new Date().toISOString()
      };
    }

    return this.inventoryService.applyDeductionFEFO(medicationId, Math.floor(quantity));
  }

  /**
   * Checks available non-expired stock for a medication without mutating state.
   * @param {string} medicationId 
   * @returns {{availableStock: number, isAvailable: boolean}}
   */
  checkAvailableStock(medicationId) {
    const total = this.inventoryService.getValidStockQuantity(medicationId);
    return {
      availableStock: total,
      isAvailable: total > 0
    };
  }
}
