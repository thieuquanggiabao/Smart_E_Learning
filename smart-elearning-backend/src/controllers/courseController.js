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

const markLessonCompleted = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const studentId = req.user.userId;

        // 1. Tìm bản ghi đăng ký (enrollment) của học viên này trong khóa học
        const enrollmentsRef = db.collection('enrollments');
        const snapshot = await enrollmentsRef
            .where('courseId', '==', courseId)
            .where('studentId', '==', studentId)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Học viên chưa đăng ký khóa học này!' });
        }

        const enrollmentDoc = snapshot.docs[0];
        const enrollmentData = enrollmentDoc.data();
        let completedLessons = enrollmentData.completedLessons || [];

        // 2. Kiểm tra xem bài học đã được học viên bấm hoàn thành từ trước chưa
        if (completedLessons.includes(lessonId)) {
            return res.status(200).json({
                message: 'Bài học này đã được hoàn thành từ trước.',
                progress: enrollmentData.progress
            });
        }

        // 3. Nếu chưa, đẩy ID bài học này vào mảng đã hoàn thành
        completedLessons.push(lessonId);

        // 4. Lấy tổng số bài học hiện có của khóa học đó để làm mẫu số
        const lessonsSnapshot = await db.collection('courses').doc(courseId).collection('lessons').get();
        const totalLessons = lessonsSnapshot.size;

        // 5. Thuật toán tính phần trăm tiến độ
        let progress = 0;
        if (totalLessons > 0) {
            // Công thức: (Số bài đã học / Tổng số bài) * 100, làm tròn số
            progress = Math.round((completedLessons.length / totalLessons) * 100);
        }

        // 6. Xử lý logic trạng thái (status)
        let status = enrollmentData.status || 'learning';
        if (progress >= 100) {
            status = 'completed'; // Chuyển trạng thái sang "đã tốt nghiệp"
            progress = 100;       // Khóa cứng ở 100%, phòng trường hợp data bị lỗi
        }

        // 7. Cập nhật lại bản ghi vào Firestore
        await enrollmentsRef.doc(enrollmentDoc.id).update({
            completedLessons: completedLessons,
            progress: progress,
            status: status,
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({
            message: 'Cập nhật tiến độ thành công!',
            progress: progress,
            status: status,
            completedLessons: completedLessons
        });

    } catch (error) {
        console.error('Lỗi tính toán tiến độ:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật tiến độ', error: error.message });
    }
};

module.exports = { createCourse, getAllCourses, getCourseById, markLessonCompleted };