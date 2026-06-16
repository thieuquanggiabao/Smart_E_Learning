const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
    keyFilename: path.join(__dirname, 'smart-elearning-backend/src/config/gcs-key.json')
});

const bucketName = 'smart-9e93c.firebasestorage.app';

async function setCors() {
  try {
    const bucket = storage.bucket(bucketName);
    const corsConfig = [
      {
        maxAgeSeconds: 3600,
        method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        origin: ['*'],
        responseHeader: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
      },
    ];
    await bucket.setCorsConfiguration(corsConfig);
    console.log('CORS has been successfully set for bucket: ' + bucketName);
  } catch (err) {
    console.error('Failed to set CORS:', err);
  }
}

setCors();
