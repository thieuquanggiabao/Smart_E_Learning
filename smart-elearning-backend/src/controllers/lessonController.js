const { db } = require('../config/firebase');

const createLesson = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const { title, description, videoUrl, order } = req.body;

        // 1. Kiểm tra xem khóa học có tồn tại không
        const courseRef = db.collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();

        if (!courseDoc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
        }

        // 2. Tạo dữ liệu bài giảng mới
        const newLesson = {
            title: title || '',
            description: description || '',
            videoUrl: videoUrl || '', // Đây chính là cái link publicFileUrl
            order: order || 1, // Thứ tự bài giảng (Bài 1, Bài 2...)
            createdAt: new Date().toISOString()
        };

        // 3. Lưu vào sub-collection 'lessons' của khóa học đó
        const lessonRef = await courseRef.collection('lessons').add(newLesson);

        // 4. Tự động tăng biến đếm số lượng bài giảng của khóa học lên 1
        await courseRef.update({
            totalLessons: courseDoc.data().totalLessons + 1
        });

        res.status(201).json({
            message: 'Thêm bài giảng thành công!',
            lessonId: lessonRef.id,
            lesson: newLesson
        });

    } catch (error) {
        console.error('Lỗi khi thêm bài giảng:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};
// Lấy danh sách bài giảng của một khóa học
const getLessonsByCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;

        // Truy cập vào sub-collection 'lessons' và sắp xếp theo trường 'order' tăng dần
        const lessonsSnapshot = await db.collection('courses')
            .doc(courseId)
            .collection('lessons')
            .orderBy('order', 'asc')
            .get();

        // Gom dữ liệu lại thành một mảng
        const lessons = lessonsSnapshot.docs.map(doc => ({
            lessonId: doc.id,
            ...doc.data()
        }));

        res.status(200).json(lessons);

    } catch (error) {
        console.error('Lỗi khi lấy danh sách bài giảng:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};

// Nhớ export thêm hàm này ở cuối file
module.exports = { createLesson, getLessonsByCourse };