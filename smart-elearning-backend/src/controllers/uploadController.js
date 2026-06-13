const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Khởi tạo kết nối Google Cloud Storage
const storage = new Storage({
    keyFilename: path.join(__dirname, '../config/gcs-key.json')
});

// Sử dụng đúng tên Bucket của bạn (bỏ phần gs:// đi)
const bucketName = 'smart-9e93c.firebasestorage.app';
const bucket = storage.bucket(bucketName);

const generateUploadUrl = async (req, res) => {
    try {
        const { fileName, contentType } = req.body;

        if (!fileName || !contentType) {
            return res.status(400).json({ message: 'Vui lòng cung cấp tên file và định dạng file' });
        }

        // Tạo tên file duy nhất kết hợp với timestamp để tránh ghi đè
        const uniqueFileName = `videos/${Date.now()}_${fileName}`;
        const file = bucket.file(uniqueFileName);

        // Yêu cầu Cloud Storage cấp một Signed URL với quyền 'write' (ghi)
        const [uploadUrl] = await file.getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // Đường link sẽ tự huỷ sau 15 phút
            contentType: contentType,
        });

        // Trả link cho Frontend
        res.status(200).json({
            message: 'Tạo URL upload thành công',
            uploadUrl: uploadUrl, // Frontend dùng link này để upload bằng phương thức PUT
            publicFileUrl: `https://storage.googleapis.com/${bucketName}/${uniqueFileName}` // Link xem video sau khi upload xong
        });

    } catch (error) {
        console.error('Lỗi khi tạo Signed URL:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};

module.exports = { generateUploadUrl };