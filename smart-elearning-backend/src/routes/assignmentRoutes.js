const express = require('express');
const router = express.Router();
const { createAssignment, submitAndGrade } = require('../controllers/assignmentController');
const { verifyToken, requireTeacher } = require('../middlewares/authMiddleware');

// 1. Giảng viên tạo bài tập (Gắn vào một khóa học cụ thể)
router.post('/courses/:courseId/assignments', verifyToken, requireTeacher, createAssignment);

// 2. Học viên nộp bài (Chỉ cần đăng nhập là nộp được)
router.post('/assignments/:assignmentId/submit', verifyToken, submitAndGrade);

module.exports = router;