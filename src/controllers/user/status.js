const User = require('../../models/User');
const logActivity = require('../../utils/activityLogger');

/**
 * @desc    Toggle User Status (suspend/unsuspend)
 * @route   PATCH /api/users/:id/status
 * @access  Private/Admin
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid status ('active' or 'suspended')",
      });
    }

    const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent administrative self-suspension
    if (req.user._id.toString() === user._id.toString() && status === 'suspended') {
      return res.status(400).json({
        success: false,
        error: 'You cannot suspend your own account',
      });
    }

    user.status = status;
    await user.save();

    // Log administrative action
    const actionName = status === 'suspended' ? 'User Suspended' : 'User Activated';
    await logActivity(
      req.user._id,
      actionName,
      `${status === 'suspended' ? 'Suspended' : 'Activated'} user account ${user.fullName} (${user.emailAddress})`
    );

    res.status(200).json({
      success: true,
      message: `User account has been successfully ${status === 'suspended' ? 'suspended' : 'activated'}.`,
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
