const express = require('express');
const router = express.Router();
const { addReview } = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route gửi đánh giá cho một khóa học cụ thể
router.post('/:courseId/reviews', verifyToken, addReview);

module.exports = router;