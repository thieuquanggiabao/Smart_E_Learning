const { Logging } = require('@google-cloud/logging');
const monitoring = require('@google-cloud/monitoring');
const path = require('path');
const { db, auth } = require('../config/firebase');

const keyFilename = path.join(__dirname, '../config/gcs-key.json');

// Khởi tạo GCP Clients
const logging = new Logging({ keyFilename });
const metricClient = new monitoring.MetricServiceClient({ keyFilename });
// Project ID mặc định của Firebase
const projectId = 'smart-9e93c'; 

// 1. API: Lấy danh sách Logs từ Cloud Logging
const getSystemLogs = async (req, res) => {
    try {
        // Lấy 50 dòng log gần nhất của dịch vụ Cloud Run 'smart-elearning-backend'
        const filter = `resource.type="cloud_run_revision" AND resource.labels.service_name="smart-elearning-backend"`;
        const [entries] = await logging.getEntries({
            filter: filter,
            pageSize: 50,
            orderBy: 'timestamp desc',
        });

        const logs = entries.map(entry => {
            let message = 'No message';

            // 1. Nếu log là Text Payload
            if (typeof entry.data === 'string' && entry.data.trim() !== '') {
                message = entry.data;
            } 
            // 2. Nếu log là JSON Payload có chứa message
            else if (entry.data && entry.data.message) {
                message = entry.data.message;
            }
            // 3. Nếu là log HTTP Request (Cloud Run tự sinh)
            else if (entry.metadata && entry.metadata.httpRequest) {
                const req = entry.metadata.httpRequest;
                message = `${req.requestMethod || 'REQ'} ${req.status || '???'} - ${req.requestUrl || ''}`;
            }
            // 4. Fallback (hiển thị JSON nếu có)
            else if (entry.data && Object.keys(entry.data).length > 0) {
                message = JSON.stringify(entry.data);
            }

            return {
                id: entry.metadata?.insertId || Math.random().toString(),
                timestamp: entry.metadata?.timestamp || new Date().toISOString(),
                severity: entry.metadata?.severity || 'DEFAULT',
                message: message,
            };
        });

        res.status(200).json({ logs });
    } catch (error) {
        console.error('Lỗi khi lấy logs:', error);
        res.status(500).json({ message: 'Không thể lấy logs', error: error.message });
    }
};

// 2. API: Lấy thông số CPU & RAM từ Cloud Monitoring
const getSystemMetrics = async (req, res) => {
    try {
        // Lấy dữ liệu 6 giờ qua
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - 6);
        const endTime = new Date();

        // Query cho CPU Utilization
        const cpuRequest = {
            name: metricClient.projectPath(projectId),
            filter: `metric.type="run.googleapis.com/container/cpu/utilizations" AND resource.labels.service_name="smart-elearning-backend"`,
            interval: {
                startTime: { seconds: startTime.getTime() / 1000 },
                endTime: { seconds: endTime.getTime() / 1000 },
            },
            aggregation: {
                alignmentPeriod: { seconds: 300 }, // gộp mỗi 5 phút
                crossSeriesReducer: 'REDUCE_PERCENTILE_99',
                perSeriesAligner: 'ALIGN_PERCENTILE_99',
            },
        };

        // Query cho Memory Utilization
        const memRequest = {
            name: metricClient.projectPath(projectId),
            filter: `metric.type="run.googleapis.com/container/memory/utilizations" AND resource.labels.service_name="smart-elearning-backend"`,
            interval: {
                startTime: { seconds: startTime.getTime() / 1000 },
                endTime: { seconds: endTime.getTime() / 1000 },
            },
            aggregation: {
                alignmentPeriod: { seconds: 300 },
                crossSeriesReducer: 'REDUCE_PERCENTILE_99',
                perSeriesAligner: 'ALIGN_PERCENTILE_99',
            },
        };

        const [[cpuTimeSeries], [memTimeSeries]] = await Promise.all([
            metricClient.listTimeSeries(cpuRequest),
            metricClient.listTimeSeries(memRequest)
        ]);

        // Hàm helper để parse TimeSeries trả về mảng dễ dùng cho Frontend
        const parseTimeSeries = (timeSeries) => {
            if (!timeSeries || timeSeries.length === 0) return [];
            return timeSeries[0].points.map(point => ({
                timestamp: new Date(point.interval.endTime.seconds * 1000).toISOString(),
                value: point.value.doubleValue * 100 // Convert sang %
            })).reverse(); // Đảo ngược để dữ liệu tăng dần theo thời gian
        };

        res.status(200).json({
            cpu: parseTimeSeries(cpuTimeSeries),
            memory: parseTimeSeries(memTimeSeries)
        });

    } catch (error) {
        console.error('Lỗi khi lấy metrics:', error);
        res.status(500).json({ message: 'Không thể lấy hiệu năng', error: error.message });
    }
};

