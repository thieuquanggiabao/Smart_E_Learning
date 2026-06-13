const { db } = require('../config/firebase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo Gemini AI kết nối với chìa khóa trong .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Giảng viên tạo Bài tập & Tiêu chí chấm (Rubric)
// 1. Giảng viên tạo Bài tập & Tiêu chí chấm (Rubric)
const createAssignment = async (req, res) => {
    try {
        const { courseId } = req.params;
        // Lấy thêm lessonId và deadline từ body
        const { lessonId, title, description, rubric, maxScore, deadline } = req.body;

        // Ràng buộc: Bắt buộc phải truyền lessonId
        if (!lessonId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp lessonId cho bài tập này!' });
        }

        const newAssignment = {
            courseId: courseId,
            lessonId: lessonId, // Thêm trường này cho đúng thiết kế
            title: title || '',
            description: description || '',
            rubric: rubric || '',
            maxScore: maxScore || 10,
            deadline: deadline || null, // Thêm hạn nộp bài
            createdAt: new Date().toISOString()
        };

        const assignmentRef = await db.collection('assignments').add(newAssignment);

        res.status(201).json({
            message: 'Tạo bài tập thành công!',
            assignmentId: assignmentRef.id,
            assignment: newAssignment
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 2. Học viên nộp bài & AI tự động chấm
const submitAndGrade = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { answerText } = req.body;
        const studentId = req.user.userId; // Lấy từ token đăng nhập

        // 1. Lấy đề bài và rubric từ database
        const assignmentDoc = await db.collection('assignments').doc(assignmentId).get();
        if (!assignmentDoc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập!' });
        }
        const assignmentData = assignmentDoc.data();

        // 2. Tạo câu lệnh (Prompt) gửi cho Gemini
        const prompt = `
      Bạn là một giảng viên IT chuyên nghiệp. Hãy chấm điểm bài làm của học viên dựa trên tiêu chí sau:
      - Tiêu đề bài tập: ${assignmentData.title}
      - Yêu cầu: ${assignmentData.description}
      - Tiêu chí chấm (Rubric): ${assignmentData.rubric}
      - Điểm tối đa: ${assignmentData.maxScore}

      Bài làm của học viên: "${answerText}"

      Hãy trả về kết quả bằng định dạng JSON chính xác với cấu trúc sau (không giải thích thêm, không dùng markdown \`\`\`json):
      {
        "aiScore": <số điểm đánh giá>,
        "aiFeedback": "<nhận xét chi tiết ưu/nhược điểm>",
        "improvements": "<gợi ý cách để học viên làm tốt hơn>"
      }
    `;

        console.log('Đang nhờ Gemini chấm bài...');

        // 3. Gọi Gemini AI phiên bản siêu tốc (flash)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        let aiResponseText = result.response.text();

        // Làm sạch dữ liệu phòng trường hợp AI bọc thêm ký tự thừa
        aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiGrading = JSON.parse(aiResponseText);

        // 4. Lưu bài nộp và kết quả chấm vào Firestore
        const newSubmission = {
            assignmentId: assignmentId,
            courseId: assignmentData.courseId,
            studentId: studentId,
            answerText: answerText,
            aiScore: aiGrading.aiScore,
            aiFeedback: aiGrading.aiFeedback,
            improvements: aiGrading.improvements,
            status: 'graded',
            submittedAt: new Date().toISOString()
        };

        const submissionRef = await db.collection('submissions').add(newSubmission);

        res.status(201).json({
            message: 'Nộp bài thành công! AI đã chấm xong.',
            submissionId: submissionRef.id,
            gradingResult: newSubmission
        });

    } catch (error) {
        console.error('Lỗi chấm bài AI:', error);
        res.status(500).json({ message: 'Lỗi khi xử lý chấm bài', error: error.message });
    }
};

module.exports = { createAssignment, submitAndGrade };