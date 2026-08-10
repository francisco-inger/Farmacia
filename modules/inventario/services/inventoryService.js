/**
 * Inventory Service
 * Core business logic for Medication catalog & Batch management (Control de existencias por lote).
 */

export class InventoryService {
  constructor() {
    /** @type {Map<string, import('../types/inventory.types.js').Medication>} */
    this.medications = new Map();
    this._initializeSeedData();
  }

  /**
   * Helper to generate UUID v4
   * @returns {string}
   */
  generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Returns all registered medications
   * @returns {import('../types/inventory.types.js').Medication[]}
   */
  getAllMedications() {
    return Array.from(this.medications.values());
  }

  /**
   * Finds a medication by ID
   * @param {string} medicationId 
   * @returns {import('../types/inventory.types.js').Medication | null}
   */
  getMedicationById(medicationId) {
    return this.medications.get(medicationId) || null;
  }

  /**
   * Register a new medication in the catalog
   * @param {Omit<import('../types/inventory.types.js').Medication, 'id' | 'batches'>} medicationData 
   * @returns {import('../types/inventory.types.js').Medication}
   */
  addMedication(medicationData) {
    if (!medicationData.tradeName) throw new Error('El nombre comercial es obligatorio.');
    if (medicationData.priceCents <= 0) throw new Error('El precio del medicamento debe ser mayor a 0.');
    if (medicationData.minStockThreshold < 1) throw new Error('El punto de reorden debe ser al menos 1 unidad.');

    const id = this.generateUUID();
    /** @type {import('../types/inventory.types.js').Medication} */
    const newMed = {
      id,
      tradeName: medicationData.tradeName,
      activeIngredient: medicationData.activeIngredient,
      requiresPrescription: Boolean(medicationData.requiresPrescription),
      isControlled: Boolean(medicationData.isControlled),
      priceCents: Math.max(0, Math.floor(medicationData.priceCents || 0)),
      category: medicationData.category || 'General',
      minStockThreshold: Math.max(1, Math.floor(medicationData.minStockThreshold || 10)),
      batches: []
    };
    this.medications.set(id, newMed);
    return newMed;
  }