// ================= USER MANAGEMENT =================

// Lấy danh sách tất cả người dùng
const getAllUsers = async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ users });
    } catch (error) {
        console.error('Lỗi khi lấy users:', error);
        res.status(500).json({ message: 'Không thể lấy danh sách người dùng', error: error.message });
    }
};

// Cập nhật role của người dùng
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['student', 'teacher', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Role không hợp lệ' });
        }
        await db.collection('users').doc(id).update({ role });
        res.status(200).json({ message: 'Cập nhật quyền thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật role:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Xóa người dùng (khỏi Firestore và Firebase Auth)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Xóa trong Auth
        try {
            await auth.deleteUser(id);
        } catch (authErr) {
            console.error('Lỗi xóa Firebase Auth (có thể user không tồn tại trong Auth):', authErr.message);
        }
        // Xóa trong Firestore
        await db.collection('users').doc(id).delete();
        res.status(200).json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ================= COURSE MANAGEMENT =================

// Lấy danh sách tất cả khóa học
const getAllCoursesAdmin = async (req, res) => {
    try {
        const snapshot = await db.collection('courses').get();
        const courses = [];
        
        for (const doc of snapshot.docs) {
            const courseData = doc.data();
            let teacherName = 'Không rõ';
            
            if (courseData.teacherId) {
                const teacherDoc = await db.collection('users').doc(courseData.teacherId).get();
                if (teacherDoc.exists) {
                    teacherName = teacherDoc.data().name || teacherDoc.data().email || 'Không rõ';
                }
            }
            
            courses.push({
                id: doc.id,
                ...courseData,
                teacherName
            });
        }
        
        res.status(200).json({ courses });
    } catch (error) {
        console.error('Lỗi lấy courses admin:', error);
        res.status(500).json({ message: 'Không thể lấy danh sách khóa học', error: error.message });
    }
};

// Duyệt / Ẩn khóa học
const updateCourseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' hoặc 'pending'
        await db.collection('courses').doc(id).update({ status });
        res.status(200).json({ message: `Đã đổi trạng thái khóa học thành ${status}` });
    } catch (error) {
        console.error('Lỗi duyệt khóa học:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Xóa khóa học
const deleteCourseAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('courses').doc(id).delete();
        res.status(200).json({ message: 'Đã xóa khóa học' });
    } catch (error) {
        console.error('Lỗi xóa khóa học:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy tổng doanh thu hệ thống (dành cho Admin)
const getAdminRevenue = async (req, res) => {
    try {
        const transactionsSnapshot = await db.collection('transactions').get();
        let totalRevenue = 0;

        transactionsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'success') {
                totalRevenue += data.adminRevenue || 0;
            }
        });

        res.status(200).json({ totalRevenue });
    } catch (error) {
        console.error('Lỗi lấy doanh thu admin:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = { 
    getSystemLogs, 
    getSystemMetrics,
    getAllUsers,
    updateUserRole,
    deleteUser,
    getAllCoursesAdmin,
    updateCourseStatus,
    deleteCourseAdmin,
    getAdminRevenue
};
