const User = require('../../models/User');
const logActivity = require('../../utils/activityLogger');

/**
 * @desc    Create user (Admin action)
 * @route   POST /api/users
 * @access  Private/Admin
 */
exports.createUser = async (req, res) => {
  try {
    const fullName = req.body.fullName || req.body.fullname;
    const emailAddress = req.body.emailAddress || req.body.emailaddress;
    const password = req.body.password;
    const role = req.body.role || 'user';

    if (!fullName || !emailAddress || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide fullName, emailAddress, and password',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ emailAddress: emailAddress.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email address',
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      emailAddress,
      password,
      role,
    });

    // Log user creation
    await logActivity(req.user._id, 'User Created', `Created user ${user.fullName} (${user.emailAddress}) with role ${user.role}`);

    // Strip password field before returning
    const userResponse = await User.findById(user._id);

    res.status(201).json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
