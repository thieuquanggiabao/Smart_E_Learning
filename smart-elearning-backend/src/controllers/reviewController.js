const { db } = require('../config/firebase');

const addReview = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { rating, comment } = req.body;
        const studentId = req.user.userId;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Số sao đánh giá phải từ 1 đến 5!' });
        }

        // 1. Kiểm tra xem học viên thực sự đã đăng ký khóa học này chưa mới cho đánh giá
        const enrollSnapshot = await db.collection('enrollments')
            .where('courseId', '==', courseId)
            .where('studentId', '==', studentId)
            .get();

        if (enrollSnapshot.empty) {
            return res.status(403).json({ message: 'Bạn cần đăng ký học khóa này trước khi để lại đánh giá!' });
        }

        // 2. Lưu đánh giá vào database
        const newReview = {
            courseId: courseId,
            studentId: studentId,
            rating: Number(rating),
            comment: comment || '',
            createdAt: new Date().toISOString()
        };

        await db.collection('reviews').add(newReview);

        res.status(201).json({
            message: 'Cảm ơn bạn đã đánh giá khóa học!',
            review: newReview
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = { addReview };