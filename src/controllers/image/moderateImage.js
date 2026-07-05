const Image = require('../../models/Image');
const logActivity = require('../../utils/activityLogger');

/**
 * @desc    Moderate an uploaded image (approve or reject)
 * @route   PATCH /api/images/:id/moderate
 * @access  Private/Admin
 */
exports.moderateImage = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid moderation status ('approved' or 'rejected')",
      });
    }

    const image = await Image.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate('uploadedBy', 'fullName emailAddress');

    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }

    image.moderationStatus = status;
    await image.save();

    // Broadcast real-time Socket.io notification
    const io = req.app.get('socketio');
    if (io) {
      io.emit('image:moderated', {
        message: `Image "${image.filename}" has been marked as ${status.toUpperCase()}`,
        imageId: image._id,
        status: status,
      });
    }

    // Log administrative action
    const actionName = status === 'approved' ? 'Image Approved' : 'Image Rejected';
    const uploaderInfo = image.uploadedBy 
      ? `uploaded by ${image.uploadedBy.fullName} (${image.uploadedBy.emailAddress})`
      : 'uploaded by unknown user';

    await logActivity(
      req.user._id,
      actionName,
      `Moderated file "${image.filename}" to ${status.toUpperCase()} (${uploaderInfo})`
    );

    const mappedImage = {
      _id: image._id,
      originalFileName: image.filename,
      imageUrl: image.url,
      thumbnailUrl: image.thumbnailUrl,
      fileSize: image.size,
      fileExtension: image.format,
      status: image.moderationStatus,
      user: image.uploadedBy,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: `Image has been marked as ${status}.`,
      image: mappedImage,
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
