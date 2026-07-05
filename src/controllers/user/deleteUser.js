const User = require('../../models/User');
const Image = require('../../models/Image');
const logActivity = require('../../utils/activityLogger');

/**
 * @desc    Delete user (Soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.status = 'suspended';
    await user.save();

    // Cascading soft-delete user's uploaded images
    await Image.updateMany(
      { uploadedBy: user._id },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    // Log user deletion
    await logActivity(req.user._id, 'User Deleted', `Deleted user ${user.fullName} (${user.emailAddress})`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
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
