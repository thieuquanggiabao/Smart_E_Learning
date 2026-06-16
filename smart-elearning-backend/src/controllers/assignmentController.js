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
        try {
            console.log('Đang tính toán điểm trung bình mới cho học viên...');

            // 1. Lấy toàn bộ bài nộp của học viên này trong khóa học hiện tại
            const submissionsSnapshot = await db.collection('submissions')
                .where('courseId', '==', courseId)
                .where('studentId', '==', studentId)
                .get();

            let totalScore = 0;
            let gradedCount = 0;

            // 2. Cộng dồn tất cả các điểm số AI hợp lệ
            submissionsSnapshot.forEach(doc => {
                const subData = doc.data();
                if (subData.gradingResult && subData.gradingResult.aiScore !== undefined) {
                    totalScore += parseFloat(subData.gradingResult.aiScore);
                    gradedCount++;
                }
            });

            // 3. Tính điểm trung bình cộng
            let newAverage = 0;
            if (gradedCount > 0) {
                newAverage = parseFloat((totalScore / gradedCount).toFixed(2));
            }

            // 4. Cập nhật bản ghi đăng ký (enrollment) của học viên
            const enrollmentSnapshot = await db.collection('enrollments')
                .where('courseId', '==', courseId)
                .where('studentId', '==', studentId)
                .get();

            if (!enrollmentSnapshot.empty) {
                const enrollmentDoc = enrollmentSnapshot.docs[0];
                await db.collection('enrollments').doc(enrollmentDoc.id).update({
                    averageScore: newAverage,
                    updatedAt: new Date().toISOString()
                });
                console.log(`Điểm trung bình đã được cập nhật thành ${newAverage}`);
            }
            const { checkAndGenerateCertificate } = require('../utils/certificateHelper');
            // ... sau khi update enrollment điểm trung bình:
            await checkAndGenerateCertificate(studentId, courseId);
        } catch (calcError) {
            console.error('Lỗi khi cập nhật điểm trung bình:', calcError);
            // Chúng ta log lỗi ra nhưng không chặn request chính, vì việc chấm điểm vẫn đã thành công
        }
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

const getAssignmentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const snapshot = await db.collection('assignments').where('courseId', '==', courseId).get();
        const assignments = snapshot.docs.map(doc => ({ assignmentId: doc.id, ...doc.data() }));
        res.status(200).json(assignments);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách bài tập:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const updateAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { title, description, rubric, maxScore, deadline } = req.body;

        const assignmentRef = db.collection('assignments').doc(assignmentId);
        const doc = await assignmentRef.get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập' });
        }

        const updatedData = {
            title: title || doc.data().title,
            description: description || doc.data().description,
            rubric: rubric || doc.data().rubric,
            maxScore: maxScore || doc.data().maxScore,
            deadline: deadline !== undefined ? deadline : doc.data().deadline,
            updatedAt: new Date().toISOString()
        };

        await assignmentRef.update(updatedData);

        res.status(200).json({ message: 'Cập nhật bài tập thành công!', assignment: { assignmentId, ...doc.data(), ...updatedData } });
    } catch (error) {
        console.error('Lỗi khi cập nhật bài tập:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const deleteAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const assignmentRef = db.collection('assignments').doc(assignmentId);
        const doc = await assignmentRef.get();
        
        if (!doc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập' });
        }

        await assignmentRef.delete();
        res.status(200).json({ message: 'Xóa bài tập thành công!' });
    } catch (error) {
        console.error('Lỗi khi xóa bài tập:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const getCourseSubmissions = async (req, res) => {
    try {
        const { courseId } = req.params;
        const submissionsSnapshot = await db.collection('submissions').where('courseId', '==', courseId).get();
        
        const submissions = [];
        for (const doc of submissionsSnapshot.docs) {
            const data = doc.data();
            
            const userDoc = await db.collection('users').doc(data.studentId).get();
            const studentName = userDoc.exists ? userDoc.data().name : 'Unknown';
            
            const assignmentDoc = await db.collection('assignments').doc(data.assignmentId).get();
            const assignmentTitle = assignmentDoc.exists ? assignmentDoc.data().title : 'Unknown';
            const maxScore = assignmentDoc.exists ? assignmentDoc.data().maxScore : 10;
            
            submissions.push({
                submissionId: doc.id,
                ...data,
                studentName,
                assignmentTitle,
                maxScore
            });
        }
        
        submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        
        res.status(200).json(submissions);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách bài nộp:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const overrideSubmissionScore = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { instructorScore, instructorFeedback } = req.body;
        
        const submissionRef = db.collection('submissions').doc(submissionId);
        const doc = await submissionRef.get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy bài nộp' });
        }
        
        const submissionData = doc.data();
        const courseId = submissionData.courseId;
        const studentId = submissionData.studentId;

        await submissionRef.update({
            instructorScore: parseFloat(instructorScore),
            instructorFeedback: instructorFeedback || '',
            status: 'overridden',
            updatedAt: new Date().toISOString()
        });

        try {
            const submissionsSnapshot = await db.collection('submissions')
                .where('courseId', '==', courseId)
                .where('studentId', '==', studentId)
                .get();

            let totalScore = 0;
            let gradedCount = 0;

            submissionsSnapshot.forEach(sDoc => {
                const subData = sDoc.data();
                const currentScore = sDoc.id === submissionId ? parseFloat(instructorScore) : 
                                    (subData.instructorScore !== undefined ? subData.instructorScore : subData.aiScore);
                
                if (currentScore !== undefined) {
                    totalScore += parseFloat(currentScore);
                    gradedCount++;
                }
            });

            let newAverage = 0;
            if (gradedCount > 0) {
                newAverage = parseFloat((totalScore / gradedCount).toFixed(2));
            }

            const enrollmentSnapshot = await db.collection('enrollments')
                .where('courseId', '==', courseId)
                .where('studentId', '==', studentId)
                .get();

            if (!enrollmentSnapshot.empty) {
                const enrollmentDoc = enrollmentSnapshot.docs[0];
                await db.collection('enrollments').doc(enrollmentDoc.id).update({
                    averageScore: newAverage,
                    updatedAt: new Date().toISOString()
                });
            }
            
            const { checkAndGenerateCertificate } = require('../utils/certificateHelper');
            await checkAndGenerateCertificate(studentId, courseId);
            
        } catch (calcError) {
            console.error('Lỗi cập nhật trung bình:', calcError);
        }

        res.status(200).json({ message: 'Đã cập nhật điểm thành công!' });
    } catch (error) {
        console.error('Lỗi khi ghi đè điểm:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = { createAssignment, submitAndGrade, getAssignmentsByCourse, updateAssignment, deleteAssignment, getCourseSubmissions, overrideSubmissionScore };