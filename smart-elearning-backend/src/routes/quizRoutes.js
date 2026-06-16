const express = require('express');
const router = express.Router();
const {
    getQuizzes,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    generateQuizByAI,
    submitQuiz,
    getMySubmissions
} = require('../controllers/quizController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Group APIs by courseId
// Chú ý: trong server.js chúng ta sẽ mount route này với /api/courses

// GET /api/courses/:courseId/quizzes -> Lấy danh sách quiz
router.get('/:courseId/quizzes', verifyToken, getQuizzes);

// GET /api/courses/:courseId/quizzes/:quizId -> Lấy 1 quiz
router.get('/:courseId/quizzes/:quizId', verifyToken, getQuizById);

// POST /api/courses/:courseId/quizzes -> Tạo quiz mới
router.post('/:courseId/quizzes', verifyToken, createQuiz);

// PUT /api/courses/:courseId/quizzes/:quizId -> Sửa quiz
router.put('/:courseId/quizzes/:quizId', verifyToken, updateQuiz);

// DELETE /api/courses/:courseId/quizzes/:quizId -> Xóa quiz
router.delete('/:courseId/quizzes/:quizId', verifyToken, deleteQuiz);

// POST /api/courses/:courseId/generate-quiz -> Gọi AI sinh đề
router.post('/:courseId/generate-quiz', verifyToken, generateQuizByAI);

// POST /api/courses/:courseId/quizzes/:quizId/submit -> Nộp bài quiz
router.post('/:courseId/quizzes/:quizId/submit', verifyToken, submitQuiz);

// GET /api/courses/:courseId/quizzes/:quizId/submissions -> Xem lịch sử làm bài
router.get('/:courseId/quizzes/:quizId/submissions', verifyToken, getMySubmissions);

module.exports = router;
