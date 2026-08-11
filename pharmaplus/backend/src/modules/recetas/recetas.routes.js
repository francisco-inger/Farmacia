const express = require('express');
const ctrl = require('./recetas.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const router = express.Router();
router.get('/', authMiddleware, ctrl.getAll);
router.get('/:id', authMiddleware, ctrl.getById);
router.post('/', authMiddleware, ctrl.create);
router.patch('/:id/status', authMiddleware, ctrl.updateStatus);
module.exports = router;
