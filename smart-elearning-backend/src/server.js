const express = require("express");
const cors = require("cors");
require("dotenv").config();

// 1. Import file authRoutes bạn vừa tạo
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express();
const chatRoutes = require('./routes/chatRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const quizRoutes = require('./routes/quizRoutes');
const studySetRoutes = require('./routes/studySetRoutes');
const groupRoutes = require('./routes/groupRoutes');
const liveRoutes = require('./routes/liveRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
app.use(cors());
app.use(express.json());

// 2. Gắn route vào app (Phải đặt dưới app.use(express.json()) nhé)
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/courses', quizRoutes);
app.use('/api/courses', studySetRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api', assignmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Smart E-Learning Backend API is running"
    });
});

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Lưu io vào app để dùng trong controllers: req.app.get('io')
app.set('io', io);

const { db } = require('./config/firebase');

io.on('connection', (socket) => {
    console.log('🔗 Client connected:', socket.id);

    socket.on('joinGroup', (groupId) => {
        socket.join(groupId);
        console.log(`👤 Socket ${socket.id} joined group ${groupId}`);
    });

    socket.on('leaveGroup', (groupId) => {
        socket.leave(groupId);
        console.log(`👋 Socket ${socket.id} left group ${groupId}`);
    });

    // NHẬN TIN NHẮN TỪ CLIENT
    socket.on('sendMessage', async (data) => {
        try {
            const { groupId, senderId, senderName, senderAvatar, text, fileUrl, fileType } = data;
            
            const messageData = {
                senderId,
                senderName,
                senderAvatar: senderAvatar || '',
                text: text || '',
                fileUrl: fileUrl || '',
                fileType: fileType || '',
                createdAt: new Date().toISOString()
            };

            // Lưu vào Firestore
            const docRef = await db.collection('groups').doc(groupId).collection('messages').add(messageData);
            
            const savedMessage = {
                id: docRef.id,
                ...messageData
            };

            // Gửi lại cho tất cả mọi người trong phòng (bao gồm cả người gửi để họ thấy tin nhắn đã lưu)
            io.to(groupId).emit('newMessage', savedMessage);
        } catch (error) {
            console.error('Lỗi khi lưu tin nhắn:', error);
            // Có thể emit ngược lại 1 event lỗi cho sender
            socket.emit('messageError', { error: 'Không thể gửi tin nhắn' });
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// 3. Khởi chạy Cron Jobs (Dọn rác giao dịch)
const { scheduleCleanupJobs } = require('./utils/cronJobs');
scheduleCleanupJobs();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});