const { db } = require('../config/firebase');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Lấy danh sách Quiz của khóa học
const getQuizzes = async (req, res) => {
    try {
        const { courseId } = req.params;
        const snapshot = await db.collection('courses').doc(courseId).collection('quizzes').get();
        const quizzes = [];
        snapshot.forEach(doc => quizzes.push({ id: doc.id, ...doc.data() }));
        res.status(200).json(quizzes);
    } catch (error) {
        console.error('Lỗi lấy danh sách Quiz:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy 1 Quiz cụ thể
const getQuizById = async (req, res) => {
    try {
        const { courseId, quizId } = req.params;
        const doc = await db.collection('courses').doc(courseId).collection('quizzes').doc(quizId).get();
        if (!doc.exists) return res.status(404).json({ message: 'Không tìm thấy Quiz!' });
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Giảng viên tạo Quiz
const createQuiz = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description, timeLimit, maxAttempts, questions } = req.body;
        
        // Kiểm tra quyền (chỉ instructor của khóa học mới được tạo - bỏ qua bớt logic check quyền để làm nhanh, lý tưởng nên check)
        const courseDoc = await db.collection('courses').doc(courseId).get();
        if (!courseDoc.exists) return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
        if (courseDoc.data().teacherId !== req.user.userId) {
            return res.status(403).json({ message: 'Không có quyền sửa khóa học này!' });
        }

        const newQuiz = {
            title,
            description: description || '',
            timeLimit: parseInt(timeLimit) || 15,
            maxAttempts: parseInt(maxAttempts) || 0,
            questions: questions || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('courses').doc(courseId).collection('quizzes').add(newQuiz);
        res.status(201).json({ message: 'Tạo Quiz thành công!', quizId: docRef.id });
    } catch (error) {
        console.error('Lỗi tạo Quiz:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Giảng viên cập nhật Quiz
const updateQuiz = async (req, res) => {
    try {
        const { courseId, quizId } = req.params;
        const { title, description, timeLimit, maxAttempts, questions } = req.body;

        const courseDoc = await db.collection('courses').doc(courseId).get();
        if (!courseDoc.exists) return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
        if (courseDoc.data().teacherId !== req.user.userId) {
            return res.status(403).json({ message: 'Không có quyền sửa khóa học này!' });
        }

        const updateData = { updatedAt: new Date().toISOString() };
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (timeLimit !== undefined) updateData.timeLimit = parseInt(timeLimit);
        if (maxAttempts !== undefined) updateData.maxAttempts = parseInt(maxAttempts);
        if (questions !== undefined) updateData.questions = questions;

        await db.collection('courses').doc(courseId).collection('quizzes').doc(quizId).update(updateData);
        res.status(200).json({ message: 'Cập nhật Quiz thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Giảng viên xóa Quiz
const deleteQuiz = async (req, res) => {
    try {
        const { courseId, quizId } = req.params;

        const courseDoc = await db.collection('courses').doc(courseId).get();
        if (!courseDoc.exists) return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
        if (courseDoc.data().teacherId !== req.user.userId) {
            return res.status(403).json({ message: 'Không có quyền sửa khóa học này!' });
        }

        await db.collection('courses').doc(courseId).collection('quizzes').doc(quizId).delete();
        res.status(200).json({ message: 'Đã xóa Quiz thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ─── TÍNH NĂNG AI SINH CÂU HỎI TỰ ĐỘNG ───
const generateQuizByAI = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { numQuestions = 5 } = req.body; // Số lượng câu hỏi muốn đẻ (mặc định 5)

        // Lấy thông tin khóa học để làm prompt
        const courseDoc = await db.collection('courses').doc(courseId).get();
        if (!courseDoc.exists) return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
        if (courseDoc.data().teacherId !== req.user.userId) {
            return res.status(403).json({ message: 'Không có quyền truy cập khóa học này!' });
        }
        const courseData = courseDoc.data();

        // Lấy thêm các bài học để làm content
        const lessonsSnap = await db.collection('courses').doc(courseId).collection('lessons').get();
        let contentToRead = '';
        lessonsSnap.forEach(doc => {
            contentToRead += `\n- Bài: ${doc.data().title}\n  Mô tả: ${doc.data().description}`;
        });

        const prompt = `
            Bạn là một Giảng viên xuất sắc. Nhiệm vụ của bạn là soạn bộ ${numQuestions} câu hỏi trắc nghiệm (Multiple Choice)
            dựa trên nội dung Khóa học sau:
            Tên khóa học: "${courseData.title}"
            Mô tả khóa học: "${courseData.description}"
            Nội dung bài học: 
            ${contentToRead}

            Yêu cầu OUTPUT: 
            CHỈ TRẢ VỀ MỘT ARRAY JSON HỢP LỆ THEO FORMAT SAU (KHÔNG KÈM THEO MARKDOWN HAY BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI):
            [
              {
                "questionText": "Nội dung câu hỏi...",
                "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
                "correctOptionIndex": 0,
                "points": 1
              }
            ]
            Lưu ý: "correctOptionIndex" là vị trí của đáp án đúng trong mảng options (từ 0 đến 3).
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        let textResult = result.response.text();
        
        // Clean up markdown block if AI adds it
        if (textResult.includes('\`\`\`json')) {
            textResult = textResult.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        } else if (textResult.includes('\`\`\`')) {
            textResult = textResult.replace(/\`\`\`/g, '').trim();
        }

        const generatedQuestions = JSON.parse(textResult);

        res.status(200).json({ questions: generatedQuestions });
    } catch (error) {
        console.error('Lỗi AI sinh Quiz:', error);
        res.status(500).json({ message: 'Không thể tạo câu hỏi bằng AI', error: error.message });
    }
};

// ─── TÍNH NĂNG CHO HỌC VIÊN LÀM BÀI ───
const submitQuiz = async (req, res) => {
    try {
        const { courseId, quizId } = req.params;
        const { answers } = req.body; // Array of selected option index
        const studentId = req.user.userId;

        const quizDoc = await db.collection('courses').doc(courseId).collection('quizzes').doc(quizId).get();
        if (!quizDoc.exists) return res.status(404).json({ message: 'Không tìm thấy Quiz!' });
        
        const quizData = quizDoc.data();

        // Kiểm tra số lần làm
        const maxAttempts = quizData.maxAttempts || 0;
        const submissionsRef = db.collection('quiz_submissions');
        
        const existingSubmissions = await submissionsRef
            .where('quizId', '==', quizId)
            .where('studentId', '==', studentId)
            .get();

        if (maxAttempts > 0 && existingSubmissions.size >= maxAttempts) {
            return res.status(403).json({ message: 'Bạn đã vượt quá số lần làm bài tối đa!' });
        }

        // Chấm điểm
        let score = 0;
        let totalScore = 0;
        const results = quizData.questions.map((q, idx) => {
            const isCorrect = answers[idx] === q.correctOptionIndex;
            const points = q.points || 1;
            totalScore += points;
            if (isCorrect) score += points;
            return {
                questionId: q.id,
                selectedOption: answers[idx],
                correctOption: q.correctOptionIndex,
                isCorrect
            };
        });

        const submissionData = {
            courseId,
            quizId,
            studentId,
            answers,
            results,
            score,
            totalScore,
            submittedAt: new Date().toISOString()
        };

        const subRef = await submissionsRef.add(submissionData);

        res.status(200).json({
            message: 'Nộp bài thành công!',
            submissionId: subRef.id,
            score,
            totalScore,
            results
        });

    } catch (error) {
        console.error('Lỗi khi nộp bài Quiz:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const getMySubmissions = async (req, res) => {
    try {
        const { courseId, quizId } = req.params;
        const studentId = req.user.userId;

        const snapshot = await db.collection('quiz_submissions')
            .where('quizId', '==', quizId)
            .where('studentId', '==', studentId)
            .get();

        const submissions = [];
        snapshot.forEach(doc => submissions.push({ id: doc.id, ...doc.data() }));

        // Sắp xếp trong JS để tránh lỗi thiếu Composite Index của Firebase
        submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        res.status(200).json(submissions);
    } catch (error) {
        console.error('Lỗi lấy kết quả Quiz:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = {
    getQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz, generateQuizByAI, submitQuiz, getMySubmissions
};
