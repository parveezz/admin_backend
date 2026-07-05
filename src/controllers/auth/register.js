const User = require('../../models/User');
const logActivity = require('../../utils/activityLogger');
const { sendTokenResponse } = require('./tokenHelper');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.registerUser = async (req, res, next) => {
  try {
    const fullName = req.body.fullName || req.body.fullname;
    const emailAddress = req.body.emailAddress || req.body.emailaddress;
    const password = req.body.password;

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
    });

    // Log activity
    await logActivity(user._id, 'User Registered', `${user.fullName} (${user.emailAddress}) registered as a user`);

    // Return session tokens
    await sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
