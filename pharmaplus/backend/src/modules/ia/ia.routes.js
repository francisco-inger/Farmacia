const express = require('express');
const ctrl = require('./ia.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const router = express.Router();
router.get('/conversations', authMiddleware, ctrl.getConversations);
router.post('/conversations', authMiddleware, ctrl.createConversation);
router.get('/conversations/:id/messages', authMiddleware, ctrl.getMessages);
router.post('/chat', authMiddleware, ctrl.chat);
module.exports = router;
