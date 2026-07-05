const Image = require('../../models/Image');
const logActivity = require('../../utils/activityLogger');
const sharp = require('sharp');
const { uploadFile } = require('../../utils/storage');

/**
 * @desc    Upload a new image (optimizes, converts to WebP, creates thumbnail)
 * @route   POST /api/images/upload
 * @access  Private (Authenticated users)
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file',
      });
    }

    // 1. Convert to optimized WebP format with sharp (80% quality compression)
    const mainBuffer = await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    // 2. Create optimized WebP thumbnail (150x150 size)
    const thumbBuffer = await sharp(req.file.buffer)
      .resize(150, 150, { fit: 'cover' })
      .webp({ quality: 70 })
      .toBuffer();

    // 3. Upload files to Cloudinary or write to local public/uploads directory
    const storageResult = await uploadFile(mainBuffer, thumbBuffer, req.file.originalname);

    // Format absolute URLs for client access if local storage was used
    let fileUrl = storageResult.url;
    let thumbnailUrl = storageResult.thumbnailUrl;
    if (!storageResult.cloudId) {
      fileUrl = `${req.protocol}://${req.get('host')}${storageResult.url}`;
      thumbnailUrl = `${req.protocol}://${req.get('host')}${storageResult.thumbnailUrl}`;
    }

    // 4. Register Image document in MongoDB
    const image = await Image.create({
      filename: storageResult.filename,
      url: fileUrl,
      thumbnailUrl: thumbnailUrl,
      cloudId: storageResult.cloudId,
      size: mainBuffer.length,
      format: 'webp',
      uploadedBy: req.user._id,
      moderationStatus: 'pending',
    });

    // 5. Broadcast real-time event to socket clients
    const io = req.app.get('socketio');
    if (io) {
      io.emit('image:uploaded', {
        message: `A new image has been uploaded by ${req.user.fullName}`,
        image: {
          _id: image._id,
          filename: image.filename,
          url: image.url,
          thumbnailUrl: image.thumbnailUrl,
          uploadedBy: {
            id: req.user._id,
            fullName: req.user.fullName,
          },
          createdAt: image.createdAt,
        },
      });
    }

    // 6. Log the audit activity
    await logActivity(
      req.user._id,
      'Image Uploaded',
      `Uploaded and optimized file "${req.file.originalname}" (optimized WebP: ${(mainBuffer.length / 1024).toFixed(2)} KB)`
    );

    res.status(201).json({
      success: true,
      message: 'Image uploaded and optimized successfully, pending moderation review.',
      image,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
