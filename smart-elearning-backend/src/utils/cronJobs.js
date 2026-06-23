const cron = require('node-cron');
const { db } = require('../config/firebase');

// Lên lịch chạy vào lúc 00:00 (Nửa đêm) mỗi ngày
const scheduleCleanupJobs = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('⏳ Đang chạy tiến trình dọn dẹp giao dịch rác (Pending)...');
        
        try {
            // Lấy thời điểm hiện tại trừ đi 1 giờ (thời hạn 1 giờ)
            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);
            const cutoffTime = oneHourAgo.toISOString();

            // Truy vấn các giao dịch pending được tạo trước cutoffTime
            const snapshot = await db.collection('transactions')
                .where('status', '==', 'pending')
                .where('createdAt', '<=', cutoffTime)
                .get();

            if (snapshot.empty) {
                console.log('✅ Không có giao dịch rác nào cần dọn dẹp.');
                return;
            }

            // Xóa hàng loạt bằng batch
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`✅ Dọn dẹp thành công ${snapshot.size} giao dịch rác.`);
        } catch (error) {
            console.error('❌ Lỗi khi dọn dẹp giao dịch:', error);
        }
    });

    console.log('⏰ Cron Job dọn dẹp rác đã được kích hoạt (Lịch chạy: 00:00 mỗi ngày).');
};

module.exports = { scheduleCleanupJobs };
