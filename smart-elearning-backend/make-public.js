const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
    keyFilename: path.join(__dirname, 'src/config/gcs-key.json')
});

const bucketName = 'smart-9e93c.firebasestorage.app';

async function makeBucketPublic() {
  try {
    const bucket = storage.bucket(bucketName);
    await bucket.makePublic({ includeFiles: true });
    console.log('Bucket ' + bucketName + ' is now publicly readable.');
  } catch (err) {
    console.error('Failed to make bucket public:', err);
  }
}

makeBucketPublic();
