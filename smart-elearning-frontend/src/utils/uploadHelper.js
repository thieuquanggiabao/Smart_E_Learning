import api from '../services/api';

/**
 * Upload a file to Google Cloud Storage using Signed URL
 * @param {File} file - The file to upload
 * @param {string} folder - The destination folder (e.g., 'videos', 'groups', 'chat')
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadFileToStorage = async (file, folder = 'videos') => {
  try {
    // 1. Xin URL upload từ backend
    const res = await api.post('/upload/generate-url', {
      fileName: file.name,
      contentType: file.type,
      folder
    });

    const { uploadUrl, publicFileUrl } = res.data;

    // 2. Upload file trực tiếp lên GCS bằng URL vừa nhận
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    return publicFileUrl;
  } catch (error) {
    console.error('Lỗi upload file:', error);
    throw new Error('Không thể upload file');
  }
};
