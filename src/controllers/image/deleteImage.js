const Image = require('../../models/Image');
const logActivity = require('../../utils/activityLogger');
const { deleteFile } = require('../../utils/storage');

/**
 * @desc    Delete an image permanently (Admin action)
 * @route   DELETE /api/images/:id
 * @access  Private/Admin
 */
exports.deleteImage = async (req, res) => {
  try {
    const image = await Image.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate('uploadedBy', 'fullName emailAddress');

    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }

    // 1. Delete image file/asset from hybrid storage (local disk or Cloudinary)
    await deleteFile(image.url, image.cloudId);

    // 2. Remove record from Database
    await Image.findByIdAndDelete(req.params.id);

    // 3. Broadcast real-time Socket.io notification
    const io = req.app.get('socketio');
    if (io) {
      io.emit('image:deleted', {
        message: `Image "${image.filename}" has been permanently deleted`,
        imageId: image._id,
      });
    }

    // 4. Log deletion action
    const uploaderInfo = image.uploadedBy 
      ? `uploaded by ${image.uploadedBy.fullName} (${image.uploadedBy.emailAddress})`
      : 'uploaded by unknown user';

    await logActivity(
      req.user._id,
      'Image Deleted',
      `Permanently deleted file "${image.filename}" (${uploaderInfo})`
    );

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
