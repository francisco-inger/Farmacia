const express = require('express');
const ctrl = require('./rrhh.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/roleMiddleware');
const router = express.Router();

// Stats / KPIs reales
router.get('/stats', authMiddleware, ctrl.getStats);

// Asistencias
router.get('/attendance', authMiddleware, ctrl.getAttendance);
router.post('/attendance', authMiddleware, ctrl.registerAttendance);

// Departamentos
router.get('/departments', authMiddleware, ctrl.getDepartments);

// Cargos / Puestos
router.get('/positions', authMiddleware, ctrl.getPositions);

// Nómina
router.get('/nomina', authMiddleware, ctrl.getNomina);

// Empleados CRUD
router.get('/', authMiddleware, ctrl.getEmployees);
router.get('/:id', authMiddleware, ctrl.getById);
router.post('/', authMiddleware, requireAdmin, ctrl.create);
router.put('/:id', authMiddleware, requireAdmin, ctrl.update);
router.delete('/:id', authMiddleware, requireAdmin, ctrl.deleteEmployee);

module.exports = router;
