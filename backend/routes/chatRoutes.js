const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Chat routes
router
  .route('/')
  .get(chatController.getAllChats)
  .post(chatController.createChat);

router
  .route('/:id')
  .get(chatController.getChat)
  .delete(chatController.deleteChat);

router
  .route('/:id/messages')
  .post(chatController.sendMessage);

router
  .route('/stats')
  .get(chatController.getChatStats);

module.exports = router; 