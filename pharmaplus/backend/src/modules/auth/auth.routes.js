const express = require('express');
const { login, logout, getProfile, changePassword } = require('./auth.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/profile', authMiddleware, getProfile);
router.put('/change-password', authMiddleware, changePassword);

module.exports = router;
