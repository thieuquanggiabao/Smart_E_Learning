const { db } = require('../config/firebase');

const checkAndGenerateCertificate = async (studentId, courseId) => {
    try {
        // 1. Kiểm tra xem học viên đã có chứng chỉ khóa này chưa
        const certSnapshot = await db.collection('certificates')
            .where('studentId', '==', studentId)
            .where('courseId', '==', courseId)
            .get();

        if (!certSnapshot.empty) return; // Đã có chứng chỉ rồi thì bỏ qua

        // 2. Lấy thông tin enrollment để check điều kiện
        const enrollSnapshot = await db.collection('enrollments')
            .where('studentId', '==', studentId)
            .where('courseId', '==', courseId)
            .get();

        if (enrollSnapshot.empty) return;

        const enrollData = enrollSnapshot.docs[0].data();

        // Điều kiện: Tiến độ 100% và điểm trung bình tích lũy từ 5 trở lên
        if (enrollData.progress >= 100 && enrollData.averageScore >= 5.0) {
            const newCertificate = {
                studentId: studentId,
                courseId: courseId,
                finalScore: enrollData.averageScore,
                issuedAt: new Date().toISOString(),
                certificateCode: 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase()
            };

            await db.collection('certificates').add(newCertificate);
            console.log(`[Hệ thống] Đã tự động cấp chứng chỉ ${newCertificate.certificateCode} cho học viên ${studentId}`);
        }
    } catch (error) {
        console.error('Lỗi tự động cấp chứng chỉ:', error);
    }
};

module.exports = { checkAndGenerateCertificate };