const express = require('express');
const ctrl = require('./inventario.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const router = express.Router();
router.get('/', authMiddleware, ctrl.getInventory);
router.get('/movements', authMiddleware, ctrl.getMovements);
router.get('/expiring', authMiddleware, ctrl.getExpiring);
router.post('/adjust', authMiddleware, ctrl.createAdjustment);
module.exports = router;
