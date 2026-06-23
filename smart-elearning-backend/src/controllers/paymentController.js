const { PayOS } = require('@payos/node');
const { db } = require('../config/firebase');
require('dotenv').config({ override: true });

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY
});

const createPaymentLink = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.userId;

        // 1. Kiểm tra khóa học
        const courseRef = db.collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();

        if (!courseDoc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
        }

        const courseData = courseDoc.data();
        const price = Number(courseData.price) || 0;

        if (price <= 0) {
            return res.status(400).json({ message: 'Khóa học này miễn phí, vui lòng dùng tính năng Enroll thông thường!' });
        }

        // 2. Tạo giao dịch Pending
        const transactionId = Math.floor(Math.random() * 10000000000000); // Tạo order code ngẫu nhiên
        const discountRate = Number(courseData.discountRate) || 10;
        const adminRevenue = Math.round(price * (discountRate / 100));
        const teacherRevenue = price - adminRevenue;

        const newTransaction = {
            transactionId: transactionId.toString(),
            courseId: courseId,
            studentId: userId,
            teacherId: courseData.teacherId || '',
            amount: price,
            adminRevenue: adminRevenue,
            teacherRevenue: teacherRevenue,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        const txRef = await db.collection('transactions').add(newTransaction);

        // 3. Tạo link thanh toán PayOS
        const order = {
            orderCode: transactionId,
            amount: price,
            description: `Thanh toan KH ${courseId.substring(0, 5)}`,
            returnUrl: `${process.env.FRONTEND_URL}/payment-result?txId=${txRef.id}`,
            cancelUrl: `${process.env.FRONTEND_URL}/payment-result?txId=${txRef.id}`
        };

        const paymentLink = await payos.paymentRequests.create(order);

        // 4. Trả về URL thanh toán cho Frontend
        res.status(200).json({
            message: 'Tạo link thanh toán thành công',
            checkoutUrl: paymentLink.checkoutUrl
        });

    } catch (error) {
        console.error('Lỗi khi tạo payment link:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const receiveWebhook = async (req, res) => {
    try {
        const webhookData = req.body;

        // Xác thực webhook từ PayOS (bảo mật)
        const webhookDataVerified = payos.webhooks.verify(webhookData);

        if (webhookDataVerified.code === '00' || webhookDataVerified.success) {
            const orderCode = webhookDataVerified.orderCode || webhookDataVerified.data?.orderCode;
            
            // Tìm giao dịch trong Firestore
            const txSnapshot = await db.collection('transactions').where('transactionId', '==', orderCode.toString()).get();
            
            if (!txSnapshot.empty) {
                const txDoc = txSnapshot.docs[0];
                const txData = txDoc.data();

                if (txData.status !== 'success') {
                    // 1. Cập nhật trạng thái giao dịch
                    await txDoc.ref.update({
                        status: 'success',
                        updatedAt: new Date().toISOString(),
                        gatewayTransactionId: webhookDataVerified.reference
                    });

                    // 2. Ghi danh (Enroll) học viên (kiểm tra trùng lặp)
                    const enrollSnapshot = await db.collection('enrollments')
                        .where('courseId', '==', txData.courseId)
                        .where('studentId', '==', txData.studentId)
                        .get();
                        
                    if (enrollSnapshot.empty) {
                        const newEnrollment = {
                            courseId: txData.courseId,
                            studentId: txData.studentId,
                            progress: 0,
                            completedLessons: [],
                            averageScore: 0,
                            status: "learning",
                            createdAt: new Date().toISOString()
                        };
                        const enrollmentId = `${txData.studentId}_${txData.courseId}`;
                        await db.collection('enrollments').doc(enrollmentId).set(newEnrollment);
                    }
                }
            }
        }

        res.status(200).json({ message: 'Webhook received successfully' });
    } catch (error) {
        console.error('Lỗi khi xử lý webhook PayOS:', error);
        // Trả về 200 để PayOS không gọi lại liên tục nếu lỗi
        res.status(200).json({ message: 'Webhook processed with error', error: error.message });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { orderCode } = req.body;
        if (!orderCode) {
            return res.status(400).json({ message: 'Thiếu orderCode' });
        }

        // Gọi PayOS API để lấy trạng thái mới nhất của đơn hàng
        const paymentInfo = await payos.paymentRequests.get(orderCode);
        
        if (paymentInfo && paymentInfo.status === 'PAID') {
            // Tìm giao dịch trong DB
            const txSnapshot = await db.collection('transactions').where('transactionId', '==', orderCode.toString()).get();
            if (!txSnapshot.empty) {
                const txDoc = txSnapshot.docs[0];
                const txData = txDoc.data();

                // Nếu giao dịch chưa được cập nhật thành success
                if (txData.status !== 'success') {
                    await txDoc.ref.update({
                        status: 'success',
                        updatedAt: new Date().toISOString()
                    });

                    // Ghi danh học viên (kiểm tra trùng lặp để chống spam do React strict mode)
                    const enrollSnapshot = await db.collection('enrollments')
                        .where('courseId', '==', txData.courseId)
                        .where('studentId', '==', txData.studentId)
                        .get();
                        
                    if (enrollSnapshot.empty) {
                        const newEnrollment = {
                            courseId: txData.courseId,
                            studentId: txData.studentId,
                            progress: 0,
                            completedLessons: [],
                            averageScore: 0,
                            status: "learning",
                            createdAt: new Date().toISOString()
                        };
                        const enrollmentId = `${txData.studentId}_${txData.courseId}`;
                        await db.collection('enrollments').doc(enrollmentId).set(newEnrollment);
                    }
                }
                return res.status(200).json({ message: 'Xác thực thành công', enrolled: true });
            }
        }
        
        return res.status(400).json({ message: 'Giao dịch chưa hoàn thành hoặc không tìm thấy' });
    } catch (error) {
        console.error('Lỗi khi verify payment:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = { createPaymentLink, receiveWebhook, verifyPayment };
