const express = require('express');
const ctrl = require('./notificaciones.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const router = express.Router();
router.get('/', authMiddleware, ctrl.getAll);
router.patch('/:id/read', authMiddleware, ctrl.markAsRead);
router.patch('/read-all', authMiddleware, ctrl.markAllAsRead);
router.delete('/:id', authMiddleware, ctrl.remove);
module.exports = router;
