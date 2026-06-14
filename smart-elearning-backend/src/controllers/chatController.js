const { db } = require('../config/firebase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const askChatbot = async (req, res) => {
    try {
        // 1. Lấy thêm lessonId từ body do frontend truyền lên
        const { courseId, lessonId, question } = req.body;
        const studentId = req.user.userId;

        if (!courseId || !lessonId || !question) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ courseId, lessonId và question!' });
        }

        console.log(`Đang lấy bối cảnh cho bài học ${lessonId} thuộc khóa ${courseId}...`);

        // 2. Lấy thông tin khóa học gốc
        const courseDoc = await db.collection('courses').doc(courseId).get();
        if (!courseDoc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
        }
        const courseData = courseDoc.data();

        // 3. Lấy thông tin chi tiết của ĐÚNG bài học mà học viên đang xem
        const lessonDoc = await db.collection('courses').doc(courseId).collection('lessons').doc(lessonId).get();
        if (!lessonDoc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy bài học này trong khóa học!' });
        }
        const lessonData = lessonDoc.data();

        // 4. Xây dựng ngữ cảnh siêu tập trung vào bài học hiện tại
        const courseContext = `
      Khóa học: ${courseData.title}
      Mô tả khóa học: ${courseData.description}
      
      Bài học hiện tại học viên đang học:
      - Tiêu đề bài: ${lessonData.title}
      - Nội dung/Mô tả bài học: ${lessonData.description}
    `;

        // 5. Thiết lập Prompt ép AI đóng vai gia sư cho bài học này
        const prompt = `
      Bạn là một trợ lý gia sư AI thân thiện và chuyên nghiệp của hệ thống Smart E-Learning.
      Nhiệm vụ của bạn là giải đáp thắc mắc của học viên xoay quanh bài học hiện tại dưới đây:
      
      --- BẮT ĐẦU BỐI CẢNH BÀI HỌC ---
      ${courseContext}
      --- KẾT THÚC BỐI CẢNH BÀI HỌC ---

      QUY TẮC:
      1. Tập trung giải thích, mở rộng kiến thức liên quan đến bài học hiện tại để giúp học viên hiểu bài hơn.
      2. Nếu câu hỏi quá lạc đề hoặc không liên quan gì đến khóa học/bài học, hãy từ chối khéo léo và hướng học viên quay lại bài học.
      
      Câu hỏi của học viên: "${question}"
    `;

        console.log('Đang gửi dữ liệu sang Gemini 2.5 Flash...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const aiAnswer = result.response.text();

        // 6. Lưu lịch sử chat - Đầy đủ cấu trúc bao gồm cả lessonId theo đề cương
        const chatRecord = {
            courseId: courseId,
            lessonId: lessonId,   // Đã bổ sung trường này đầy đủ
            studentId: studentId,
            question: question,
            answer: aiAnswer,
            createdAt: new Date().toISOString()
        };

        await db.collection('chat_history').add(chatRecord);

        res.status(200).json({
            message: 'Chatbot trả lời thành công',
            answer: aiAnswer
        });

    } catch (error) {
        console.error('Lỗi Chatbot AI:', error);
        res.status(500).json({ message: 'Lỗi server khi gọi Chatbot', error: error.message });
    }
};

module.exports = { askChatbot };