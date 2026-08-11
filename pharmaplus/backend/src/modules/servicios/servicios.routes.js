const express = require('express');
const ctrl = require('./servicios.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const router = express.Router();
router.get('/', authMiddleware, ctrl.getServices);
router.get('/records', authMiddleware, ctrl.getRecords);
router.post('/', authMiddleware, ctrl.createService);
router.post('/records', authMiddleware, ctrl.createRecord);
module.exports = router;
