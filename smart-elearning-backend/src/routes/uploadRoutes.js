const express = require('express');
const router = express.Router();
const { generateUploadUrl } = require('../controllers/uploadController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route này bắt buộc phải có token nhưng học viên vẫn upload được (để nộp bài, chat group)
router.post('/generate-url', verifyToken, generateUploadUrl);

module.exports = router;