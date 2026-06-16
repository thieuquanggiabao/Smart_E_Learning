const express = require('express');
const router = express.Router();
const { createAssignment, submitAndGrade, getAssignmentsByCourse, updateAssignment, deleteAssignment, getCourseSubmissions, overrideSubmissionScore } = require('../controllers/assignmentController');
const { verifyToken, requireTeacher } = require('../middlewares/authMiddleware');

// 1. Giảng viên tạo bài tập (Gắn vào một khóa học cụ thể)
router.post('/courses/:courseId/assignments', verifyToken, requireTeacher, createAssignment);
router.get('/courses/:courseId/assignments', getAssignmentsByCourse);
router.put('/assignments/:assignmentId', verifyToken, requireTeacher, updateAssignment);
router.delete('/assignments/:assignmentId', verifyToken, requireTeacher, deleteAssignment);

// 3. Quản lý bài nộp (Giảng viên)
router.get('/courses/:courseId/submissions', verifyToken, requireTeacher, getCourseSubmissions);
router.put('/submissions/:submissionId/override', verifyToken, requireTeacher, overrideSubmissionScore);

// 2. Học viên nộp bài (Chỉ cần đăng nhập là nộp được)
router.post('/assignments/:assignmentId/submit', verifyToken, submitAndGrade);

module.exports = router;