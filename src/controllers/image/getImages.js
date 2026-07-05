const Image = require('../../models/Image');

/**
 * @desc    Get all images (paginated, with optional moderation status filtering)
 * @route   GET /api/images
 * @access  Private/Admin
 */
exports.getImages = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Optional status filtering, and hide soft-deleted images
    const filter = { isDeleted: { $ne: true } };
    if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
      filter.moderationStatus = req.query.status;
    }

    const total = await Image.countDocuments(filter);
    const images = await Image.find(filter)
      .populate('uploadedBy', 'fullName emailAddress status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const mappedImages = images.map((img) => {
      // Resolve absolute paths if they are local relative paths
      let imageUrl = img.url;
      if (img.url && !img.url.startsWith('http') && img.url.startsWith('/uploads')) {
        imageUrl = `${req.protocol}://${req.get('host')}${img.url}`;
      }
      
      let thumbUrl = img.thumbnailUrl || img.url;
      if (img.thumbnailUrl && !img.thumbnailUrl.startsWith('http') && img.thumbnailUrl.startsWith('/uploads')) {
        thumbUrl = `${req.protocol}://${req.get('host')}${img.thumbnailUrl}`;
      }

      return {
        // Keep raw database properties intact
        _id: img._id,
        filename: img.filename,
        url: img.url,
        size: img.size,
        format: img.format,
        uploadedBy: img.uploadedBy,
        moderationStatus: img.moderationStatus,
        cloudId: img.cloudId,
        thumbnailUrl: img.thumbnailUrl,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt,
        
        // Expose frontend mapped keys
        imageUrl: imageUrl,
        originalFileName: img.filename,
        fileSize: img.size,
        fileExtension: img.format || 'webp',
        status: img.moderationStatus,
        user: img.uploadedBy
          ? {
              id: img.uploadedBy._id,
              fullName: img.uploadedBy.fullName,
              emailAddress: img.uploadedBy.emailAddress,
              status: img.uploadedBy.status,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      count: mappedImages.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total,
      },
      images: mappedImages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
