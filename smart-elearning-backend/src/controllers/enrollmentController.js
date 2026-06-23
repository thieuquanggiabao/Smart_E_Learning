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

        // 3. Xử lý thanh toán nếu khóa học có phí
        const courseData = courseDoc.data();
        const price = Number(courseData.price) || 0;
        
        if (price > 0) {
            // Đây là mô phỏng thanh toán thành công
            const discountRate = Number(courseData.discountRate) || 10;
            const adminRevenue = Math.round(price * (discountRate / 100));
            const teacherRevenue = price - adminRevenue;

            const newTransaction = {
                courseId: courseId,
                studentId: userId,
                teacherId: courseData.teacherId || '',
                amount: price,
                adminRevenue: adminRevenue,
                teacherRevenue: teacherRevenue,
                status: 'success', // Giao dịch thành công
                createdAt: new Date().toISOString()
            };

            // Lưu lịch sử giao dịch vào collection 'transactions'
            await db.collection('transactions').add(newTransaction);
        }

        // 4. Tạo bản ghi đăng ký mới (Dù free hay có phí thì đều ghi danh)
        const newEnrollment = {
            courseId: courseId,
            studentId: userId,
            progress: 0,
            completedLessons: [],
            averageScore: 0,
            status: "learning",
            createdAt: new Date().toISOString()
        };

        // Lưu vào collection 'enrollments'
        await enrollmentsRef.add(newEnrollment);

        res.status(201).json({
            message: price > 0 ? 'Thanh toán và Đăng ký khóa học thành công!' : 'Đăng ký khóa học Miễn phí thành công!',
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

// Kiểm tra xem học viên đã đăng ký khóa học chưa
const checkEnrollment = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user?.userId;
        const role = req.user?.role;

        if (!userId) {
            return res.status(200).json({ enrolled: false });
        }

        if (role === 'admin') {
            return res.status(200).json({ enrolled: true });
        }

        const snapshot = await db.collection('enrollments')
            .where('studentId', '==', userId)
            .where('courseId', '==', courseId)
            .get();

        res.status(200).json({ enrolled: !snapshot.empty });
    } catch (error) {
        console.error('Lỗi kiểm tra trạng thái ghi danh:', error);
        res.status(500).json({ enrolled: false });
    }
};

// Đừng quên export thêm hàm này
module.exports = { enrollCourse, getMyEnrolledCourses, checkEnrollment };