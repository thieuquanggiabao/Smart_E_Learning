const { auth, db } = require('../config/firebase');

// 1. Hàm kiểm tra xem người dùng đã đăng nhập (có token hợp lệ) chưa
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Truy cập bị từ chối. Vui lòng đăng nhập!' });
        }

        // Giải mã token bằng Firebase Admin
        const decodedToken = await auth.verifyIdToken(token);

        // Lấy thêm thông tin role từ Firestore để phân quyền
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();

        if (!userDoc.exists) {
            return res.status(401).json({ message: 'Tài khoản không tồn tại trong hệ thống!' });
        }

        // Gắn thông tin user vào request để các API phía sau sử dụng
        req.user = {
            uid: decodedToken.uid,    // Firebase UID - dùng làm userId chính
            userId: decodedToken.uid, // Alias cho tương thích với code cũ
            ...userDoc.data()         // Các fields khác: name, email, role...
        };
        next(); // Cho phép đi tiếp vào Controller

    } catch (error) {
        console.error('Lỗi xác thực token:', error);
        res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
};

// 2. Hàm kiểm tra quyền Giảng viên hoặc Admin
const requireTeacher = (req, res, next) => {
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này!' });
    }
};

module.exports = { verifyToken, requireTeacher };