  /**
   * Register a new Batch for a specific medication
   * @param {string} medicationId 
   * @param {{lotNumber: string, quantity: number, expirationDate: string, supplierId?: string}} batchData 
   * @returns {import('../types/inventory.types.js').Batch}
   */
  addBatch(medicationId, batchData) {
    const med = this.medications.get(medicationId);
    if (!med) {
      throw new Error(`Medication with ID ${medicationId} not found.`);
    }

    // Ensure ISO 8601 UTC date
    let isoDate;
    try {
      isoDate = new Date(batchData.expirationDate).toISOString();
    } catch (e) {
      throw new Error('Fecha de vencimiento inválida.');
    }

    // Business rule: Expiration date must be in the future
    const expTime = new Date(isoDate).getTime();
    const nowTime = Date.now();
    if (expTime < nowTime) {
      throw new Error('No se pueden registrar lotes que ya estén vencidos.');
    }

    if (batchData.quantity <= 0) {
      throw new Error('La cantidad del lote debe ser mayor a 0.');
    }

    /** @type {import('../types/inventory.types.js').Batch} */
    const newBatch = {
      id: this.generateUUID(),
      medicationId,
      lotNumber: batchData.lotNumber || `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      quantity: Math.max(0, Math.floor(batchData.quantity || 0)),
      expirationDate: isoDate,
      supplierId: batchData.supplierId || this.generateUUID(),
      createdAt: new Date().toISOString()
    };

    med.batches.push(newBatch);
    // Keep batches sorted by expiration date ascending (FEFO ready)
    med.batches.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

    return newBatch;
  }

  /**
   * Calculates total non-expired stock for a medication
   * @param {string} medicationId 
   * @returns {number}
   */
  getValidStockQuantity(medicationId) {
    const med = this.medications.get(medicationId);
    if (!med) return 0;
    const nowMs = Date.now();
    return med.batches
      .filter(b => new Date(b.expirationDate).getTime() > nowMs)
      .reduce((sum, b) => sum + b.quantity, 0);
  }

  /**
   * Calculates overall stock including expired batches
   * @param {string} medicationId 
   * @returns {number}
   */
  getTotalRawStockQuantity(medicationId) {
    const med = this.medications.get(medicationId);
    if (!med) return 0;
    return med.batches.reduce((sum, b) => sum + b.quantity, 0);
  }

  /**
   * Apply stock deduction under FEFO policy (First Expired, First Out)
   * @param {string} medicationId 
   * @param {number} quantity 
   * @returns {import('../contracts/stockDeductionContract.js').DeductionResult}
   */
  applyDeductionFEFO(medicationId, quantity) {
    const med = this.medications.get(medicationId);
    const nowMs = Date.now();
    const result = {
      success: false,
      medicationId,
      requestedQuantity: quantity,
      deductedQuantity: 0,
      batchDeductions: [],
      timestamp: new Date().toISOString()
    };

    if (!med) {
      result.errorMessage = 'Medication not found.';
      return result;
    }

    // Filter valid non-expired batches with quantity > 0 sorted by expiration ascending
    const validBatches = med.batches
      .filter(b => b.quantity > 0 && new Date(b.expirationDate).getTime() > nowMs)
      .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

    let remainingToDeduct = quantity;

    for (const batch of validBatches) {
      if (remainingToDeduct <= 0) break;

      const deductAmount = Math.min(batch.quantity, remainingToDeduct);
      batch.quantity -= deductAmount;
      remainingToDeduct -= deductAmount;
      result.deductedQuantity += deductAmount;

      result.batchDeductions.push({
        batchId: batch.id,
        lotNumber: batch.lotNumber,
        deducted: deductAmount,
        remaining: batch.quantity
      });
    }

    if (remainingToDeduct === 0) {
      result.success = true;
    } else {
      result.success = false;
      result.errorMessage = `Insufficient non-expired stock. Short by ${remainingToDeduct} units.`;
    }

    return result;
  }

  /**
   * Seeds database with initial realistic pharmacy medications and batches
   */
  _initializeSeedData() {
    const now = new Date();
    
    // Dates calculation relative to now
    const addDays = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d.toISOString();
    };

    const seeds = [
      {
        tradeName: 'Paracetamol Grip- 500mg',
        activeIngredient: 'Paracetamol',
        requiresPrescription: false,
        isControlled: false,
        priceCents: 450, // $4.50
        category: 'Analgesics / Seasonal Flu',
        minStockThreshold: 50,
        batches: [
          { lotNumber: 'PAR-2026-A1', quantity: 25, expirationDate: addDays(20), supplierId: '550e8400-e29b-41d4-a716-446655440001' }, // 20 days -> 30d Critical
          { lotNumber: 'PAR-2026-A2', quantity: 120, expirationDate: addDays(55), supplierId: '550e8400-e29b-41d4-a716-446655440001' }, // 55 days -> 60d Warning
          { lotNumber: 'PAR-2026-A3', quantity: 200, expirationDate: addDays(180), supplierId: '550e8400-e29b-41d4-a716-446655440002' }
        ]
      },
      {
        tradeName: 'Amoxicilina 500mg',
        activeIngredient: 'Amoxicilina Trihidrato',
        requiresPrescription: true,
        isControlled: false,
        priceCents: 1250, // $12.50
        category: 'Antibiotics',
        minStockThreshold: 40,
        batches: [
          { lotNumber: 'AMX-9901-B1', quantity: 12, expirationDate: addDays(85), supplierId: '550e8400-e29b-41d4-a716-446655440003' }, // 85 days -> 90d Notice & Low stock!
          { lotNumber: 'AMX-9901-B2', quantity: 18, expirationDate: addDays(240), supplierId: '550e8400-e29b-41d4-a716-446655440003' }
        ]
      },
      {
        tradeName: 'Loratadina Alerg- 10mg',
        activeIngredient: 'Loratadina',
        requiresPrescription: false,
        isControlled: false,
        priceCents: 890, // $8.90
        category: 'Antihistamines / Spring Allergy',
        minStockThreshold: 30,
        batches: [
          { lotNumber: 'LOR-8812-C1', quantity: 8, expirationDate: addDays(15), supplierId: '550e8400-e29b-41d4-a716-446655440004' }, // 15 days -> Expiring 30d & Low stock
          { lotNumber: 'LOR-8812-C2', quantity: 45, expirationDate: addDays(70), supplierId: '550e8400-e29b-41d4-a716-446655440004' }
        ]
      },
      {
        tradeName: 'Clonazepam 2mg (Controlado)',
        activeIngredient: 'Clonazepam',
        requiresPrescription: true,
        isControlled: true,
        priceCents: 2400, // $24.00
        category: 'Controlled / Psychotropic',
        minStockThreshold: 20,
        batches: [
          { lotNumber: 'CNZ-0041-X1', quantity: 15, expirationDate: addDays(120), supplierId: '550e8400-e29b-41d4-a716-446655440005' },
          { lotNumber: 'CNZ-0041-X2', quantity: 30, expirationDate: addDays(300), supplierId: '550e8400-e29b-41d4-a716-446655440005' }
        ]
      },
      {
        tradeName: 'Ibuprofeno 400mg',
        activeIngredient: 'Ibuprofeno',
        requiresPrescription: false,
        isControlled: false,
        priceCents: 550, // $5.50
        category: 'Analgesics / Anti-inflammatory',
        minStockThreshold: 60,
        batches: [
          { lotNumber: 'IBU-3321-D1', quantity: 5, expirationDate: addDays(-10), supplierId: '550e8400-e29b-41d4-a716-446655440002' }, // EXPIRED batch!
          { lotNumber: 'IBU-3321-D2', quantity: 180, expirationDate: addDays(110), supplierId: '550e8400-e29b-41d4-a716-446655440002' }
        ]
      },
      {
        tradeName: 'Salbutamol Inhalador 100mcg',
        activeIngredient: 'Salbutamol Base',
        requiresPrescription: true,
        isControlled: false,
        priceCents: 1800, // $18.00
        category: 'Respiratory / Asthma',
        minStockThreshold: 25,
        batches: [
          { lotNumber: 'SLB-5541-E1', quantity: 4, expirationDate: addDays(40), supplierId: '550e8400-e29b-41d4-a716-446655440006' } // Low stock & 60d Warning
        ]
      }
    ];

    seeds.forEach(seed => {
      const med = this.addMedication({
        tradeName: seed.tradeName,
        activeIngredient: seed.activeIngredient,
        requiresPrescription: seed.requiresPrescription,
        isControlled: seed.isControlled,
        priceCents: seed.priceCents,
        category: seed.category,
        minStockThreshold: seed.minStockThreshold
      });

      seed.batches.forEach(b => {
        this.addBatch(med.id, b);
      });
    });
  }
}
