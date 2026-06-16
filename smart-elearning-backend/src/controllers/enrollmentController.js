const { db } = require('../config/firebase');

const enrollCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user.userId; // Lấy ID người dùng từ Token nhờ middleware verifyToken

        // 1. Kiểm tra xem khóa học có tồn tại trên hệ thống không
        const courseRef = db.collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();

        if (!courseDoc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
        }

        // 2. Kiểm tra xem học viên đã đăng ký khóa này chưa
        const enrollmentsRef = db.collection('enrollments');
        const checkSnapshot = await enrollmentsRef
            .where('studentId', '==', userId)
            .where('courseId', '==', courseId)
            .get();

        if (!checkSnapshot.empty) {
            return res.status(400).json({ message: 'Bạn đã đăng ký khóa học này rồi!' });
        }

        // 3. Tạo bản ghi đăng ký mới
        // Tìm đoạn code tạo enrollment và sửa thành thế này:
        const newEnrollment = {
            courseId: courseId,
            studentId: req.user.userId, // Đổi userId thành studentId cho chuẩn đề cương
            progress: 0,
            completedLessons: [],       // Mảng trống chứa các bài học đã hoàn thành
            averageScore: 0,            // Điểm trung bình ban đầu là 0
            status: "learning",         // Trạng thái đang học
            createdAt: new Date().toISOString() // Dùng createdAt thay vì enrolledAt
        };


        // Lưu vào collection 'enrollments'
        await enrollmentsRef.add(newEnrollment);

        res.status(201).json({
            message: 'Đăng ký khóa học thành công!',
            enrollment: newEnrollment
        });

    } catch (error) {
        console.error('Lỗi khi đăng ký khóa học:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};
// Lấy danh sách các khóa học mà học viên đang tham gia
const getMyEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.userId; // Lấy từ token của người dùng đang đăng nhập

        // 1. Quét trong collection 'enrollments' tìm các bản ghi của user này
        const enrollmentsSnapshot = await db.collection('enrollments')
            .where('studentId', '==', userId)
            .get();

        if (enrollmentsSnapshot.empty) {
            return res.status(200).json([]); // Trả về mảng rỗng nếu chưa học khóa nào
        }

        // 2. Lấy thông tin chi tiết của từng khóa học tương ứng
        const enrolledCourses = [];

        for (const doc of enrollmentsSnapshot.docs) {
            const enrollmentData = doc.data();
            const courseDoc = await db.collection('courses').doc(enrollmentData.courseId).get();

            if (courseDoc.exists) {
                enrolledCourses.push({
                    enrollmentId: doc.id,
                    progress: enrollmentData.progress, // Phần trăm hoàn thành
                    enrolledAt: enrollmentData.createdAt || enrollmentData.enrolledAt,
                    course: { courseId: courseDoc.id, ...courseDoc.data() } // Kẹp thêm thông tin (tên, ảnh, mô tả) của khóa học
                });
            }
        }

        res.status(200).json(enrolledCourses);

    } catch (error) {
        console.error('Lỗi khi lấy danh sách khóa học của tôi:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};

// Đừng quên export thêm hàm này
module.exports = { enrollCourse, getMyEnrolledCourses };