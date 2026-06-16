const express = require('express');
const router = express.Router();
const { askChatbot, getChatHistory } = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route gửi câu hỏi cho chatbot (Học viên cần đăng nhập)
router.post('/ask', verifyToken, askChatbot);

// Route xem lịch sử hỏi đáp AI
router.get('/history', verifyToken, getChatHistory);

module.exports = router;