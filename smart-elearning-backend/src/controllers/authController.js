const { auth, db } = require('../config/firebase');
require('dotenv').config();
const register = async (req, res) => {
    try {
        const { email, password, fullName, role } = req.body;

        // 1. Tạo user trong Firebase Authentication
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: fullName,
        });

        // 2. Lưu thông tin chi tiết vào collection 'users' trong Firestore
        const newUser = {
            userId: userRecord.uid,
            fullName: fullName,
            email: email,
            role: role || 'student', // Mặc định là học viên nếu không truyền
            avatarUrl: '',
            createdAt: new Date().toISOString()
        };

        await db.collection('users').doc(userRecord.uid).set(newUser);

        res.status(201).json({
            message: 'Đăng ký tài khoản thành công!',
            user: newUser
        });

    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ error: error.message });
    }
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const apiKey = process.env.FIREBASE_API_KEY;

        // 1. Gửi request đến Firebase REST API để kiểm tra mật khẩu
        // Node.js v18+ hỗ trợ sẵn fetch nên bạn không cần cài thêm thư viện
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                returnSecureToken: true
            })
        });

        const data = await response.json();

        // 2. Bắt lỗi nếu sai tài khoản/mật khẩu
        if (!response.ok) {
            return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác!', error: data.error.message });
        }

        // 3. Lấy thêm thông tin user (như fullName, role) từ Firestore
        const userDoc = await db.collection('users').doc(data.localId).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        // 4. Trả kết quả về cho Frontend
        res.status(200).json({
            message: 'Đăng nhập thành công!',
            token: data.idToken, // Token này dùng để xác thực các request sau này
            user: userData
        });

    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};
module.exports = { register, login };