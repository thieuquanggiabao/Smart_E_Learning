const express = require('express');
const router = express.Router();
const {
    getMyStudySets,
    generateStudySetByAI,
    deleteStudySet
} = require('../controllers/studySetController');
const { verifyToken } = require('../middlewares/authMiddleware');

// GET /api/courses/:courseId/study-sets -> Lấy danh sách bộ tự học của student
router.get('/:courseId/study-sets', verifyToken, getMyStudySets);

// POST /api/courses/:courseId/study-sets/generate -> Gọi AI sinh bộ tự học
router.post('/:courseId/study-sets/generate', verifyToken, generateStudySetByAI);

// DELETE /api/courses/:courseId/study-sets/:setId -> Xóa bộ tự học
router.delete('/:courseId/study-sets/:setId', verifyToken, deleteStudySet);

module.exports = router;
