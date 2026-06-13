const express = require('express');
const router = express.Router();
const { getMyEnrolledCourses } = require('../controllers/enrollmentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route lấy danh sách khóa học đang theo học (Bắt buộc đăng nhập)
router.get('/my-courses', verifyToken, getMyEnrolledCourses);

module.exports = router;