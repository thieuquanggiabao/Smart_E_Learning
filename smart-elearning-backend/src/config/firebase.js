const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('./serviceAccountKey.json');

// Khởi tạo kết nối với Firebase theo chuẩn mới
initializeApp({
    credential: cert(serviceAccount)
});

// Khởi tạo và xuất các dịch vụ ra để dùng cho toàn bộ dự án
const db = getFirestore();
const auth = getAuth();

console.log("🔥 Kết nối Firebase Admin thành công!");

module.exports = { db, auth };