const integracionesService = require('./integraciones.service');

class IntegracionesController {
  async getConnectors(req, res, next) {
    try {
      const connectors = await integracionesService.getConnectors();
      res.json({ success: true, data: connectors });
    } catch (error) {
      next(error);
    }
  }

  async updateConnectorStatus(req, res, next) {
    try {
      const { connectorId } = req.params;
      const { status } = req.body;
      const result = await integracionesService.updateConnectorStatus(connectorId, status);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async syncLabCatalog(req, res, next) {
    try {
      const { connectorId } = req.params;
      const result = await integracionesService.syncLabCatalog(connectorId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async verifyInsuranceCoverage(req, res, next) {
    try {
      const { cardNumber, insuranceProvider, totalAmountCents } = req.body;
      const result = await integracionesService.verifyInsuranceCoverage(cardNumber, insuranceProvider, totalAmountCents);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async verifyDgiiRnc(req, res, next) {
    try {
      const { rnc } = req.body;
      const result = await integracionesService.verifyDgiiRnc(rnc);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getWebhooks(req, res, next) {
    try {
      const webhooks = await integracionesService.getWebhooks();
      res.json({ success: true, data: webhooks });
    } catch (error) {
      next(error);
    }
  }

  async createWebhook(req, res, next) {
    try {
      const result = await integracionesService.createWebhook(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async triggerWebhook(req, res, next) {
    try {
      const { webhookId } = req.params;
      const result = await integracionesService.triggerWebhook(webhookId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async mapSchemaWithAI(req, res, next) {
    try {
      const { sampleData, targetModel } = req.body;
      const result = await integracionesService.mapSchemaWithAI(sampleData, targetModel);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getOpenApiSpec(req, res, next) {
    try {
      const spec = await integracionesService.getOpenApiSpec();
      res.json(spec);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IntegracionesController();
