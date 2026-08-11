const express = require('express');
const router = express.Router();
const integracionesController = require('./integraciones.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

// Documentación OpenAPI libre de auth para explorador de Swagger
router.get('/docs/openapi', integracionesController.getOpenApiSpec);

// Aplicar autenticación JWT a los demás endpoints
router.use(authMiddleware);

// Rutas de Conectores
router.get('/connectors', integracionesController.getConnectors);
router.patch('/connectors/:connectorId/status', integracionesController.updateConnectorStatus);
router.post('/connectors/:connectorId/sync', integracionesController.syncLabCatalog);

// Rutas de Aseguradoras (ARS) y DGII
router.post('/insurance/verify', integracionesController.verifyInsuranceCoverage);
router.post('/dgii/verify-rnc', integracionesController.verifyDgiiRnc);

// Rutas de Webhooks
router.get('/webhooks', integracionesController.getWebhooks);
router.post('/webhooks', integracionesController.createWebhook);
router.post('/webhooks/:webhookId/trigger', integracionesController.triggerWebhook);

// Rutas de IA Mapeador de Esquemas
router.post('/ai/map-schema', integracionesController.mapSchemaWithAI);

module.exports = router;
