const User = require('../../models/User');
const logActivity = require('../../utils/activityLogger');
const { sendTokenResponse } = require('./tokenHelper');

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};

/**
 * @desc    Update currently logged-in user profile details (fullName, emailAddress)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateDetails = async (req, res, next) => {
  try {
    const fullName = req.body.fullName || req.body.fullname;
    const emailAddress = req.body.emailAddress || req.body.emailaddress;

    if (!fullName && !emailAddress) {
      return res.status(400).json({
        success: false,
        error: 'Please provide fullName or emailAddress to update',
      });
    }

    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (emailAddress) {
      const emailLower = emailAddress.toLowerCase();
      const userExists = await User.findOne({ emailAddress: emailLower, _id: { $ne: req.user.id } });
      if (userExists) {
        return res.status(400).json({
          success: false,
          error: 'Email address is already in use by another account',
        });
      }
      updates.emailAddress = emailLower;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true });

    // Log update activity
    await logActivity(req.user.id, 'Profile Updated', 'User updated account details');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};

/**
 * @desc    Update password of currently logged-in user
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide currentPassword and newPassword',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long',
      });
    }

    // Find current user explicitly selecting password field
    const user = await User.findById(req.user.id).select('+password');

    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Update password and clear active refresh tokens
    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();

    // Log update activity
    await logActivity(user._id, 'Password Changed', 'User updated account password');

    // Send access token and fresh refresh cookie response
    await sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
