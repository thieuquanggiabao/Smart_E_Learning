const { db } = require('../config/firebase');

const createCourse = async (req, res) => {
    try {
        const { title, description, thumbnailUrl, category, level } = req.body;

        // Lấy thông tin giảng viên từ middleware verifyToken
        const teacherId = req.user.userId;

        // Tạo một reference mới trong collection 'courses' để lấy ID trước
        const courseRef = db.collection('courses').doc();

        const newCourse = {
            courseId: courseRef.id,
            title: title || '',
            description: description || '',
            teacherId: teacherId,
            thumbnailUrl: thumbnailUrl || '',
            category: category || '',
            level: level || 'beginner',
            totalLessons: 0, // Giá trị mặc định ban đầu
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Lưu dữ liệu vào Firestore
        await courseRef.set(newCourse);

        res.status(201).json({
            message: 'Tạo khóa học thành công!',
            course: newCourse
        });

    } catch (error) {
        console.error('Lỗi khi tạo khóa học:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};
// Lấy danh sách toàn bộ khóa học
const getAllCourses = async (req, res) => {
    try {
        const coursesSnapshot = await db.collection('courses').get();

        // Duyệt qua từng document và lấy dữ liệu
        const courses = coursesSnapshot.docs.map(doc => doc.data());

        res.status(200).json(courses);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách khóa học:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};

// Lấy chi tiết một khóa học theo ID
const getCourseById = async (req, res) => {
    try {
        const courseId = req.params.id;
        const courseDoc = await db.collection('courses').doc(courseId).get();

        if (!courseDoc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học này!' });
        }

        res.status(200).json(courseDoc.data());
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết khóa học:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};
module.exports = { createCourse, getAllCourses, getCourseById };