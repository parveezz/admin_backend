const User = require('../../models/User');
const logActivity = require('../../utils/activityLogger');

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Capture fields
    const fullName = req.body.fullName || req.body.fullname;
    const emailAddress = req.body.emailAddress || req.body.emailaddress;
    const role = req.body.role;
    const password = req.body.password;

    // Check email availability if changing email address
    if (emailAddress && emailAddress.toLowerCase() !== user.emailAddress) {
      const emailTaken = await User.findOne({ emailAddress: emailAddress.toLowerCase() });
      if (emailTaken) {
        return res.status(400).json({
          success: false,
          error: 'Email address is already in use by another account',
        });
      }
      user.emailAddress = emailAddress;
    }

    if (fullName) user.fullName = fullName;
    if (role) user.role = role;
    if (password) user.password = password; // pre('save') middleware will hash this automatically

    await user.save();

    // Log user update
    await logActivity(req.user._id, 'User Updated', `Updated user ${user.fullName} (${user.emailAddress})`);

    res.status(200).json({
      success: true,
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
