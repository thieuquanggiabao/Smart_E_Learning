const { db } = require('../config/firebase');

const getStudentDashboard = async (req, res) => {
    try {
        const studentId = req.user.userId;

        // 1. Lấy tất cả các khóa học đã đăng ký của học viên này
        const enrollmentsSnapshot = await db.collection('enrollments')
            .where('studentId', '==', studentId)
            .get();

        if (enrollmentsSnapshot.empty) {
            return res.status(200).json({
                message: 'Học viên chưa đăng ký khóa học nào.',
                dashboard: []
            });
        }

        const dashboardData = [];

        // 2. Lặp qua các bản ghi đăng ký để lấy thông tin khóa học và gom dữ liệu
        for (const doc of enrollmentsSnapshot.docs) {
            const enrollment = doc.data();
            const courseId = enrollment.courseId;

            // Truy vấn tên khóa học thực tế từ bảng courses
            const courseDoc = await db.collection('courses').doc(courseId).get();
            let courseTitle = 'Khóa học không xác định';
            if (courseDoc.exists) {
                courseTitle = courseDoc.data().title;
            }

            // Gộp dữ liệu lại
            dashboardData.push({
                courseId: courseId,
                courseTitle: courseTitle,
                progress: enrollment.progress || 0,
                averageScore: enrollment.averageScore || 0,
                status: enrollment.status || 'learning',
                completedLessonsCount: enrollment.completedLessons ? enrollment.completedLessons.length : 0,
                enrolledAt: enrollment.createdAt || null
            });
        }

        // 3. Trả về cục dữ liệu đã tổng hợp
        res.status(200).json({
            message: 'Lấy dữ liệu Dashboard thành công!',
            totalCourses: dashboardData.length,
            dashboard: dashboardData
        });

    } catch (error) {
        console.error('Lỗi lấy Dashboard:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const getMyCertificates = async (req, res) => {
    try {
        const studentId = req.user.userId;

        const certSnapshot = await db.collection('certificates')
            .where('studentId', '==', studentId)
            .get();

        const certificates = [];
        for (const doc of certSnapshot.docs) {
            const certData = doc.data();
            
            // Lấy thêm tên khóa học
            const courseDoc = await db.collection('courses').doc(certData.courseId).get();
            const courseTitle = courseDoc.exists ? courseDoc.data().title : 'Khóa học không xác định';
            
            certificates.push({
                id: doc.id,
                ...certData,
                courseTitle
            });
        }

        res.status(200).json({ certificates });
    } catch (error) {
        console.error('Lỗi lấy danh sách chứng chỉ:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = { getStudentDashboard, getMyCertificates };