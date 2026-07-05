const User = require('../../models/User');
const Image = require('../../models/Image');
const logActivity = require('../../utils/activityLogger');

/**
 * @desc    Restore / Reactivate user
 * @route   PATCH /api/users/:id/restore
 * @access  Private/Admin
 */
exports.restoreUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.isDeleted) {
      return res.status(400).json({
        success: false,
        error: 'User account is already active and not deleted',
      });
    }

    // Restore user
    user.isDeleted = false;
    user.deletedAt = null;
    user.status = 'active';
    await user.save();

    // Cascading restore user's uploaded images
    await Image.updateMany(
      { uploadedBy: user._id },
      { $set: { isDeleted: false, deletedAt: null } }
    );

    // Log user restore
    await logActivity(req.user._id, 'User Restored', `Restored deleted user ${user.fullName} (${user.emailAddress})`);

    res.status(200).json({
      success: true,
      message: 'User restored successfully',
      user,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
