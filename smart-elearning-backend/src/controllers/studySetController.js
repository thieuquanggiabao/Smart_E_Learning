const { db } = require('../config/firebase');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Lấy danh sách bộ ôn tập của student hiện tại
const getMyStudySets = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.userId;

        const snapshot = await db.collection('courses').doc(courseId).collection('study_sets')
            .where('studentId', '==', studentId)
            .get();

        const sets = [];
        snapshot.forEach(doc => sets.push({ id: doc.id, ...doc.data() }));

        // Sắp xếp giảm dần theo thời gian tạo trong JS để tránh lỗi thiếu Composite Index của Firebase
        sets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json(sets);
    } catch (error) {
        console.error('Lỗi lấy study sets:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Gọi AI tạo bộ ôn tập (flashcard hoặc quiz)
const generateStudySetByAI = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.userId;
        const { type, amount = 5, title } = req.body; // type: 'flashcard' | 'quiz'

        // 1. Lấy thông tin nội dung khóa học
        const courseDoc = await db.collection('courses').doc(courseId).get();
        if (!courseDoc.exists) return res.status(404).json({ message: 'Khóa học không tồn tại' });
        const courseData = courseDoc.data();

        const lessonsSnap = await db.collection('courses').doc(courseId).collection('lessons').get();
        let contentToRead = '';
        lessonsSnap.forEach(doc => {
            contentToRead += `\n- Bài: ${doc.data().title}\n  Mô tả: ${doc.data().description}`;
        });

        // 2. Soạn Prompt cho AI
        let prompt = '';
        if (type === 'flashcard') {
            prompt = `
            Bạn là một trợ lý học tập. Hãy tạo bộ ${amount} thẻ ghi nhớ (Flashcard) dựa trên khóa học sau:
            Tên: "${courseData.title}"
            Mô tả: "${courseData.description}"
            Nội dung: ${contentToRead}

            YÊU CẦU: CHỈ TRẢ VỀ JSON THEO FORMAT SAU:
            [
              { "front": "Mặt trước (câu hỏi/khái niệm)...", "back": "Mặt sau (đáp án/giải thích)..." }
            ]
            `;
        } else {
            prompt = `
            Bạn là một trợ lý học tập. Hãy tạo bộ ${amount} câu hỏi trắc nghiệm ôn tập (Multiple Choice) dựa trên khóa học sau:
            Tên: "${courseData.title}"
            Mô tả: "${courseData.description}"
            Nội dung: ${contentToRead}

            YÊU CẦU: CHỈ TRẢ VỀ JSON THEO FORMAT SAU:
            [
              {
                "questionText": "Nội dung câu hỏi...",
                "options": ["A", "B", "C", "D"],
                "correctOptionIndex": 0,
                "explanation": "Giải thích tại sao đáp án lại đúng..."
              }
            ]
            `;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        let textResult = result.response.text();

        // 3. Xử lý chuỗi JSON
        if (textResult.includes('\`\`\`json')) {
            textResult = textResult.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        } else if (textResult.includes('\`\`\`')) {
            textResult = textResult.replace(/\`\`\`/g, '').trim();
        }

        const generatedContent = JSON.parse(textResult);

        // 4. Lưu vào CSDL
        const newSet = {
            studentId,
            title: title || `Bộ ${type === 'flashcard' ? 'thẻ ghi nhớ' : 'câu hỏi'} ôn tập (AI)`,
            type,
            content: generatedContent,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('courses').doc(courseId).collection('study_sets').add(newSet);

        res.status(200).json({
            message: 'Tạo bộ ôn tập thành công!',
            setId: docRef.id,
            ...newSet
        });

    } catch (error) {
        console.error('Lỗi AI tạo Study Set:', error);
        res.status(500).json({ message: 'Không thể tạo bộ ôn tập bằng AI', error: error.message });
    }
};

// Xóa bộ ôn tập
const deleteStudySet = async (req, res) => {
    try {
        const { courseId, setId } = req.params;
        const studentId = req.user.userId;

        const docRef = db.collection('courses').doc(courseId).collection('study_sets').doc(setId);
        const doc = await docRef.get();

        if (!doc.exists) return res.status(404).json({ message: 'Không tìm thấy bộ ôn tập' });
        if (doc.data().studentId !== studentId) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa bộ ôn tập này' });
        }

        await docRef.delete();
        res.status(200).json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = {
    getMyStudySets, generateStudySetByAI, deleteStudySet
};
