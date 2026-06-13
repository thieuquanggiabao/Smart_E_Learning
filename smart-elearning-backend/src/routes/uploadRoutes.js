const express = require('express');
const router = express.Router();
const { generateUploadUrl } = require('../controllers/uploadController');
const { verifyToken, requireTeacher } = require('../middlewares/authMiddleware');

// Route này bắt buộc phải có token và quyền teacher
router.post('/generate-url', verifyToken, requireTeacher, generateUploadUrl);

module.exports = router;