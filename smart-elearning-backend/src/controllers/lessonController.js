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

// Cập nhật bài giảng
const updateLesson = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const { title, description, videoUrl, order } = req.body;

        const lessonRef = db.collection('courses').doc(courseId).collection('lessons').doc(lessonId);
        const lessonDoc = await lessonRef.get();

        if (!lessonDoc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy bài giảng!' });
        }

        const updatedData = {
            title: title || lessonDoc.data().title,
            description: description || lessonDoc.data().description,
            videoUrl: videoUrl !== undefined ? videoUrl : lessonDoc.data().videoUrl,
            order: order || lessonDoc.data().order,
            updatedAt: new Date().toISOString()
        };

        await lessonRef.update(updatedData);

        res.status(200).json({
            message: 'Cập nhật bài giảng thành công!',
            lesson: { lessonId, ...lessonDoc.data(), ...updatedData }
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật bài giảng:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};

// Xóa bài giảng
const deleteLesson = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;

        const courseRef = db.collection('courses').doc(courseId);
        const lessonRef = courseRef.collection('lessons').doc(lessonId);
        
        const lessonDoc = await lessonRef.get();
        if (!lessonDoc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy bài giảng!' });
        }

        // Xóa lesson
        await lessonRef.delete();

        // Cập nhật lại totalLessons của course
        const courseDoc = await courseRef.get();
        if (courseDoc.exists) {
            const currentTotal = courseDoc.data().totalLessons || 1;
            await courseRef.update({
                totalLessons: Math.max(0, currentTotal - 1)
            });
        }

        res.status(200).json({ message: 'Xóa bài giảng thành công!' });

    } catch (error) {
        console.error('Lỗi khi xóa bài giảng:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};

module.exports = { createLesson, getLessonsByCourse, updateLesson, deleteLesson };