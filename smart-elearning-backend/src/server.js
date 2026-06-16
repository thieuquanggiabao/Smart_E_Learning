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
app.use(cors());
app.use(express.json());

// 2. Gắn route vào app (Phải đặt dưới app.use(express.json()) nhé)
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/courses', quizRoutes);
app.use('/api/courses', studySetRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api', assignmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/reviews', reviewRoutes);
app.get("/", (req, res) => {
    res.json({
        message: "Smart E-Learning Backend API is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});