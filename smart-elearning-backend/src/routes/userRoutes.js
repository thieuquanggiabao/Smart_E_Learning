const express = require('express');
const router = express.Router();
const { getStudentDashboard } = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route Dashboard (Yêu cầu học viên đăng nhập)
router.get('/dashboard', verifyToken, getStudentDashboard);

module.exports = router;