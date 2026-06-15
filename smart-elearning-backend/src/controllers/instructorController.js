const { db } = require('../config/firebase');

const getInstructorDashboard = async (req, res) => {
    try {
        const instructorId = req.user.userId; // Lấy từ verifyToken mã giảng viên

        // 1. Lấy danh sách khóa học do giảng viên này tạo
        const coursesSnapshot = await db.collection('courses')
            .where('instructorId', '==', instructorId)
            .get();

        if (coursesSnapshot.empty) {
            return res.status(200).json({ message: 'Bạn chưa tạo khóa học nào.', dashboard: [] });
        }

        const dashboardData = [];

        // 2. Duyệt qua từng khóa học để tính toán số liệu học viên
        for (const courseDoc of coursesSnapshot.docs) {
            const courseId = courseDoc.id;
            const courseTitle = courseDoc.data().title;

            // Lấy tất cả học viên đăng ký khóa học này
            const enrollmentsSnapshot = await db.collection('enrollments')
                .where('courseId', '==', courseId)
                .get();

            const totalStudents = enrollmentsSnapshot.size;
            let totalProgress = 0;
            let totalScore = 0;
            let completedCount = 0;

            enrollmentsSnapshot.forEach(enrollDoc => {
                const enrollData = enrollDoc.data();
                totalProgress += enrollData.progress || 0;
                totalScore += enrollData.averageScore || 0;
                if (enrollData.status === 'completed') {
                    completedCount++;
                }
            });

            // Tính chỉ số trung bình của lớp
            const avgProgress = totalStudents > 0 ? parseFloat((totalProgress / totalStudents).toFixed(2)) : 0;
            const avgClassScore = totalStudents > 0 ? parseFloat((totalScore / totalStudents).toFixed(2)) : 0;

            dashboardData.push({
                courseId: courseId,
                courseTitle: courseTitle,
                totalStudents: totalStudents,
                completedStudents: completedCount,
                classAverageProgress: avgProgress,
                classAverageScore: avgClassScore
            });
        }

        res.status(200).json({
            message: 'Tải dữ liệu thống kê giảng viên thành công!',
            totalOwnCourses: dashboardData.length,
            dashboard: dashboardData
        });

    } catch (error) {
        console.error('Lỗi Dashboard Giảng viên:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = { getInstructorDashboard };