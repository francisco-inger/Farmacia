const express = require('express');
const ctrl = require('./auditoria.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/roleMiddleware');
const router = express.Router();
router.get('/', authMiddleware, requireAdmin, ctrl.getAll);
router.get('/modules', authMiddleware, requireAdmin, ctrl.getModules);
module.exports = router;
