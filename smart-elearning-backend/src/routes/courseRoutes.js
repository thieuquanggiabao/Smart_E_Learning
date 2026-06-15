const express = require('express');
const router = express.Router();
const { generateTranscript } = require('../controllers/aiController');
const { createCourse, getAllCourses, getCourseById, markLessonCompleted } = require('../controllers/courseController');
const { createLesson, getLessonsByCourse } = require('../controllers/lessonController');
const { enrollCourse } = require('../controllers/enrollmentController');
const { verifyToken, requireTeacher } = require('../middlewares/authMiddleware');
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', verifyToken, requireTeacher, createCourse);
// API Tạo khóa học (Yêu cầu đăng nhập VÀ phải là giảng viên/admin)
router.post('/', verifyToken, requireTeacher, createCourse);
router.post('/:courseId/lessons', verifyToken, requireTeacher, createLesson);
router.get('/:courseId/lessons', getLessonsByCourse);
router.post('/:courseId/enroll', verifyToken, enrollCourse);
router.post('/:courseId/lessons/:lessonId/generate-transcript', verifyToken, requireTeacher, generateTranscript);
router.post('/:courseId/lessons/:lessonId/complete', verifyToken, markLessonCompleted);
module.exports = router;