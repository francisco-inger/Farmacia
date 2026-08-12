const express = require('express');
const ctrl = require('./integraciones.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const router = express.Router();

router.get('/connectors', authMiddleware, ctrl.getConnectors);
router.post('/verify-coverage', authMiddleware, ctrl.verifyCoverage);
router.post('/sync-catalog', authMiddleware, ctrl.syncCatalog);

router.get('/webhooks', authMiddleware, ctrl.getWebhooks);
router.post('/webhooks', authMiddleware, ctrl.createWebhook);
router.delete('/webhooks/:id', authMiddleware, ctrl.deleteWebhook);
router.post('/webhooks/:id/test', authMiddleware, ctrl.testWebhook);

router.get('/api-keys', authMiddleware, ctrl.getApiKeys);
router.post('/api-keys', authMiddleware, ctrl.createApiKey);
router.delete('/api-keys/:id', authMiddleware, ctrl.revokeApiKey);

module.exports = router;
