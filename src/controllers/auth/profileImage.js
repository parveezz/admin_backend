const User = require('../../models/User');
const sharp = require('sharp');
const logActivity = require('../../utils/activityLogger');
const { uploadFile, deleteFile } = require('../../utils/storage');

/**
 * @desc    Upload / Update profile image of the currently logged-in user
 * @route   PUT /api/auth/profile-image
 * @access  Private
 */
exports.updateProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file for your profile image',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // 1. If user already has a profile image, delete the old file assets
    if (user.profileImage) {
      let cloudId = null;
      if (user.profileImage.includes('cloudinary.com')) {
        // Extract public ID from cloudinary URL
        const parts = user.profileImage.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
          const publicIdWithFormat = parts.slice(uploadIndex + 2).join('/');
          cloudId = publicIdWithFormat.substring(0, publicIdWithFormat.lastIndexOf('.'));
        }
      }
      
      try {
        await deleteFile(user.profileImage, cloudId);
      } catch (err) {
        console.error('Failed to clean up old profile image:', err.message);
      }
    }

    // 2. Optimize profile image using Sharp (300x300 pixel avatar square crop, WebP)
    const avatarBuffer = await sharp(req.file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    // 3. Generate a small thumbnail avatar as well
    const thumbBuffer = await sharp(req.file.buffer)
      .resize(80, 80, { fit: 'cover' })
      .webp({ quality: 70 })
      .toBuffer();

    // 4. Upload file using storage utility
    const storageResult = await uploadFile(avatarBuffer, thumbBuffer, `avatar-${user._id}`);

    // Resolve path (format absolute URL if local storage fallback was used)
    let fileUrl = storageResult.url;
    if (!storageResult.cloudId) {
      fileUrl = `${req.protocol}://${req.get('host')}${storageResult.url}`;
    }

    // 5. Update user profile image url in database
    user.profileImage = fileUrl;
    await user.save();

    // Log profile image modification audit
    await logActivity(user._id, 'Profile Image Updated', 'User updated account avatar image');

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
