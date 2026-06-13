const speech = require('@google-cloud/speech');
const { db } = require('../config/firebase');
const path = require('path');

// Khởi tạo client Speech-to-Text với chìa khóa bảo mật
const speechClient = new speech.SpeechClient({
    keyFilename: path.join(__dirname, '../config/gcs-key.json')
});

const generateTranscript = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const { gcsUri } = req.body;

        if (!gcsUri) {
            return res.status(400).json({ message: 'Vui lòng cung cấp gcsUri của video' });
        }

        // 1. Kiểm tra bài giảng có tồn tại không
        const lessonRef = db.collection('courses').doc(courseId).collection('lessons').doc(lessonId);
        const lessonDoc = await lessonRef.get();

        if (!lessonDoc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy bài giảng!' });
        }

        // 2. Cấu hình request gửi lên Google AI
        const audio = { uri: gcsUri };
        const config = {
            languageCode: 'vi-VN', // Hỗ trợ nhận diện tiếng Việt
            enableAutomaticPunctuation: true, // Tự động thêm dấu câu
        };

        const request = { audio, config };
        console.log('Đang gửi yêu cầu lên Google Speech-to-Text...');

        // Dùng longRunningRecognize cho các file video/audio có độ dài lớn
        const [operation] = await speechClient.longRunningRecognize(request);
        const [response] = await operation.promise();

        // 3. Gom các đoạn text nhận diện được thành một văn bản hoàn chỉnh
        const transcript = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        // 4. Lưu kết quả transcript vào Firestore của bài giảng đó
        await lessonRef.update({
            transcript: transcript || 'Không nhận diện được giọng nói trong video.',
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({
            message: 'Tạo transcript thành công!',
            transcript: transcript
        });

    } catch (error) {
        console.error('Lỗi khi gọi AI Speech-to-Text:', error);
        res.status(500).json({ message: 'Lỗi xử lý AI', error: error.message });
    }
};

module.exports = { generateTranscript };