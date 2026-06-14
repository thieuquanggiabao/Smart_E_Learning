const express = require('express');
const router = express.Router();
const { askChatbot } = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route gửi câu hỏi cho chatbot (Học viên cần đăng nhập)
router.post('/ask', verifyToken, askChatbot);

module.exports = router;