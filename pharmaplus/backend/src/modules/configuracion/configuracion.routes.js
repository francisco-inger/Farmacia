const express = require('express');
const ctrl = require('./configuracion.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/roleMiddleware');
const router = express.Router();
router.get('/', authMiddleware, ctrl.getSettings);
router.put('/', authMiddleware, requireAdmin, ctrl.updateSettings);
module.exports = router;
