const express = require('express');
const { getDashboardStats } = require('./dashboard.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const router = express.Router();
router.get('/stats', authMiddleware, getDashboardStats);
module.exports = router;
