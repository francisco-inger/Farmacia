const express = require('express');
const ctrl = require('./pos.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const router = express.Router();
router.post('/sales', authMiddleware, ctrl.createSale);
router.get('/sales', authMiddleware, ctrl.getSales);
router.get('/sales/:id', authMiddleware, ctrl.getSaleById);
router.post('/sales/:id/cancel', authMiddleware, ctrl.cancelSale);
module.exports = router;
