const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Determine if Cloudinary configuration keys are available
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload main WebP image and thumbnail WebP image
 * @param {Buffer} mainBuffer - Optimized WebP main image buffer
 * @param {Buffer} thumbBuffer - WebP thumbnail buffer
 * @param {string} originalName - Original uploaded filename
 * @returns {Promise<{url: string, thumbnailUrl: string, cloudId: string|null, filename: string}>}
 */
const uploadFile = async (mainBuffer, thumbBuffer, originalName) => {
  const fileExtension = '.webp';
  // Standardize the filename
  const cleanBase = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueId = `${cleanBase}-${Date.now()}`;
  const filename = `${uniqueId}${fileExtension}`;
  const thumbFilename = `${uniqueId}-thumb${fileExtension}`;

  if (isCloudinaryConfigured) {
    try {
      // Upload main optimized image to Cloudinary
      const mainUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'user_uploads',
            public_id: uniqueId,
            format: 'webp',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(mainBuffer);
      });

      // Upload thumbnail to Cloudinary
      const thumbUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'user_uploads/thumbnails',
            public_id: `${uniqueId}-thumb`,
            format: 'webp',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(thumbBuffer);
      });

      return {
        url: mainUpload.secure_url,
        thumbnailUrl: thumbUpload.secure_url,
        cloudId: mainUpload.public_id,
        filename: originalName,
      };
    } catch (err) {
      console.error('Cloudinary upload error, using local storage fallback:', err.message);
    }
  }

  // Local storage fallback logic
  const uploadDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const mainPath = path.join(uploadDir, filename);
  const thumbPath = path.join(uploadDir, thumbFilename);

  // Write file buffers to local filesystem
  fs.writeFileSync(mainPath, mainBuffer);
  fs.writeFileSync(thumbPath, thumbBuffer);

  return {
    url: `/uploads/${filename}`,
    thumbnailUrl: `/uploads/${thumbFilename}`,
    cloudId: null,
    filename: originalName,
  };
};

/**
 * Delete image and thumbnail assets
 * @param {string} fileUrl - Main asset url
 * @param {string|null} cloudId - Cloudinary public id
 */
const deleteFile = async (fileUrl, cloudId) => {
  if (isCloudinaryConfigured && cloudId) {
    try {
      await cloudinary.uploader.destroy(cloudId);
      // Construct thumbnail public_id mapping
      const folderDelimiter = cloudId.lastIndexOf('/');
      const thumbPublicId = folderDelimiter !== -1 
        ? `${cloudId.substring(0, folderDelimiter)}/thumbnails/${cloudId.substring(folderDelimiter + 1)}-thumb`
        : `thumbnails/${cloudId}-thumb`;
      await cloudinary.uploader.destroy(thumbPublicId);
      return;
    } catch (err) {
      console.error('Cloudinary asset deletion failed:', err.message);
    }
  }

  // Local storage unlinking
  const cleanFilename = fileUrl.split('/').pop();
  const uploadDir = path.join(__dirname, '../../public/uploads');
  const mainPath = path.join(uploadDir, cleanFilename);
  const thumbFilename = cleanFilename.replace('.webp', '-thumb.webp');
  const thumbPath = path.join(uploadDir, thumbFilename);

  if (fs.existsSync(mainPath)) {
    fs.unlinkSync(mainPath);
  }
  if (fs.existsSync(thumbPath)) {
    fs.unlinkSync(thumbPath);
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  isCloudinaryConfigured,
};
