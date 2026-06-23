const express = require('express');
const router = express.Router();
const { getStudentDashboard, getMyCertificates } = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route Dashboard (Yêu cầu học viên đăng nhập)
router.get('/dashboard', verifyToken, getStudentDashboard);

// Route lấy chứng chỉ
router.get('/certificates', verifyToken, getMyCertificates);

module.exports = router;